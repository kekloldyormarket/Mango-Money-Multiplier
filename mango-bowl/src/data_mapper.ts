import {
  BookSide,
  BookSideLayout,
  FillEvent,
  LiquidateEvent,
  PerpEventLayout,
  PerpEventQueueHeaderLayout,
  PerpMarket,
  PerpOrder
} from '@blockworks-foundation/mango-client'
import BN from 'bn.js'
import { CircularBuffer } from './helpers'
import { logger } from './logger'
import { MessageEnvelope } from './mango_producer'
import { AccountsNotificationPayload } from './rpc_client'
import {
  Change,
  DataMessage,
  Done,
  Fill,
  L2,
  L3Snapshot,
  Open,
  OrderItem,
  PriceLevel,
  Quote,
  RecentTrades,
  Trade
} from './types'

// DataMapper maps bids, asks and evenQueue accounts data to normalized messages
export class DataMapper {
  private _bidsAccountOrders: OrderItem[] | undefined = undefined
  private _asksAccountOrders: OrderItem[] | undefined = undefined

  private _bidsAccountPerpOrders: PerpOrder[] | undefined = undefined
  private _asksAccountPerpOrders: PerpOrder[] | undefined = undefined

  // _local* are used only for verification purposes
  private _localBidsOrdersMap: Map<string, OrderItem> | undefined = undefined
  private _localAsksOrdersMap: Map<string, OrderItem> | undefined = undefined

  private _initialized = false
  private _lastSeenSeqNum: number | undefined = undefined
  private _l3SnapshotPublishRequested = false

  private _currentL2Snapshot:
    | {
        asks: PriceLevel[]
        bids: PriceLevel[]
      }
    | undefined = undefined

  private _currentQuote:
    | {
        readonly bestAsk: PriceLevel | undefined
        readonly bestBid: PriceLevel | undefined
      }
    | undefined = undefined

  private readonly _version: number
  private _zeroWithPrecision: string

  private readonly _recentTrades: CircularBuffer<Trade> = new CircularBuffer(100)

  constructor(
    private readonly _options: {
      readonly symbol: string
      readonly market: PerpMarket
      readonly priceDecimalPlaces: number
      readonly sizeDecimalPlaces: number
    }
  ) {
    this._version = this._options.market.metaData.version

    const zero = 0
    this._zeroWithPrecision = zero.toFixed(this._options.sizeDecimalPlaces)
  }

  public *map({ accountsData, slot }: AccountsNotificationPayload): IterableIterator<MessageEnvelope> {
    // the same timestamp for all messages received in single notification
    const timestamp = new Date().toISOString()

    const l3Diff: (Open | Fill | Done | Change)[] = []

    const newAsksSlabItems =
      accountsData.asks !== undefined
        ? [...new BookSide(undefined!, this._options.market, BookSideLayout.decode(accountsData.asks)).items()]
        : this._asksAccountPerpOrders

    const newAsksOrders =
      accountsData.asks !== undefined && newAsksSlabItems !== undefined
        ? newAsksSlabItems.map(this._mapPerpOrderToOrderItem)
        : this._asksAccountOrders

    const newBidsSlabItems =
      accountsData.bids !== undefined
        ? [...new BookSide(undefined!, this._options.market, BookSideLayout.decode(accountsData.bids)).items()]
        : this._bidsAccountPerpOrders

    const newBidsOrders =
      accountsData.bids !== undefined && newBidsSlabItems !== undefined
        ? newBidsSlabItems.map(this._mapPerpOrderToOrderItem)
        : this._bidsAccountOrders

    if (this._initialized && accountsData.eventQueue !== undefined) {
      const doneMessages: Done[] = []
      for (const event of this._getNewlyAddedEvents(accountsData.eventQueue)) {
        for (const item of this._mapEventToDataMessages(event, timestamp, slot)!) {
          if (item.type === 'fill' && item.maker === true) {
            // for maker fills check first if there's existing open order for it
            // as it may not exist in scenario where order was added to the order book and matched in the same slot

            const makerFill: Fill = item

            const currentOpenOrders = makerFill.side === 'buy' ? newBidsOrders! : newAsksOrders!
            const lastOpenOrders = makerFill.side === 'buy' ? this._bidsAccountOrders! : this._asksAccountOrders!

            const hasMatchingOpenOrder =
              currentOpenOrders.some((o) => o.orderId === makerFill.orderId) ||
              lastOpenOrders.some((o) => o.orderId === makerFill.orderId)

            if (hasMatchingOpenOrder === false) {
              const matchingOpenOrder = l3Diff.find((l) => l.orderId === makerFill.orderId && l.type === 'open')

              if (matchingOpenOrder !== undefined) {
                // check if we've already added an open order to the l3Diff as single maker order that was
                // matched in the same slot could be matched by multiple fills
                ;(matchingOpenOrder as any).size = (
                  Number(makerFill.size) + Number((matchingOpenOrder as any).size)
                ).toFixed(this._options.sizeDecimalPlaces)
              } else {
                const openMessage: Open = {
                  type: 'open',
                  market: this._options.symbol,
                  timestamp,
                  slot,
                  version: this._version,
                  orderId: makerFill.orderId,
                  clientId: makerFill.clientId,
                  side: makerFill.side,
                  price: makerFill.price,
                  size: makerFill.size,
                  account: makerFill.account,
                  accountSlot: makerFill.accountSlot,
                  eventTimestamp: makerFill.eventTimestamp
                }

                l3Diff.push(openMessage)

                const doneMessage: Done = {
                  type: 'done',
                  market: this._options.symbol,
                  timestamp,
                  slot,
                  version: this._version,
                  orderId: makerFill.orderId,
                  clientId: makerFill.clientId,
                  side: makerFill.side,
                  reason: 'filled',
                  account: makerFill.account,
                  accountSlot: makerFill.accountSlot,
                  sizeRemaining: undefined
                }

                doneMessages.push(doneMessage)
              }
            }
          }

          l3Diff.push(item)
        }
      }

      for (const doneMessage of doneMessages) {
        l3Diff.push(doneMessage)
      }
    }

    if (accountsData.asks !== undefined) {
      if (this._initialized) {
        const currentAsksMap = new Map(this._asksAccountOrders!.map(this._toMapConstructorStructure))

        for (const ask of newAsksOrders!) {
          const matchingExistingOrder = currentAsksMap.get(ask.orderId)
          this._addNewAndChangedOrderItemsToL3Diff(matchingExistingOrder, ask, timestamp, slot, l3Diff)

          currentAsksMap.delete(ask.orderId)
        }

        if (currentAsksMap.size > 0) {
          for (const orderToDelete of currentAsksMap.values()) {
            this._addDoneOrderItemsL3Diff(orderToDelete, timestamp, slot, l3Diff)
          }
        }
      }

      this._asksAccountPerpOrders = newAsksSlabItems
      this._asksAccountOrders = newAsksOrders
    }

    if (accountsData.bids !== undefined) {
      if (this._initialized) {
        const currentBidsMap = new Map(this._bidsAccountOrders!.map(this._toMapConstructorStructure))

        for (const bid of newBidsOrders!) {
          const matchingExistingOrder = currentBidsMap.get(bid.orderId)
          this._addNewAndChangedOrderItemsToL3Diff(matchingExistingOrder, bid, timestamp, slot, l3Diff)

          currentBidsMap.delete(bid.orderId)
        }

        if (currentBidsMap.size > 0) {
          for (const orderToDelete of currentBidsMap.values()) {
            this._addDoneOrderItemsL3Diff(orderToDelete, timestamp, slot, l3Diff)
          }
        }
      }

      this._bidsAccountPerpOrders = newBidsSlabItems
      this._bidsAccountOrders = newBidsOrders
    }

    if (this._initialized) {
      const diffIsValid = this._validateL3DiffCorrectness(l3Diff, slot)

      if (diffIsValid === false) {
        logger.log('warn', 'Invalid l3diff', {
          market: this._options.symbol,
          asksAccountExists: accountsData.asks !== undefined,
          bidsAccountExists: accountsData.bids !== undefined,
          eventQueueAccountExists: accountsData.eventQueue !== undefined,
          slot,
          l3DiffLength: l3Diff.length,
          l3Diff
        })

        this._l3SnapshotPublishRequested = true
      }
    }

    // initialize only when we have both asks and bids accounts data
    const shouldInitialize =
      this._initialized === false && this._asksAccountOrders !== undefined && this._bidsAccountOrders !== undefined

    const snapshotHasChanged =
      this._initialized === true && (accountsData.asks !== undefined || accountsData.bids !== undefined)

    if (shouldInitialize || snapshotHasChanged || this._l3SnapshotPublishRequested) {
      const l3Snapshot: L3Snapshot = {
        type: 'l3snapshot',
        market: this._options.symbol,
        timestamp,
        slot,
        version: this._version,
        asks: this._asksAccountOrders!,
        bids: this._bidsAccountOrders!
      }

      const isInit = this._initialized === false
      if (isInit && accountsData.eventQueue !== undefined) {
        // initialize with last sequence number
        const header = PerpEventQueueHeaderLayout.decode(accountsData.eventQueue) as PerpEventQueueHeader
        this._lastSeenSeqNum = header.seqNum.toNumber()
      }

      this._initialized = true

      const publishL3Snapshot = isInit || this._l3SnapshotPublishRequested

      if (this._l3SnapshotPublishRequested) {
        // reset local accounts info
        this._localAsksOrdersMap = new Map(this._asksAccountOrders!.map(this._toMapConstructorStructure))
        this._localBidsOrdersMap = new Map(this._bidsAccountOrders!.map(this._toMapConstructorStructure))

        logger.log('warn', 'Publishing full l3 snapshot as requested...', {
          market: this._options.symbol,
          slot
        })
      }

      yield this._putInEnvelope(l3Snapshot, publishL3Snapshot)
    }

    if (this._initialized === false) {
      return
    }

    if (this._currentL2Snapshot === undefined) {
      this._currentL2Snapshot = {
        asks: this._mapToL2Snapshot(this._asksAccountPerpOrders!),
        bids: this._mapToL2Snapshot(this._bidsAccountPerpOrders!)
      }

      const l2SnapshotMessage: L2 = {
        type: 'l2snapshot',
        market: this._options.symbol,
        timestamp,
        slot,
        version: this._version,
        asks: this._currentL2Snapshot.asks,
        bids: this._currentL2Snapshot.bids
      }

      this._currentQuote = {
        bestAsk: this._currentL2Snapshot.asks[0],
        bestBid: this._currentL2Snapshot.bids[0]
      }

      const quoteMessage: Quote = {
        type: 'quote',
        market: this._options.symbol,
        timestamp,
        slot,
        version: this._version,
        bestAsk: this._currentQuote.bestAsk,
        bestBid: this._currentQuote.bestBid
      }

      yield this._putInEnvelope(l2SnapshotMessage, true)
      yield this._putInEnvelope(quoteMessage, true)
    }

    // if account data has not changed, use current snapshot data
    // otherwise map new account data to l2
    const newL2Snapshot = {
      asks:
        accountsData.asks !== undefined
          ? this._mapToL2Snapshot(this._asksAccountPerpOrders!)
          : this._currentL2Snapshot.asks,

      bids:
        accountsData.bids !== undefined
          ? this._mapToL2Snapshot(this._bidsAccountPerpOrders!)
          : this._currentL2Snapshot.bids
    }

    const newQuote = {
      bestAsk: newL2Snapshot.asks[0],
      bestBid: newL2Snapshot.bids[0]
    }

    const bookIsCrossed =
      newL2Snapshot.asks.length > 0 &&
      newL2Snapshot.bids.length > 0 &&
      // best bid price is >= best ask price
      Number(newL2Snapshot.bids[0]![0]) >= Number(newL2Snapshot.asks[0]![0])

    if (bookIsCrossed) {
      logger.log('warn', 'Crossed L2 book', {
        market: this._options.symbol,
        quote: newQuote,
        slot
      })
    }

    const asksDiff =
      accountsData.asks !== undefined ? this._getL2Diff(this._currentL2Snapshot.asks, newL2Snapshot.asks) : []

    const bidsDiff =
      accountsData.bids !== undefined ? this._getL2Diff(this._currentL2Snapshot.bids, newL2Snapshot.bids) : []

    // publish l3Diff only if full l3 snapshot was not requested
    if (l3Diff.length > 0 && this._l3SnapshotPublishRequested === false) {
      for (let i = 0; i < l3Diff.length; i++) {
        const message = l3Diff[i]!

        yield this._putInEnvelope(message, true)

        // detect l2 trades based on fills
        if (message.type === 'fill' && message.maker === false) {
          let matchingMakerFill

          for (let j = i - 1; j >= 0; j--) {
            const potentialFillMessage = l3Diff[j]!

            if (
              potentialFillMessage.type === 'fill' &&
              potentialFillMessage.maker === true &&
              potentialFillMessage.size === message.size
            ) {
              matchingMakerFill = potentialFillMessage
              break
            }
          }

          const makerFillOrderId = matchingMakerFill !== undefined ? matchingMakerFill.orderId : undefined

          const makerFillAccount = matchingMakerFill !== undefined ? matchingMakerFill.account : undefined

          if (makerFillOrderId === undefined) {
            logger.log('warn', 'Trade without matching maker fill order', {
              market: this._options.symbol,
              slot,
              fill: message,
              l3Diff
            })
          }

          const tradeId = `${message.orderId}|${makerFillOrderId}`

          const tradeMessage: Trade = {
            type: 'trade',
            market: this._options.symbol,
            timestamp,
            slot,
            version: this._version,
            id: tradeId,
            side: message.side,
            price: message.price,
            size: message.size,
            eventTimestamp: message.eventTimestamp,
            takerAccount: message.account,
            makerAccount: makerFillAccount!
          }

          yield this._putInEnvelope(tradeMessage, true)

          this._recentTrades.append(tradeMessage)

          const recentTradesMessage: RecentTrades = {
            type: 'recent_trades',
            market: this._options.symbol,
            timestamp,
            trades: [...this._recentTrades.items()]
          }

          yield this._putInEnvelope(recentTradesMessage, false)
        }
      }
    }

    // we've published new l3snapshot so let's reset the flag
    this._l3SnapshotPublishRequested = false

    if (asksDiff.length > 0 || bidsDiff.length > 0) {
      if (l3Diff.length === 0) {
        logger.log('warn', 'L2 diff without corresponding L3 diff', {
          market: this._options.symbol,
          asksAccountExists: accountsData.asks !== undefined,
          bidsAccountExists: accountsData.bids !== undefined,
          eventQueueAccountExists: accountsData.eventQueue !== undefined,
          slot,
          asksDiff,
          bidsDiff
        })

        // when next account update will come instead of providing l3diff we'll publish full l3 snapshot
        this._l3SnapshotPublishRequested = true
      }

      // since we have a diff it means snapshot has changed
      // so we need to pass new snapshot to minions, just without 'publish' flag
      this._currentL2Snapshot = newL2Snapshot

      const l2Snapshot: L2 = {
        type: 'l2snapshot',
        market: this._options.symbol,
        timestamp,
        slot,
        version: this._version,
        asks: this._currentL2Snapshot.asks,
        bids: this._currentL2Snapshot.bids
      }
      const l2UpdateMessage: L2 = {
        type: 'l2update',
        market: this._options.symbol,
        timestamp,
        slot,
        version: this._version,
        asks: asksDiff,
        bids: bidsDiff
      }

      // first goes update
      yield this._putInEnvelope(l2UpdateMessage, true)
      // then snapshot, as new snapshot already includes update
      yield this._putInEnvelope(l2Snapshot, false)

      const quoteHasChanged =
        this._l2LevelChanged(this._currentQuote!.bestAsk, newQuote.bestAsk) ||
        this._l2LevelChanged(this._currentQuote!.bestBid, newQuote.bestBid)

      if (quoteHasChanged) {
        this._currentQuote = newQuote

        const quoteMessage: Quote = {
          type: 'quote',
          market: this._options.symbol,
          timestamp,
          slot,
          version: this._version,
          bestAsk: this._currentQuote.bestAsk,
          bestBid: this._currentQuote.bestBid
        }

        yield this._putInEnvelope(quoteMessage, true)
      }
    }
  }

  private _addNewAndChangedOrderItemsToL3Diff(
    matchingExistingOrder: OrderItem | undefined,
    newOrder: OrderItem,
    timestamp: string,
    slot: number,
    l3Diff: (Open | Fill | Done | Change)[]
  ) {
    if (matchingExistingOrder === undefined) {
      const matchingFills = l3Diff.filter((i) => i.type === 'fill' && i.orderId === newOrder.orderId)
      let size = newOrder.size

      if (matchingFills.length > 0) {
        for (const matchingFill of matchingFills) {
          // add matching fill size to open order size
          // so when open and fill events are consumed, provide correct info
          size = (Number(size) + Number((matchingFill as any).size)).toFixed(this._options.sizeDecimalPlaces)
        }
      }

      const openMessage = this._mapToOrderMessage(newOrder, 'open', size, timestamp, slot)

      const matchingL3Index = l3Diff.findIndex((i) => i.orderId === newOrder.orderId)

      // insert open order before first matching l3 index if it exists
      if (matchingL3Index !== -1) {
        l3Diff.splice(matchingL3Index, 0, openMessage)
      } else {
        // if there's not matching fill/done l3 add open order at the end
        l3Diff.push(openMessage)
      }
    } else if (
      matchingExistingOrder.size !== newOrder.size &&
      l3Diff.some((i) => i.type === 'fill' && i.orderId === newOrder.orderId && i.maker) === false
    ) {
      // we have order change, can happen when  SelfTradeBehavior::DecrementTake?
      const changeMessage = this._mapToOrderMessage(newOrder, 'change', newOrder.size, timestamp, slot)

      const matchingL3Index = l3Diff.findIndex((i) => i.orderId === newOrder.orderId)

      // insert open order before first matching l3 index if it exists
      if (matchingL3Index !== -1) {
        l3Diff.splice(matchingL3Index, 0, changeMessage)
      } else {
        // if there's not matching fill/done l3 add open order at the end
        l3Diff.push(changeMessage)
      }
    }
  }

  private _addDoneOrderItemsL3Diff(
    doneOrderItem: OrderItem,
    timestamp: string,
    slot: number,
    l3Diff: (Open | Fill | Done | Change)[]
  ) {
    let reason
    let sizeRemaining

    const matchingFills: Fill[] = l3Diff.filter(
      (f) => f.type === 'fill' && f.maker === true && f.orderId === doneOrderItem.orderId
    ) as Fill[]

    if (matchingFills.length > 0) {
      const matchingFillsSize = matchingFills.reduce((prev, curr) => {
        return prev + Number(curr.size)
      }, 0)

      const diff = Number(doneOrderItem.size) - matchingFillsSize
      if (diff > 0) {
        // open order was filled but only partially and it's done now meaning it was canceled after a fill
        reason = 'canceled' as const
        sizeRemaining = diff.toFixed(this._options.sizeDecimalPlaces)
      } else {
        // order was fully filled as open order size matches fill size
        reason = 'filled' as const
      }
    } else {
      // no matching fill order means normal cancellation
      reason = 'canceled' as const
      sizeRemaining = doneOrderItem.size
    }

    const doneMessage: Done = {
      type: 'done',
      market: this._options.symbol,
      timestamp,
      slot,
      version: this._version,
      orderId: doneOrderItem.orderId,
      clientId: doneOrderItem.clientId,
      side: doneOrderItem.side,
      reason: reason,
      account: doneOrderItem.account,
      accountSlot: doneOrderItem.accountSlot,
      sizeRemaining
    }

    l3Diff.push(doneMessage)
  }

  private _validateL3DiffCorrectness(l3Diff: (Open | Fill | Done | Change)[], slot: number) {
    // first make sure we have initial snapshots to apply diffs to

    if (this._localAsksOrdersMap === undefined && this._localBidsOrdersMap === undefined) {
      this._localAsksOrdersMap = new Map(this._asksAccountOrders!.map(this._toMapConstructorStructure))
      this._localBidsOrdersMap = new Map(this._bidsAccountOrders!.map(this._toMapConstructorStructure))

      return true
    }
    for (const item of l3Diff) {
      const ordersMap = (item.side === 'buy' ? this._localBidsOrdersMap : this._localAsksOrdersMap)!
      if (item.type === 'open') {
        ordersMap.set(item.orderId, {
          orderId: item.orderId,
          clientId: item.clientId,
          side: item.side,
          price: item.price,
          size: item.size,
          account: item.account,
          accountSlot: item.accountSlot,
          eventTimestamp: item.eventTimestamp
        })
      }

      if (item.type === 'fill') {
        const matchingOrder = ordersMap.get(item.orderId)

        if (matchingOrder !== undefined) {
          ;(matchingOrder as any).size = (Number((matchingOrder as any).size) - Number(item.size)).toFixed(
            this._options.sizeDecimalPlaces
          )
        } else if (item.maker === true) {
          logger.log('warn', 'Maker fill without open message', {
            market: this._options.symbol,
            fill: item,
            slot
          })

          return false
        }
      }

      if (item.type === 'change') {
        const matchingOrder = ordersMap.get(item.orderId)
        ;(matchingOrder as any).size = item.size
      }

      if (item.type === 'done') {
        ordersMap.delete(item.orderId)
      }
    }

    if (this._bidsAccountOrders!.length !== this._localBidsOrdersMap!.size) {
      logger.log('warn', 'Bids orders count do not match', {
        market: this._options.symbol,
        currentBidsCount: this._bidsAccountOrders!.length,
        localBidsCount: this._localBidsOrdersMap!.size,
        slot
      })

      return false
    }

    for (let bid of this._bidsAccountOrders!) {
      const matchingLocalBid = this._localBidsOrdersMap!.get(bid.orderId)
      if (
        matchingLocalBid === undefined ||
        matchingLocalBid.price !== bid.price ||
        matchingLocalBid.size !== bid.size
      ) {
        logger.log('warn', 'Bid order do not match', {
          market: this._options.symbol,
          localBid: matchingLocalBid,
          currentBid: bid,
          slot
        })

        return false
      }
    }

    if (this._asksAccountOrders!.length !== this._localAsksOrdersMap!.size) {
      logger.log('warn', 'Asks orders count do not match', {
        market: this._options.symbol,
        currentAsksCount: this._asksAccountOrders!.length,
        localAsksCount: this._localAsksOrdersMap!.size,
        slot
      })

      return false
    }

    for (let ask of this._asksAccountOrders!) {
      const matchingLocalAsk = this._localAsksOrdersMap!.get(ask.orderId)
      if (
        matchingLocalAsk === undefined ||
        matchingLocalAsk.price !== ask.price ||
        matchingLocalAsk.size !== ask.size
      ) {
        logger.log('warn', 'Bid order do not match', {
          market: this._options.symbol,
          localAsk: matchingLocalAsk,
          currentAsk: ask,
          slot
        })

        return false
      }
    }

    return true
  }

  private _mapToL2Snapshot(orders: PerpOrder[]) {
    const levels: [BN, BN][] = []

    for (const { priceLots, sizeLots } of orders) {
      if (levels.length > 0 && levels[levels.length - 1]![0].eq(priceLots)) {
        levels[levels.length - 1]![1] = levels[levels.length - 1]![1].add(sizeLots)
      } else {
        levels.push([priceLots, sizeLots])
      }
    }

    return levels.map(this._mapToL2Level)
  }

  private _getL2Diff(currentLevels: PriceLevel[], newLevels: PriceLevel[]): PriceLevel[] {
    const currentLevelsMap = new Map(currentLevels)

    const l2Diff: PriceLevel[] = []

    for (const newLevel of newLevels) {
      const matchingCurrentLevelSize = currentLevelsMap.get(newLevel[0])

      if (matchingCurrentLevelSize !== undefined) {
        const levelSizeChanged = matchingCurrentLevelSize !== newLevel[1]

        if (levelSizeChanged) {
          l2Diff.push(newLevel)
        }
        // remove from current levels map so we know that such level exists in new levels
        currentLevelsMap.delete(newLevel[0])
      } else {
        // completely new price level
        l2Diff.push(newLevel)
      }
    }

    for (const levelToRemove of currentLevelsMap) {
      const l2Delete: PriceLevel = [levelToRemove[0], this._zeroWithPrecision]

      l2Diff.unshift(l2Delete)
    }

    return l2Diff
  }

  private _l2LevelChanged(currentLevel: PriceLevel | undefined, newLevel: PriceLevel | undefined) {
    if (currentLevel === undefined && newLevel === undefined) {
      return false
    }

    if (currentLevel === undefined && newLevel !== undefined) {
      return true
    }

    if (currentLevel !== undefined && newLevel === undefined) {
      return true
    }

    // price has changed
    if (currentLevel![0] !== newLevel![0]) {
      return true
    }

    // size has changed
    if (currentLevel![1] !== newLevel![1]) {
      return true
    }

    return false
  }

  private _mapToL2Level = (level: [BN, BN]): PriceLevel => {
    const price = this._options.market.priceLotsToNumber(level[0]).toFixed(this._options.priceDecimalPlaces)
    const size = this._options.market.baseLotsToNumber(level[1]).toFixed(this._options.sizeDecimalPlaces)

    return [price, size]
  }

  private _putInEnvelope(message: DataMessage | RecentTrades, publish: boolean) {
    const envelope: MessageEnvelope = {
      type: message.type,
      market: message.market,
      publish,
      payload: JSON.stringify(message),
      timestamp: message.timestamp
    }

    return envelope
  }

  private _toMapConstructorStructure(orderItem: OrderItem): [string, OrderItem] {
    return [orderItem.orderId, orderItem]
  }

  private *_mapEventToDataMessages(eventInfo: MangoFillEvent | MangoLiquidateEvent, timestamp: string, slot: number) {
    if (eventInfo.eventType === 'fill') {
      const fillEvent = eventInfo.data
      const size = this._options.market.baseLotsToNumber(fillEvent.quantity)
      const price = this._options.market.priceLotsToNumber(fillEvent.price)
      const value = size * price
      const eventTimestamp = new Date(fillEvent.timestamp.toNumber() * 1000).toISOString()

      const makerFillMessage: Fill = {
        type: 'fill',
        market: this._options.symbol,
        timestamp,
        slot,
        version: this._version,
        orderId: fillEvent.makerOrderId.toString(),
        clientId: fillEvent.makerClientOrderId.toString(),
        side: fillEvent.takerSide === 'buy' ? 'sell' : 'buy',
        price: price.toFixed(this._options.priceDecimalPlaces),
        size: size.toFixed(this._options.sizeDecimalPlaces),
        maker: true,
        feeCost: fillEvent.makerFee.toNumber() * value,
        account: fillEvent.maker.toBase58(),
        accountSlot: fillEvent.makerSlot,
        eventTimestamp
      }

      yield makerFillMessage

      const takerFillMessage: Fill = {
        type: 'fill',
        market: this._options.symbol,
        timestamp,
        slot,
        version: this._version,
        orderId: fillEvent.takerOrderId.toString(),
        clientId: fillEvent.takerClientOrderId.toString(),
        side: fillEvent.takerSide === 'buy' ? 'buy' : 'sell',
        price: price.toFixed(this._options.priceDecimalPlaces),
        size: size.toFixed(this._options.sizeDecimalPlaces),
        maker: false,
        feeCost: fillEvent.takerFee.toNumber() * value,
        account: fillEvent.taker.toBase58(),
        accountSlot: 0,
        eventTimestamp
      }

      yield takerFillMessage
    } else if (eventInfo.eventType === 'liquidate') {
      // eventInfo.data.
      //  event.data.
      // TODO: parse liquidation events
    }
  }

  private *_getNewlyAddedEvents(eventQueueData: Buffer) {
    const header = PerpEventQueueHeaderLayout.decode(eventQueueData) as PerpEventQueueHeader

    // based on seqNum provided by event queue we can calculate how many events have been added
    // to the queue since last update (header.seqNum - _lastSeenSeqNum)
    // if we don't have stored _lastSeenSeqNum it means it's first notification so let's just initialize _lastSeenSeqNum

    if (this._lastSeenSeqNum !== undefined) {
      const allocLen = Math.floor((eventQueueData.length - PerpEventQueueHeaderLayout.span) / PerpEventLayout.span)

      const newEventsCount = Math.min(header.seqNum.toNumber() - this._lastSeenSeqNum, allocLen - 1)

      for (let i = newEventsCount; i > 0; --i) {
        const nodeIndex = (header.head.toNumber() + header.count.toNumber() + allocLen - i) % allocLen
        const decodedItem = PerpEventLayout.decode(
          eventQueueData,
          PerpEventQueueHeaderLayout.span + nodeIndex * PerpEventLayout.span
        )

        if (decodedItem.fill) {
          const fillEvent: MangoFillEvent = { eventType: 'fill', data: decodedItem.fill }

          yield fillEvent
        } else if (decodedItem.liquidate) {
          const liquidateEvent: MangoLiquidateEvent = { eventType: 'liquidate', data: decodedItem.liquidate }

          yield liquidateEvent
        }
      }
    }

    this._lastSeenSeqNum = header.seqNum.toNumber()
  }

  private _mapToOrderMessage(
    { orderId, clientId, side, price, account, accountSlot, eventTimestamp }: OrderItem,
    type: 'open' | 'change',
    size: string,
    timestamp: string,
    slot: number
  ): Open | Change {
    if (type === 'open') {
      return {
        type,
        market: this._options.symbol,
        timestamp,
        slot,
        version: this._version,
        orderId,
        clientId,
        side,
        price,
        size,
        account,
        accountSlot,
        eventTimestamp
      }
    } else {
      return {
        type,
        market: this._options.symbol,
        timestamp,
        slot,
        version: this._version,
        orderId,
        clientId,
        side,
        price,
        size,
        account,
        accountSlot
      }
    }
  }

  private _mapPerpOrderToOrderItem = ({
    orderId,
    clientId,
    side,
    price,
    size,
    owner,
    openOrdersSlot,
    timestamp
  }: PerpOrder) => {
    const orderItem: OrderItem = {
      orderId: orderId.toString(),
      clientId: clientId !== undefined ? clientId.toString() : '0',
      side: side === 'buy' ? 'buy' : 'sell',
      price: price.toFixed(this._options.priceDecimalPlaces),
      size: size.toFixed(this._options.sizeDecimalPlaces),
      account: owner.toBase58(),
      accountSlot: openOrdersSlot,
      eventTimestamp: new Date(timestamp.toNumber() * 1000).toISOString()
    }

    return orderItem
  }
}

type MangoFillEvent = { eventType: 'fill'; data: FillEvent }
type MangoLiquidateEvent = { eventType: 'liquidate'; data: LiquidateEvent }

type PerpEventQueueHeader = {
  seqNum: BN
  head: BN
  count: BN
}
