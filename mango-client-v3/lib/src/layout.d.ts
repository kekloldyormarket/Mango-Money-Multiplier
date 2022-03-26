/// <reference types="node" />
import { Blob, Layout, Structure, UInt, Union } from 'buffer-layout';
import { PublicKey } from '@solana/web3.js';
import { I80F48 } from './utils/fixednum';
import BN from 'bn.js';
import PerpAccount from './PerpAccount';
import { PerpOrderType } from './utils/types';
export declare const MAX_TOKENS = 16;
export declare const MAX_PAIRS: number;
export declare const MAX_NODE_BANKS = 8;
export declare const INFO_LEN = 32;
export declare const QUOTE_INDEX: number;
export declare const MAX_NUM_IN_MARGIN_BASKET = 9;
export declare const MAX_PERP_OPEN_ORDERS = 64;
export declare const FREE_ORDER_SLOT = 255;
export declare const CENTIBPS_PER_UNIT = 1000000;
declare class _I80F48Layout extends Blob {
    constructor(property: string);
    decode(b: any, offset: any): I80F48;
    encode(src: any, b: any, offset: any): any;
}
/** @internal */
export declare function I80F48Layout(property?: string): _I80F48Layout;
declare class BNLayout extends Blob {
    signed: boolean;
    constructor(number: number, property: any, signed?: boolean);
    decode(b: any, offset: any): BN;
    encode(src: any, b: any, offset: any): any;
}
/** @internal */
export declare function u64(property?: string): BNLayout;
/** @internal */
export declare function i64(property?: string): BNLayout;
/** @internal */
export declare function u128(property?: string): BNLayout;
/** @internal */
export declare function i128(property?: string): BNLayout;
declare class WrappedLayout<T, U> extends Layout<U> {
    layout: Layout<T>;
    decoder: (data: T) => U;
    encoder: (src: U) => T;
    constructor(layout: Layout<T>, decoder: (data: T) => U, encoder: (src: U) => T, property?: string);
    decode(b: Buffer, offset?: number): U;
    encode(src: U, b: Buffer, offset?: number): number;
    getSpan(b: Buffer, offset?: number): number;
}
/** @internal */
export declare function bool(property?: string): WrappedLayout<number, boolean>;
declare class EnumLayout extends UInt {
    values: any;
    constructor(values: any, span: any, property?: any);
    encode(src: any, b: any, offset: any): any;
    decode(b: any, offset: any): string;
}
/** @internal */
export declare function sideLayout(span: any, property?: any): EnumLayout;
/** @internal */
export declare function orderTypeLayout(property: any, span: any): EnumLayout;
/** @internal */
export declare function selfTradeBehaviorLayout(property: any, span: any): EnumLayout;
export declare function triggerConditionLayout(property: any, span: any): EnumLayout;
export declare function advancedOrderTypeLayout(property: any, span: any): EnumLayout;
/**
 * Makes custom modifications to the instruction layouts because valid instructions can be many sizes
 */
/** @internal */
declare class MangoInstructionsUnion extends Union {
    constructor(discr?: any, defaultLayout?: any, property?: any);
    decode(b: Buffer, offset: any): any;
    addVariant(variant: any, layout: any, property: any): any;
}
export declare const MangoInstructionLayout: MangoInstructionsUnion;
/** @internal */
export declare function encodeMangoInstruction(data: any): Buffer;
/** @internal */
export declare class PublicKeyLayout extends Blob {
    constructor(property: any);
    decode(b: any, offset: any): PublicKey;
    encode(src: any, b: any, offset: any): any;
}
/** @internal */
export declare function publicKeyLayout(property?: string): PublicKeyLayout;
/** @internal */
export declare const DataType: {
    MangoGroup: number;
    MangoAccount: number;
    RootBank: number;
    NodeBank: number;
    PerpMarket: number;
    Bids: number;
    Asks: number;
    MangoCache: number;
    EventQueue: number;
    AdvancedOrders: number;
    ReferrerMemory: number;
    ReferrerIdRecord: number;
};
export declare const enum AssetType {
    Token = 0,
    Perp = 1
}
export declare const enum AdvancedOrderType {
    PerpTrigger = 0,
    SpotTrigger = 1
}
export declare class MetaData {
    dataType: number;
    version: number;
    isInitialized: boolean;
    extraInfo: number[];
    constructor(decoded: any);
}
/** @internal */
export declare class MetaDataLayout extends Structure {
    constructor(property: any);
    decode(b: any, offset: any): MetaData;
    encode(src: any, b: any, offset: any): any;
}
/** @internal */
export declare function metaDataLayout(property?: string): MetaDataLayout;
/** @internal */
export declare class TokenInfo {
    mint: PublicKey;
    rootBank: PublicKey;
    decimals: number;
    padding: number[];
    constructor(decoded: any);
    isEmpty(): boolean;
}
/** @internal */
export declare class TokenInfoLayout extends Structure {
    constructor(property: any);
    decode(b: any, offset: any): TokenInfo;
    encode(src: any, b: any, offset: any): any;
}
/** @internal */
export declare function tokenInfoLayout(property?: string): TokenInfoLayout;
export declare class SpotMarketInfo {
    spotMarket: PublicKey;
    maintAssetWeight: I80F48;
    initAssetWeight: I80F48;
    maintLiabWeight: I80F48;
    initLiabWeight: I80F48;
    liquidationFee: I80F48;
    constructor(decoded: any);
    isEmpty(): boolean;
}
/** @internal */
export declare class SpotMarketInfoLayout extends Structure {
    constructor(property: any);
    decode(b: any, offset: any): SpotMarketInfo;
    encode(src: any, b: any, offset: any): any;
}
/** @internal */
export declare function spotMarketInfoLayout(property?: string): SpotMarketInfoLayout;
export declare class PerpMarketInfo {
    perpMarket: PublicKey;
    maintAssetWeight: I80F48;
    initAssetWeight: I80F48;
    maintLiabWeight: I80F48;
    initLiabWeight: I80F48;
    liquidationFee: I80F48;
    makerFee: I80F48;
    takerFee: I80F48;
    baseLotSize: BN;
    quoteLotSize: BN;
    constructor(decoded: any);
    isEmpty(): boolean;
}
/** @internal */
export declare class PerpMarketInfoLayout extends Structure {
    constructor(property: any);
    decode(b: any, offset: any): PerpMarketInfo;
    encode(src: any, b: any, offset: any): any;
}
/** @internal */
export declare function perpMarketInfoLayout(property?: string): PerpMarketInfoLayout;
/** @internal */
export declare class PerpAccountLayout extends Structure {
    constructor(property: any);
    decode(b: any, offset: any): PerpAccount;
    encode(src: any, b: any, offset: any): any;
}
/** @internal */
export declare function perpAccountLayout(property?: string): PerpAccountLayout;
/** @internal */
export declare const MangoGroupLayout: any;
/** @internal */
export declare const MangoAccountLayout: any;
/** @internal */
export declare const RootBankLayout: any;
/** @internal */
export declare const NodeBankLayout: any;
/** @internal */
export declare const StubOracleLayout: any;
/** @internal */
export declare class LiquidityMiningInfoLayout extends Structure {
    constructor(property: any);
    decode(b: any, offset: any): MetaData;
    encode(src: any, b: any, offset: any): any;
}
/** @internal */
export declare function liquidityMiningInfoLayout(property?: string): LiquidityMiningInfoLayout;
/** @internal */
export declare const PerpMarketLayout: any;
/** @internal */
export declare const PerpEventLayout: any;
export interface FillEvent {
    takerSide: 'buy' | 'sell';
    makerSlot: number;
    makerOut: boolean;
    timestamp: BN;
    seqNum: BN;
    maker: PublicKey;
    makerOrderId: BN;
    makerClientOrderId: BN;
    makerFee: I80F48;
    bestInitial: BN;
    makerTimestamp: BN;
    taker: PublicKey;
    takerOrderId: BN;
    takerClientOrderId: BN;
    takerFee: I80F48;
    price: BN;
    quantity: BN;
}
export interface OutEvent {
    side: 'buy' | 'sell';
    slot: number;
    timestamp: BN;
    seqNum: BN;
    owner: PublicKey;
    quantity: BN;
}
export interface LiquidateEvent {
    timestamp: BN;
    seqNum: BN;
    liqee: PublicKey;
    liqor: PublicKey;
    price: I80F48;
    quantity: BN;
    liquidationFee: I80F48;
}
/** @internal */
export declare const PerpEventQueueHeaderLayout: any;
/** @internal */
export declare const PerpEventQueueLayout: any;
/** @internal */
export declare const BookSideLayout: any;
export declare class PriceCache {
    price: I80F48;
    lastUpdate: BN;
    constructor(decoded: any);
}
/** @internal */
export declare class PriceCacheLayout extends Structure {
    constructor(property: any);
    decode(b: any, offset: any): PriceCache;
    encode(src: any, b: any, offset: any): any;
}
/** @internal */
export declare function priceCacheLayout(property?: string): PriceCacheLayout;
export declare class RootBankCache {
    depositIndex: I80F48;
    borrowIndex: I80F48;
    lastUpdate: BN;
    constructor(decoded: any);
}
/** @internal */
export declare class RootBankCacheLayout extends Structure {
    constructor(property: any);
    decode(b: any, offset: any): RootBankCache;
    encode(src: any, b: any, offset: any): any;
}
/** @internal */
export declare function rootBankCacheLayout(property?: string): RootBankCacheLayout;
export declare class PerpMarketCache {
    longFunding: I80F48;
    shortFunding: I80F48;
    lastUpdate: BN;
    constructor(decoded: any);
}
/** @internal */
export declare class PerpMarketCacheLayout extends Structure {
    constructor(property: any);
    decode(b: any, offset: any): PerpMarketCache;
    encode(src: any, b: any, offset: any): any;
}
/** @internal */
export declare function perpMarketCacheLayout(property?: string): PerpMarketCacheLayout;
/** @internal */
export declare const MangoCacheLayout: any;
export declare class MangoCache {
    publicKey: PublicKey;
    priceCache: PriceCache[];
    rootBankCache: RootBankCache[];
    perpMarketCache: PerpMarketCache[];
    constructor(publicKey: PublicKey, decoded: any);
    getPrice(tokenIndex: number): I80F48;
}
export declare class NodeBank {
    publicKey: PublicKey;
    deposits: I80F48;
    borrows: I80F48;
    vault: PublicKey;
    constructor(publicKey: PublicKey, decoded: any);
}
/** @internal */
export declare const TokenAccountLayout: any;
export declare const AdvancedOrdersLayout: any;
export interface PerpTriggerOrder {
    isActive: boolean;
    marketIndex: number;
    orderType: PerpOrderType;
    side: 'buy' | 'sell';
    triggerCondition: 'above' | 'below';
    clientOrderId: BN;
    price: BN;
    quantity: BN;
    triggerPrice: I80F48;
}
/** @internal */
export declare class ReferrerMemory {
    metaData: MetaData;
    referrerMangoAccount: PublicKey;
    constructor(decoded: any);
}
/** @internal */
export declare const ReferrerMemoryLayout: any;
/** @internal */
export declare class ReferrerIdRecord {
    metaData: MetaData;
    referrerMangoAccount: PublicKey;
    id: number[];
    constructor(decoded: any);
    get referrerId(): string;
}
/** @internal */
export declare const ReferrerIdRecordLayout: any;
export {};
//# sourceMappingURL=layout.d.ts.map