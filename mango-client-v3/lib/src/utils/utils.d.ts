/// <reference types="node" />
import BN from 'bn.js';
import { Account, AccountInfo, Commitment, Connection, PublicKey, RpcResponseAndContext, SimulatedTransactionResponse, Transaction, TransactionConfirmationStatus, TransactionInstruction, TransactionSignature } from '@solana/web3.js';
import { OpenOrders } from '@project-serum/serum';
import { I80F48 } from './fixednum';
import MangoGroup from '../MangoGroup';
import { HealthType } from '../MangoAccount';
/** @internal */
export declare const ZERO_BN: BN;
/** @internal */
export declare const ONE_BN: BN;
/** @internal */
export declare const U64_MAX_BN: BN;
/** @internal */
export declare const I64_MAX_BN: BN;
/** @internal */
export declare const zeroKey: PublicKey;
/** @internal */
export declare function promiseUndef(): Promise<undefined>;
/** @internal */
export declare function promiseNull(): Promise<null>;
export declare function optionalBNFromString(x?: string): BN | undefined;
export declare function uiToNative(amount: number, decimals: number): BN;
export declare function nativeToUi(amount: number, decimals: number): number;
export declare function nativeI80F48ToUi(amount: I80F48, decimals: number): I80F48;
export declare class TimeoutError extends Error {
    message: string;
    txid: string;
    constructor({ txid }: {
        txid: any;
    });
}
export declare class MangoError extends Error {
    message: string;
    txid: string;
    constructor({ txid, message }: {
        txid: any;
        message: any;
    });
}
/**
 * Return weights corresponding to health type;
 * Weights are all 1 if no healthType provided
 */
export declare function getWeights(mangoGroup: MangoGroup, marketIndex: number, healthType?: HealthType): {
    spotAssetWeight: I80F48;
    spotLiabWeight: I80F48;
    perpAssetWeight: I80F48;
    perpLiabWeight: I80F48;
};
export declare function splitOpenOrders(openOrders: OpenOrders): {
    quoteFree: I80F48;
    quoteLocked: I80F48;
    baseFree: I80F48;
    baseLocked: I80F48;
};
export declare function awaitTransactionSignatureConfirmation(txid: TransactionSignature, timeout: number, connection: Connection, confirmLevel: TransactionConfirmationStatus): Promise<unknown>;
export declare function sleep(ms: any): Promise<unknown>;
export declare function simulateTransaction(connection: Connection, transaction: Transaction, commitment: Commitment): Promise<RpcResponseAndContext<SimulatedTransactionResponse>>;
export declare function createAccountInstruction(connection: Connection, payer: PublicKey, space: number, owner: PublicKey, lamports?: number): Promise<{
    account: Account;
    instruction: TransactionInstruction;
}>;
export declare function createTokenAccountInstructions(connection: Connection, payer: PublicKey, account: PublicKey, mint: PublicKey, owner: PublicKey): Promise<TransactionInstruction[]>;
export declare function createSignerKeyAndNonce(programId: PublicKey, accountKey: PublicKey): Promise<{
    signerKey: PublicKey;
    signerNonce: number;
}>;
export declare function getFilteredProgramAccounts(connection: Connection, programId: PublicKey, filters: any): Promise<{
    publicKey: PublicKey;
    accountInfo: AccountInfo<Buffer>;
}[]>;
export declare function clamp(x: number, min: number, max: number): number;
export declare function getMultipleAccounts(connection: Connection, publicKeys: PublicKey[], commitment?: Commitment): Promise<{
    publicKey: PublicKey;
    context: {
        slot: number;
    };
    accountInfo: AccountInfo<Buffer>;
}[]>;
/**
 * Throw if undefined; return value otherwise
 * @internal
 */
export declare function throwUndefined<T>(x: T | undefined): T;
/**
 * Calculate the base lot size and quote lot size given a desired min tick and min size in the UI
 */
export declare function calculateLotSizes(baseDecimals: number, quoteDecimals: number, minTick: number, minSize: number): {
    baseLotSize: BN;
    quoteLotSize: BN;
};
/**
 * Return some standard params for a new perp market
 * oraclePrice is the current oracle price for the perp market being added
 * Assumes a rate 1000 MNGO per hour for 500k liquidity rewarded
 * `nativeBaseDecimals` are the decimals for the asset on the native chain
 */
export declare function findPerpMarketParams(nativeBaseDecimals: number, quoteDecimals: number, oraclePrice: number, leverage: number, mngoPerHour: number): {
    maintLeverage: number;
    initLeverage: number;
    liquidationFee: number;
    makerFee: number;
    takerFee: number;
    baseLotSize: number;
    quoteLotSize: number;
    rate: number;
    maxDepthBps: number;
    exp: number;
    maxNumEvents: number;
    targetPeriodLength: number;
    mngoPerPeriod: number;
    version: number;
    lmSizeShift: number;
    decimals: number;
    minTick: number;
    minSize: number;
    baseDecimals: number;
};
//# sourceMappingURL=utils.d.ts.map