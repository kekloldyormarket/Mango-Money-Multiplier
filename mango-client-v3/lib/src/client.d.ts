/// <reference types="node" />
import { Account, AccountInfo, Connection, Keypair, PublicKey, Transaction, TransactionConfirmationStatus, TransactionSignature } from '@solana/web3.js';
import BN from 'bn.js';
import { AssetType, MangoCache } from './layout';
import MangoAccount from './MangoAccount';
import PerpMarket from './PerpMarket';
import RootBank from './RootBank';
import { Market } from '@project-serum/serum';
import { I80F48 } from './utils/fixednum';
import { Order } from '@project-serum/serum/lib/market';
import { PerpOrderType, WalletAdapter, BlockhashTimes } from './utils/types';
import { PerpOrder } from './book';
import MangoGroup from './MangoGroup';
import { ReferrerIdRecord } from '.';
/**
 * Get the current epoch timestamp in seconds with microsecond precision
 */
export declare const getUnixTs: () => number;
declare type AccountWithPnl = {
    publicKey: PublicKey;
    pnl: I80F48;
};
/**
 * A class for interacting with the Mango V3 Program
 *
 * @param connection A solana web.js Connection object
 * @param programId The PublicKey of the Mango V3 Program
 * @param opts An object used to configure the MangoClient. Accepts a postSendTxCallback
 */
export declare class MangoClient {
    connection: Connection;
    programId: PublicKey;
    lastSlot: number;
    recentBlockhash: string;
    recentBlockhashTime: number;
    timeout: number | null;
    postSendTxCallback?: ({ txid: string }: {
        txid: any;
    }) => void;
    constructor(connection: Connection, programId: PublicKey, opts?: {
        postSendTxCallback?: ({ txid }: {
            txid: string;
        }) => void;
    });
    sendTransactions(transactions: Transaction[], payer: Account | WalletAdapter, additionalSigners: Account[], timeout?: number | null, confirmLevel?: TransactionConfirmationStatus): Promise<TransactionSignature[]>;
    signTransaction({ transaction, payer, signers }: {
        transaction: any;
        payer: any;
        signers: any;
    }): Promise<any>;
    signTransactions({ transactionsAndSigners, payer, }: {
        transactionsAndSigners: {
            transaction: Transaction;
            signers?: Array<Account>;
        }[];
        payer: Account | WalletAdapter;
    }): Promise<Transaction[]>;
    /**
     * Send a transaction using the Solana Web3.js connection on the mango client
     *
     * @param transaction
     * @param payer
     * @param additionalSigners
     * @param timeout Retries sending the transaction and trying to confirm it until the given timeout. Defaults to 30000ms. Passing null will disable the transaction confirmation check and always return success.
     */
    sendTransaction(transaction: Transaction, payer: Account | WalletAdapter | Keypair, additionalSigners: Account[], timeout?: number | null, confirmLevel?: TransactionConfirmationStatus): Promise<TransactionSignature>;
    sendSignedTransaction({ signedTransaction, timeout, confirmLevel, }: {
        signedTransaction: Transaction;
        timeout?: number;
        confirmLevel?: TransactionConfirmationStatus;
    }): Promise<TransactionSignature>;
    awaitTransactionSignatureConfirmation(txid: TransactionSignature, timeout: number, confirmLevel: TransactionConfirmationStatus): Promise<unknown>;
    updateRecentBlockhash(blockhashTimes: BlockhashTimes[]): Promise<void>;
    /**
     * Maintain a timeout of 30 seconds
     * @param client
     */
    maintainTimeouts(): Promise<void>;
    /**
     * Create a new Mango group
     */
    initMangoGroup(quoteMint: PublicKey, msrmMint: PublicKey, dexProgram: PublicKey, feesVault: PublicKey, // owned by Mango DAO token governance
    validInterval: number, quoteOptimalUtil: number, quoteOptimalRate: number, quoteMaxRate: number, payer: Account | WalletAdapter): Promise<PublicKey>;
    /**
     * Retrieve information about a Mango Group
     */
    getMangoGroup(mangoGroup: PublicKey): Promise<MangoGroup>;
    /**
     * DEPRECATED - Create a new Mango Account on a given group
     */
    initMangoAccount(mangoGroup: MangoGroup, owner: Account | WalletAdapter): Promise<PublicKey>;
    /**
     * Create a new Mango Account (PDA) on a given group
     */
    createMangoAccount(mangoGroup: MangoGroup, owner: Account | WalletAdapter, accountNum: number, payerPk?: PublicKey): Promise<PublicKey>;
    /**
     * Upgrade a Mango Account from V0 (not deletable) to V1 (deletable)
     */
    upgradeMangoAccountV0V1(mangoGroup: MangoGroup, owner: Account | WalletAdapter, accountNum: number): Promise<PublicKey>;
    /**
     * Retrieve information about a Mango Account
     */
    getMangoAccount(mangoAccountPk: PublicKey, dexProgramId: PublicKey): Promise<MangoAccount>;
    /**
     * Create a new Mango Account and deposit some tokens in a single transaction
     *
     * @param rootBank The RootBank for the deposit currency
     * @param nodeBank The NodeBank asociated with the RootBank
     * @param vault The token account asociated with the NodeBank
     * @param tokenAcc The token account to transfer from
     * @param info An optional UI name for the account
     */
    initMangoAccountAndDeposit(mangoGroup: MangoGroup, owner: Account | WalletAdapter, rootBank: PublicKey, nodeBank: PublicKey, vault: PublicKey, tokenAcc: PublicKey, quantity: number, info?: string): Promise<string>;
    /**
     * Create a new Mango Account (PDA) and deposit some tokens in a single transaction
     *
     * @param rootBank The RootBank for the deposit currency
     * @param nodeBank The NodeBank asociated with the RootBank
     * @param vault The token account asociated with the NodeBank
     * @param tokenAcc The token account to transfer from
     * @param info An optional UI name for the account
     */
    createMangoAccountAndDeposit(mangoGroup: MangoGroup, owner: Account | WalletAdapter, rootBank: PublicKey, nodeBank: PublicKey, vault: PublicKey, tokenAcc: PublicKey, quantity: number, accountNum: number, info?: string, referrerPk?: PublicKey, payerPk?: PublicKey): Promise<[string, TransactionSignature]>;
    /**
     * Deposit tokens in a Mango Account
     *
     * @param rootBank The RootBank for the deposit currency
     * @param nodeBank The NodeBank asociated with the RootBank
     * @param vault The token account asociated with the NodeBank
     * @param tokenAcc The token account to transfer from
     */
    deposit(mangoGroup: MangoGroup, mangoAccount: MangoAccount, owner: Account | WalletAdapter, rootBank: PublicKey, nodeBank: PublicKey, vault: PublicKey, tokenAcc: PublicKey, quantity: number): Promise<TransactionSignature>;
    /**
     * Withdraw tokens from a Mango Account
     *
     * @param rootBank The RootBank for the withdrawn currency
     * @param nodeBank The NodeBank asociated with the RootBank
     * @param vault The token account asociated with the NodeBank
     * @param allowBorrow Whether to borrow tokens if there are not enough deposits for the withdrawal
     */
    withdraw(mangoGroup: MangoGroup, mangoAccount: MangoAccount, owner: Account | WalletAdapter, rootBank: PublicKey, nodeBank: PublicKey, vault: PublicKey, quantity: number, allowBorrow: boolean): Promise<TransactionSignature>;
    withdrawAll(mangoGroup: MangoGroup, mangoAccount: MangoAccount, owner: Account | WalletAdapter): Promise<void>;
    /**
     * Called by the Keeper to cache interest rates from the RootBanks
     */
    cacheRootBanks(mangoGroup: PublicKey, mangoCache: PublicKey, rootBanks: PublicKey[], payer: Account | WalletAdapter): Promise<TransactionSignature>;
    /**
     * Called by the Keeper to cache prices from the Oracles
     */
    cachePrices(mangoGroup: PublicKey, mangoCache: PublicKey, oracles: PublicKey[], payer: Account | WalletAdapter): Promise<TransactionSignature>;
    /**
     * Called by the Keeper to cache perp market funding
     */
    cachePerpMarkets(mangoGroup: PublicKey, mangoCache: PublicKey, perpMarkets: PublicKey[], payer: Account): Promise<TransactionSignature>;
    /**
     * Called by the Keeper to update interest rates on the RootBanks
     */
    updateRootBank(mangoGroup: MangoGroup, rootBank: PublicKey, nodeBanks: PublicKey[], payer: Account | WalletAdapter): Promise<TransactionSignature>;
    /**
     * Called by the Keeper to process events on the Perp order book
     */
    consumeEvents(mangoGroup: MangoGroup, perpMarket: PerpMarket, mangoAccounts: PublicKey[], payer: Account, limit: BN): Promise<TransactionSignature>;
    /**
     * Called by the Keeper to update funding on the perp markets
     */
    updateFunding(mangoGroup: PublicKey, mangoCache: PublicKey, perpMarket: PublicKey, bids: PublicKey, asks: PublicKey, payer: Account): Promise<TransactionSignature>;
    /**
     * Retrieve information about a perp market
     */
    getPerpMarket(perpMarketPk: PublicKey, baseDecimal: number, quoteDecimal: number): Promise<PerpMarket>;
    /**
     * Place an order on a perp market
     *
     * @param clientOrderId An optional id that can be used to correlate events related to your order
     * @param bookSideInfo Account info for asks if side === bid, bids if side === ask. If this is given, crank instruction is added
     */
    placePerpOrder(mangoGroup: MangoGroup, mangoAccount: MangoAccount, mangoCache: PublicKey, // TODO - remove; already in MangoGroup
    perpMarket: PerpMarket, owner: Account | WalletAdapter, side: 'buy' | 'sell', price: number, quantity: number, orderType?: PerpOrderType, clientOrderId?: number, bookSideInfo?: AccountInfo<Buffer>, reduceOnly?: boolean, referrerMangoAccountPk?: PublicKey): Promise<TransactionSignature>;
    /**
     * Place an order on a perp market
     *
     * @param clientOrderId An optional id that can be used to correlate events related to your order
     * @param bookSideInfo Account info for asks if side === bid, bids if side === ask. If this is given, crank instruction is added
     */
    placePerpOrder2(mangoGroup: MangoGroup, mangoAccount: MangoAccount, perpMarket: PerpMarket, owner: Account | WalletAdapter, side: 'buy' | 'sell', price: number, quantity: number, options?: {
        maxQuoteQuantity?: number;
        limit?: number;
        orderType?: PerpOrderType;
        clientOrderId?: number;
        bookSideInfo?: AccountInfo<Buffer>;
        reduceOnly?: boolean;
        referrerMangoAccountPk?: PublicKey;
        expiryTimestamp?: number;
    }): Promise<TransactionSignature>;
    /**
     * Cancel an order on a perp market
     *
     * @param invalidIdOk Don't throw error if order is invalid
     */
    cancelPerpOrder(mangoGroup: MangoGroup, mangoAccount: MangoAccount, owner: Account | WalletAdapter, perpMarket: PerpMarket, order: PerpOrder, invalidIdOk?: boolean): Promise<TransactionSignature>;
    /**
     * Cancel all perp orders across all markets
     */
    cancelAllPerpOrders(group: MangoGroup, perpMarkets: PerpMarket[], mangoAccount: MangoAccount, owner: Account | WalletAdapter): Promise<TransactionSignature[]>;
    /**
     * Add a new oracle to a group
     */
    addOracle(mangoGroup: MangoGroup, oracle: PublicKey, admin: Account): Promise<TransactionSignature>;
    /**
     * Set the price of a 'stub' type oracle
     */
    setOracle(mangoGroup: MangoGroup, oracle: PublicKey, admin: Account, price: I80F48): Promise<TransactionSignature>;
    addSpotMarket(mangoGroup: MangoGroup, oracle: PublicKey, spotMarket: PublicKey, mint: PublicKey, admin: Account, maintLeverage: number, initLeverage: number, liquidationFee: number, optimalUtil: number, optimalRate: number, maxRate: number): Promise<TransactionSignature>;
    /**
     * Make sure mangoAccount has recent and valid inMarginBasket and spotOpenOrders
     */
    placeSpotOrder(mangoGroup: MangoGroup, mangoAccount: MangoAccount, mangoCache: PublicKey, spotMarket: Market, owner: Account | WalletAdapter, side: 'buy' | 'sell', price: number, size: number, orderType?: 'limit' | 'ioc' | 'postOnly', clientId?: BN): Promise<TransactionSignature>;
    /**
     * Make sure mangoAccount has recent and valid inMarginBasket and spotOpenOrders
     */
    placeSpotOrder2(mangoGroup: MangoGroup, mangoAccount: MangoAccount, spotMarket: Market, owner: Account | WalletAdapter, side: 'buy' | 'sell', price: number, size: number, orderType?: 'limit' | 'ioc' | 'postOnly', clientOrderId?: BN, useMsrmVault?: boolean | undefined): Promise<TransactionSignature[]>;
    cancelSpotOrder(mangoGroup: MangoGroup, mangoAccount: MangoAccount, owner: Account | WalletAdapter, spotMarket: Market, order: Order): Promise<TransactionSignature>;
    settleFunds(mangoGroup: MangoGroup, mangoAccount: MangoAccount, owner: Account | WalletAdapter, spotMarket: Market): Promise<TransactionSignature>;
    /**
     * Assumes spotMarkets contains all Markets in MangoGroup in order
     */
    settleAll(mangoGroup: MangoGroup, mangoAccount: MangoAccount, spotMarkets: Market[], owner: Account | WalletAdapter): Promise<TransactionSignature[]>;
    fetchTopPnlAccountsFromRPC(mangoGroup: MangoGroup, mangoCache: MangoCache, perpMarket: PerpMarket, price: I80F48, // should be the MangoCache price
    sign: number, mangoAccounts?: MangoAccount[]): Promise<AccountWithPnl[]>;
    fetchTopPnlAccountsFromDB(mangoGroup: MangoGroup, perpMarket: PerpMarket, sign: number): Promise<AccountWithPnl[]>;
    /**
     * Automatically fetch MangoAccounts for this PerpMarket
     * Pick enough MangoAccounts that have opposite sign and send them in to get settled
     */
    settlePnl(mangoGroup: MangoGroup, mangoCache: MangoCache, mangoAccount: MangoAccount, perpMarket: PerpMarket, quoteRootBank: RootBank, price: I80F48, // should be the MangoCache price
    owner: Account | WalletAdapter, mangoAccounts?: MangoAccount[]): Promise<TransactionSignature | null>;
    /**
     * Settle all perp accounts with positive pnl
     */
    settlePosPnl(mangoGroup: MangoGroup, mangoCache: MangoCache, mangoAccount: MangoAccount, perpMarkets: PerpMarket[], quoteRootBank: RootBank, owner: Account | WalletAdapter, mangoAccounts?: MangoAccount[]): Promise<(TransactionSignature | null)[]>;
    /**
     * Settle all perp accounts with any pnl
     */
    settleAllPerpPnl(mangoGroup: MangoGroup, mangoCache: MangoCache, mangoAccount: MangoAccount, perpMarkets: PerpMarket[], quoteRootBank: RootBank, owner: Account | WalletAdapter, mangoAccounts?: MangoAccount[]): Promise<(TransactionSignature | null)[]>;
    getMangoAccountsForOwner(mangoGroup: MangoGroup, owner: PublicKey, includeOpenOrders?: boolean): Promise<MangoAccount[]>;
    /**
     * Get all MangoAccounts where `delegate` pubkey has authority
     */
    getMangoAccountsForDelegate(mangoGroup: MangoGroup, delegate: PublicKey, includeOpenOrders?: boolean): Promise<MangoAccount[]>;
    getAllMangoAccounts(mangoGroup: MangoGroup, filters?: any[], includeOpenOrders?: boolean): Promise<MangoAccount[]>;
    addStubOracle(mangoGroupPk: PublicKey, admin: Account): Promise<string>;
    setStubOracle(mangoGroupPk: PublicKey, oraclePk: PublicKey, admin: Account, price: number): Promise<string>;
    addPerpMarket(mangoGroup: MangoGroup, oraclePk: PublicKey, mngoMintPk: PublicKey, admin: Account, maintLeverage: number, initLeverage: number, liquidationFee: number, makerFee: number, takerFee: number, baseLotSize: number, quoteLotSize: number, maxNumEvents: number, rate: number, // liquidity mining params; set rate == 0 if no liq mining
    maxDepthBps: number, targetPeriodLength: number, mngoPerPeriod: number, exp: number): Promise<string>;
    createPerpMarket(mangoGroup: MangoGroup, oraclePk: PublicKey, mngoMintPk: PublicKey, admin: Account | Keypair, maintLeverage: number, initLeverage: number, liquidationFee: number, makerFee: number, takerFee: number, baseLotSize: number, quoteLotSize: number, maxNumEvents: number, rate: number, // liquidity mining params; set rate == 0 if no liq mining
    maxDepthBps: number, targetPeriodLength: number, mngoPerPeriod: number, exp: number, version: number, lmSizeShift: number, baseDecimals: number): Promise<string>;
    forceCancelSpotOrders(mangoGroup: MangoGroup, liqeeMangoAccount: MangoAccount, spotMarket: Market, baseRootBank: RootBank, quoteRootBank: RootBank, payer: Account, limit: BN): Promise<string>;
    /**
     * Send multiple instructions to cancel all perp orders in this market
     */
    forceCancelAllPerpOrdersInMarket(mangoGroup: MangoGroup, liqee: MangoAccount, perpMarket: PerpMarket, payer: Account | WalletAdapter, limitPerInstruction: number): Promise<TransactionSignature>;
    forceCancelPerpOrders(mangoGroup: MangoGroup, liqeeMangoAccount: MangoAccount, perpMarket: PerpMarket, payer: Account, limit: BN): Promise<string>;
    liquidateTokenAndToken(mangoGroup: MangoGroup, liqeeMangoAccount: MangoAccount, liqorMangoAccount: MangoAccount, assetRootBank: RootBank, liabRootBank: RootBank, payer: Account, maxLiabTransfer: I80F48): Promise<string>;
    liquidateTokenAndPerp(mangoGroup: MangoGroup, liqeeMangoAccount: MangoAccount, liqorMangoAccount: MangoAccount, rootBank: RootBank, payer: Account, assetType: AssetType, assetIndex: number, liabType: AssetType, liabIndex: number, maxLiabTransfer: I80F48): Promise<string>;
    liquidatePerpMarket(mangoGroup: MangoGroup, liqeeMangoAccount: MangoAccount, liqorMangoAccount: MangoAccount, perpMarket: PerpMarket, payer: Account, baseTransferRequest: BN): Promise<string>;
    settleFees(mangoGroup: MangoGroup, mangoAccount: MangoAccount, perpMarket: PerpMarket, rootBank: RootBank, payer: Account): Promise<string>;
    resolvePerpBankruptcy(mangoGroup: MangoGroup, liqeeMangoAccount: MangoAccount, liqorMangoAccount: MangoAccount, perpMarket: PerpMarket, rootBank: RootBank, payer: Account, liabIndex: number, maxLiabTransfer: I80F48): Promise<string>;
    resolveTokenBankruptcy(mangoGroup: MangoGroup, liqeeMangoAccount: MangoAccount, liqorMangoAccount: MangoAccount, quoteRootBank: RootBank, liabRootBank: RootBank, payer: Account, maxLiabTransfer: I80F48): Promise<string>;
    redeemMngo(mangoGroup: MangoGroup, mangoAccount: MangoAccount, perpMarket: PerpMarket, payer: Account | WalletAdapter, mngoRootBank: PublicKey, mngoNodeBank: PublicKey, mngoVault: PublicKey): Promise<TransactionSignature>;
    redeemAllMngo(mangoGroup: MangoGroup, mangoAccount: MangoAccount, payer: Account | WalletAdapter, mngoRootBank: PublicKey, mngoNodeBank: PublicKey, mngoVault: PublicKey): Promise<TransactionSignature>;
    addMangoAccountInfo(mangoGroup: MangoGroup, mangoAccount: MangoAccount, owner: Account | WalletAdapter, info: string): Promise<TransactionSignature>;
    depositMsrm(mangoGroup: MangoGroup, mangoAccount: MangoAccount, owner: Account | WalletAdapter, msrmAccount: PublicKey, quantity: number): Promise<TransactionSignature>;
    withdrawMsrm(mangoGroup: MangoGroup, mangoAccount: MangoAccount, owner: Account | WalletAdapter, msrmAccount: PublicKey, quantity: number): Promise<TransactionSignature>;
    changePerpMarketParams(mangoGroup: MangoGroup, perpMarket: PerpMarket, admin: Account | WalletAdapter, maintLeverage: number | undefined, initLeverage: number | undefined, liquidationFee: number | undefined, makerFee: number | undefined, takerFee: number | undefined, rate: number | undefined, maxDepthBps: number | undefined, targetPeriodLength: number | undefined, mngoPerPeriod: number | undefined, exp: number | undefined): Promise<TransactionSignature>;
    changePerpMarketParams2(mangoGroup: MangoGroup, perpMarket: PerpMarket, admin: Account | WalletAdapter, maintLeverage: number | undefined, initLeverage: number | undefined, liquidationFee: number | undefined, makerFee: number | undefined, takerFee: number | undefined, rate: number | undefined, maxDepthBps: number | undefined, targetPeriodLength: number | undefined, mngoPerPeriod: number | undefined, exp: number | undefined, version: number | undefined, lmSizeShift: number | undefined): Promise<TransactionSignature>;
    setGroupAdmin(mangoGroup: MangoGroup, newAdmin: PublicKey, admin: Account | WalletAdapter): Promise<TransactionSignature>;
    /**
     * Add allowance for orders to be cancelled and replaced in a single transaction
     */
    modifySpotOrder(mangoGroup: MangoGroup, mangoAccount: MangoAccount, mangoCache: PublicKey, spotMarket: Market, owner: Account | WalletAdapter, order: Order, side: 'buy' | 'sell', price: number, size: number, orderType?: 'limit' | 'ioc' | 'postOnly'): Promise<TransactionSignature>;
    modifyPerpOrder(mangoGroup: MangoGroup, mangoAccount: MangoAccount, mangoCache: PublicKey, perpMarket: PerpMarket, owner: Account | WalletAdapter, order: PerpOrder, side: 'buy' | 'sell', price: number, quantity: number, orderType?: PerpOrderType, clientOrderId?: number, bookSideInfo?: AccountInfo<Buffer>, // ask if side === bid, bids if side === ask; if this is given; crank instruction is added
    invalidIdOk?: boolean, // Don't throw error if order is invalid
    referrerMangoAccountPk?: PublicKey): Promise<TransactionSignature>;
    addPerpTriggerOrder(mangoGroup: MangoGroup, mangoAccount: MangoAccount, perpMarket: PerpMarket, owner: Account | WalletAdapter, orderType: PerpOrderType, side: 'buy' | 'sell', price: number, quantity: number, triggerCondition: 'above' | 'below', triggerPrice: number, reduceOnly: boolean, clientOrderId?: number): Promise<TransactionSignature>;
    removeAdvancedOrder(mangoGroup: MangoGroup, mangoAccount: MangoAccount, owner: Account | WalletAdapter, orderIndex: number): Promise<TransactionSignature>;
    executePerpTriggerOrder(mangoGroup: MangoGroup, mangoAccount: MangoAccount, mangoCache: MangoCache, perpMarket: PerpMarket, payer: Account | WalletAdapter, orderIndex: number): Promise<TransactionSignature>;
    closeAdvancedOrders(mangoGroup: MangoGroup, mangoAccount: MangoAccount, payer: Account | WalletAdapter): Promise<TransactionSignature>;
    closeSpotOpenOrders(mangoGroup: MangoGroup, mangoAccount: MangoAccount, payer: Account | WalletAdapter, marketIndex: number): Promise<TransactionSignature>;
    closeMangoAccount(mangoGroup: MangoGroup, mangoAccount: MangoAccount, payer: Account | WalletAdapter): Promise<TransactionSignature>;
    createDustAccount(mangoGroup: MangoGroup, payer: Account | WalletAdapter): Promise<TransactionSignature>;
    resolveDust(mangoGroup: MangoGroup, mangoAccount: MangoAccount, rootBank: RootBank, mangoCache: MangoCache, payer: Account | WalletAdapter): Promise<TransactionSignature>;
    updateMarginBasket(mangoGroup: MangoGroup, mangoAccount: MangoAccount, payer: Account | WalletAdapter): Promise<string>;
    resolveAllDust(mangoGroup: MangoGroup, mangoAccount: MangoAccount, mangoCache: MangoCache, payer: Account | WalletAdapter): Promise<void>;
    emptyAndCloseMangoAccount(mangoGroup: MangoGroup, mangoAccount: MangoAccount, mangoCache: MangoCache, mngoIndex: number, payer: Account | WalletAdapter): Promise<TransactionSignature[]>;
    cancelPerpOrderSide(mangoGroup: MangoGroup, mangoAccount: MangoAccount, perpMarket: PerpMarket, payer: Account | WalletAdapter, side: 'buy' | 'sell', limit: number): Promise<string>;
    setDelegate(mangoGroup: MangoGroup, mangoAccount: MangoAccount, payer: Account | WalletAdapter, delegate: PublicKey): Promise<string>;
    changeSpotMarketParams(mangoGroup: MangoGroup, spotMarket: Market, rootBank: RootBank, admin: Account | WalletAdapter, maintLeverage: number | undefined, initLeverage: number | undefined, liquidationFee: number | undefined, optimalUtil: number | undefined, optimalRate: number | undefined, maxRate: number | undefined, version: number | undefined): Promise<TransactionSignature>;
    /**
     * Change the referral fee params
     * @param mangoGroup
     * @param admin
     * @param refSurcharge normal units 0.0001 -> 1 basis point
     * @param refShare
     * @param refMngoRequired ui units -> 1 -> 1_000_000 MNGO
     */
    changeReferralFeeParams(mangoGroup: MangoGroup, admin: Account | WalletAdapter, refSurcharge: number, refShare: number, refMngoRequired: number): Promise<TransactionSignature>;
    setReferrerMemory(mangoGroup: MangoGroup, mangoAccount: MangoAccount, payer: Account | WalletAdapter, // must be also owner of mangoAccount
    referrerMangoAccountPk: PublicKey): Promise<TransactionSignature>;
    getReferrerPda(mangoGroup: MangoGroup, referrerId: string): Promise<{
        referrerPda: PublicKey;
        encodedReferrerId: Buffer;
    }>;
    registerReferrerId(mangoGroup: MangoGroup, referrerMangoAccount: MangoAccount, payer: Account | WalletAdapter, // will also owner of referrerMangoAccount
    referrerId: string): Promise<TransactionSignature>;
    getReferrerIdsForMangoAccount(mangoAccount: MangoAccount): Promise<ReferrerIdRecord[]>;
}
export {};
//# sourceMappingURL=client.d.ts.map