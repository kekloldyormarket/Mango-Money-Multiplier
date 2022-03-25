import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import PerpMarket from './PerpMarket';
export interface PerpOrder {
    orderId: BN;
    owner: PublicKey;
    openOrdersSlot: number;
    price: number;
    priceLots: BN;
    size: number;
    feeTier: number;
    sizeLots: BN;
    side: 'buy' | 'sell';
    clientId?: BN;
    bestInitial: BN;
    timestamp: BN;
    expiryTimestamp: BN;
}
export declare class BookSide {
    publicKey: PublicKey;
    isBids: boolean;
    perpMarket: PerpMarket;
    bumpIndex: number;
    freeListLen: number;
    freelistHead: number;
    rootNode: number;
    leafCount: number;
    nodes: any[];
    includeExpired: boolean;
    now: BN;
    constructor(publicKey: PublicKey, perpMarket: PerpMarket, decoded: any, includeExpired?: boolean);
    items(): Generator<PerpOrder>;
    /**
     * Return the ui price reached at `quantity` lots up the book;
     * return undefined if `quantity` not on book
     */
    getImpactPriceUi(quantity: BN): number | undefined;
    getBest(): PerpOrder | undefined;
    [Symbol.iterator](): Generator<PerpOrder, any, unknown>;
    getL2Ui(depth: number): [number, number][];
    getL2(depth: number): [number, number, BN, BN][];
}
export declare function getPriceFromKey(key: BN): BN;
//# sourceMappingURL=book.d.ts.map