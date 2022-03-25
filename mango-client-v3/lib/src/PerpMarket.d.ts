import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { BookSide, FillEvent, MangoAccount, MangoCache, MetaData, PerpEventQueue, PerpMarketConfig } from '.';
import { I80F48 } from './utils/fixednum';
import { Modify } from './utils/types';
import MangoGroup from './MangoGroup';
export declare type ParsedFillEvent = Modify<FillEvent, {
    price: number;
    quantity: number;
}>;
export default class PerpMarket {
    metaData: MetaData;
    publicKey: PublicKey;
    baseDecimals: number;
    quoteDecimals: number;
    mangoGroup: PublicKey;
    bids: PublicKey;
    asks: PublicKey;
    eventQueue: PublicKey;
    quoteLotSize: BN;
    baseLotSize: BN;
    longFunding: I80F48;
    shortFunding: I80F48;
    openInterest: BN;
    lastUpdated: BN;
    seqNum: BN;
    feesAccrued: I80F48;
    liquidityMiningInfo: {
        rate: I80F48;
        maxDepthBps: I80F48;
        periodStart: BN;
        targetPeriodLength: BN;
        mngoLeft: BN;
        mngoPerPeriod: BN;
    };
    mngoVault: PublicKey;
    priceLotsToUiConvertor: number;
    baseLotsToUiConvertor: number;
    _tickSize: number | undefined;
    _minOrderSize: number | undefined;
    constructor(publicKey: PublicKey, baseDecimals: number, quoteDecimals: number, decoded: any);
    priceLotsToNative(price: BN): I80F48;
    baseLotsToNative(quantity: BN): I80F48;
    priceLotsToNumber(price: BN): number;
    baseLotsToNumber(quantity: BN): number;
    get minOrderSize(): number;
    get tickSize(): number;
    /**
     * Calculate the instantaneous funding rate using the bids and asks
     * Reported as an hourly number
     * Make sure `cache`, `bids` and `asks` are up to date
     */
    getCurrentFundingRate(group: MangoGroup, cache: MangoCache, marketIndex: number, bids: BookSide, asks: BookSide): number;
    loadEventQueue(connection: Connection): Promise<PerpEventQueue>;
    loadFills(connection: Connection): Promise<ParsedFillEvent[]>;
    parseFillEvent(event: any): any;
    loadBids(connection: Connection, includeExpired?: boolean): Promise<BookSide>;
    loadAsks(connection: Connection, includeExpired?: boolean): Promise<BookSide>;
    loadOrdersForAccount(connection: Connection, account: MangoAccount, includeExpired?: boolean): Promise<import("./book").PerpOrder[]>;
    uiToNativePriceQuantity(price: number, quantity: number): [BN, BN];
    uiQuoteToLots(uiQuote: number): BN;
    toPrettyString(group: MangoGroup, perpMarketConfig: PerpMarketConfig): string;
}
//# sourceMappingURL=PerpMarket.d.ts.map