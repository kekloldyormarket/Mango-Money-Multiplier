import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { I80F48 } from './utils/fixednum';
import { MetaData, TokenInfo, SpotMarketInfo, PerpMarketInfo, MangoCache } from './layout';
import PerpMarket from './PerpMarket';
import RootBank from './RootBank';
export default class MangoGroup {
    publicKey: PublicKey;
    metaData: MetaData;
    numOracles: number;
    tokens: TokenInfo[];
    spotMarkets: SpotMarketInfo[];
    perpMarkets: PerpMarketInfo[];
    oracles: PublicKey[];
    signerNonce: BN;
    signerKey: PublicKey;
    admin: PublicKey;
    dexProgramId: PublicKey;
    mangoCache: PublicKey;
    insuranceVault: PublicKey;
    srmVault: PublicKey;
    msrmVault: PublicKey;
    feesVault: PublicKey;
    validInterval: number[];
    rootBankAccounts: (RootBank | undefined)[];
    maxMangoAccounts: BN;
    numMangoAccounts: BN;
    refSurchargeCentibps: BN;
    refShareCentibps: BN;
    refMngoRequired: BN;
    constructor(publicKey: PublicKey, decoded: any);
    getOracleIndex(oracle: PublicKey): number;
    getSpotMarketIndex(spotMarketPk: PublicKey): number;
    getPerpMarketIndex(perpMarketPk: PublicKey): number;
    getTokenIndex(token: PublicKey): number;
    getRootBankIndex(rootBank: PublicKey): number;
    getBorrowRate(tokenIndex: number): I80F48;
    getDepositRate(tokenIndex: number): I80F48;
    /**
     * Return the decimals in TokenInfo;
     * If it's not QUOTE_INDEX and there is an oracle for this index but no SPL-Token, this will default to 6
     * Otherwise throw error
     */
    getTokenDecimals(tokenIndex: number): number;
    cachePriceToUi(price: I80F48, tokenIndex: number): number;
    getPrice(tokenIndex: number, mangoCache: MangoCache): I80F48;
    getPriceUi(tokenIndex: number, mangoCache: MangoCache): number;
    getPriceNative(tokenIndex: number, mangoCache: MangoCache): I80F48;
    getUiTotalDeposit(tokenIndex: number): I80F48;
    getUiTotalBorrow(tokenIndex: number): I80F48;
    loadCache(connection: Connection): Promise<MangoCache>;
    onCacheChange(connection: Connection, cb: (c: MangoCache) => void): number;
    loadRootBanks(connection: Connection): Promise<(RootBank | undefined)[]>;
    loadPerpMarket(connection: Connection, marketIndex: number, baseDecimals: number, quoteDecimals: number): Promise<PerpMarket>;
    getQuoteTokenInfo(): TokenInfo;
}
//# sourceMappingURL=MangoGroup.d.ts.map