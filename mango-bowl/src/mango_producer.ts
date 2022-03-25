import { MangoClient } from '@blockworks-foundation/mango-client'
import { PublicKey } from '@solana/web3.js'
import { isMainThread, workerData } from 'worker_threads'
import { MessageType } from './consts'
import { DataMapper } from './data_mapper'
import { decimalPlaces, mangoDataChannel, mangoProducerReadyChannel } from './helpers'
import { logger } from './logger'
import { RPCClient } from './rpc_client'
import { MangoPerpMarketInfo } from './types'

if (isMainThread) {
  const message = 'Exiting. Worker is not meant to run in main thread'
  logger.log('error', message)

  throw new Error(message)
}

process.on('unhandledRejection', (err) => {
  throw err
})

// MangoProducer responsibility is to:
// - connect to Solana Node RPC API via WS and subscribe to single Mango perp market
// - map received data to normalized data messages and broadcast those

export class MangoProducer {
  constructor(
    private readonly _options: {
      nodeEndpoint: string
      wsEndpointPort: number | undefined
      market: MangoPerpMarketInfo
      commitment: string
    }
  ) {}

  public async run(onData: OnDataCallback) {
    let started = false
    logger.log('info', `Mango producer starting for ${this._options.market.name} market...`)

    // don't use Solana web3.js Connection but custom rpcClient so we have more control and insight what is going on
    const rpcClient = new RPCClient({
      nodeEndpoint: this._options.nodeEndpoint,
      commitment: this._options.commitment,
      wsEndpointPort: this._options.wsEndpointPort
    })

    const mangoClient = new MangoClient(rpcClient as any, new PublicKey(this._options.market.programId))
    const mangoGroup = await mangoClient.getMangoGroup(new PublicKey(this._options.market.groupPublicKey))

    const market = await mangoGroup.loadPerpMarket(
      rpcClient as any,
      this._options.market.marketIndex,
      this._options.market.baseDecimals,
      this._options.market.quoteDecimals
    )

    const priceDecimalPlaces = decimalPlaces(market.tickSize)
    const sizeDecimalPlaces = decimalPlaces(market.minOrderSize)

    const dataMapper = new DataMapper({
      symbol: this._options.market.name,
      market,
      priceDecimalPlaces,
      sizeDecimalPlaces
    })

    let start = process.hrtime()
    const interval = 600

    // based on https://github.com/tj/node-blocked/blob/master/index.js
    setInterval(() => {
      const delta = process.hrtime(start)
      const nanosec = delta[0] * 1e9 + delta[1]
      const ms = nanosec / 1e6
      const n = ms - interval

      if (n > 200) {
        logger.log('info', `Event loop blocked for ${Math.round(n)} ms.`, {
          market: this._options.market.name
        })
      }

      start = process.hrtime()
    }, interval).unref()

    for await (const notification of rpcClient.streamAccountsNotification(market, this._options.market.name)) {
      if (started === false) {
        logger.log('info', `Mango producer started for ${this._options.market.name} market...`)
        started = true
        mangoProducerReadyChannel.postMessage('ready')
      }

      const messagesForSlot = [...dataMapper.map(notification)]

      if (messagesForSlot.length > 0) {
        onData(messagesForSlot)
      }
    }
  }
}

const mangoProducer = new MangoProducer(workerData)

mangoProducer.run((envelopes) => {
  mangoDataChannel.postMessage(envelopes)
})

export type MessageEnvelope = {
  type: MessageType
  market: string
  publish: boolean
  payload: string
  timestamp: string
}

type OnDataCallback = (envelopes: MessageEnvelope[]) => void
