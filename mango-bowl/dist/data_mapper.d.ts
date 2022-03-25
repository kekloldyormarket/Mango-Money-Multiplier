import { PerpMarket } from '@blockworks-foundation/mango-client';
import { MessageEnvelope } from './mango_producer';
import { AccountsNotificationPayload } from './rpc_client';
export declare class DataMapper {
    private readonly _options;
    private _bidsAccountOrders;
    private _asksAccountOrders;
    private _bidsAccountPerpOrders;
    private _asksAccountPerpOrders;
    private _localBidsOrdersMap;
    private _localAsksOrdersMap;
    private _initialized;
    private _lastSeenSeqNum;
    private _l3SnapshotPublishRequested;
    private _currentL2Snapshot;
    private _currentQuote;
    private readonly _version;
    private _zeroWithPrecision;
    private readonly _recentTrades;
    constructor(_options: {
        readonly symbol: string;
        readonly market: PerpMarket;
        readonly priceDecimalPlaces: number;
        readonly sizeDecimalPlaces: number;
    });
    map({ accountsData, slot }: AccountsNotificationPayload): IterableIterator<MessageEnvelope>;
    private _addNewAndChangedOrderItemsToL3Diff;
    private _addDoneOrderItemsL3Diff;
    private _validateL3DiffCorrectness;
    private _mapToL2Snapshot;
    private _getL2Diff;
    private _l2LevelChanged;
    private _mapToL2Level;
    private _putInEnvelope;
    private _toMapConstructorStructure;
    private _mapEventToDataMessages;
    private _getNewlyAddedEvents;
    private _mapToOrderMessage;
    private _mapPerpOrderToOrderItem;
}
//# sourceMappingURL=data_mapper.d.ts.map