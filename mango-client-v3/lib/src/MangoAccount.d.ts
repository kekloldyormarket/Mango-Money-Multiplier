import { Market, OpenOrders } from '@project-serum/serum';
import { Connection, PublicKey } from '@solana/web3.js';
import { I80F48 } from './utils/fixednum';
import { MangoCache, MetaData, RootBankCache } from './layout';
import RootBank from './RootBank';
import BN from 'bn.js';
import MangoGroup from './MangoGroup';
import PerpAccount from './PerpAccount';
import { GroupConfig, PerpTriggerOrder } from '.';
import PerpMarket from './PerpMarket';
import { Order } from '@project-serum/serum/lib/market';
export default class MangoAccount {
    publicKey: PublicKey;
    metaData: MetaData;
    mangoGroup: PublicKey;
    owner: PublicKey;
    inMarginBasket: boolean[];
    numInMarginBasket: number;
    deposits: I80F48[];
    borrows: I80F48[];
    spotOpenOrders: PublicKey[];
    spotOpenOrdersAccounts: (OpenOrders | undefined)[];
    perpAccounts: PerpAccount[];
    orderMarket: number[];
    orderSide: string[];
    orders: BN[];
    clientOrderIds: BN[];
    msrmAmount: BN;
    beingLiquidated: boolean;
    isBankrupt: boolean;
    info: number[];
    advancedOrdersKey: PublicKey;
    advancedOrders: {
        perpTrigger?: PerpTriggerOrder;
    }[];
    notUpgradable: boolean;
    delegate: PublicKey;
    constructor(publicKey: PublicKey, decoded: any);
    get name(): string;
    getLiquidationPrice(mangoGroup: MangoGroup, mangoCache: MangoCache, oracleIndex: number): I80F48 | undefined;
    hasAnySpotOrders(): boolean;
    reload(connection: Connection, dexProgramId?: PublicKey | undefined): Promise<MangoAccount>;
    reloadFromSlot(connection: Connection, lastSlot?: number, dexProgramId?: PublicKey | undefined): Promise<[MangoAccount, number]>;
    loadSpotOrdersForMarket(connection: Connection, market: Market, marketIndex: number): Promise<Order[]>;
    loadOpenOrders(connection: Connection, serumDexPk: PublicKey): Promise<(OpenOrders | undefined)[]>;
    loadAdvancedOrders(connection: Connection): Promise<{
        perpTrigger?: PerpTriggerOrder;
    }[]>;
    getNativeDeposit(rootBank: RootBank | RootBankCache, tokenIndex: number): I80F48;
    getNativeBorrow(rootBank: RootBank | RootBankCache, tokenIndex: number): I80F48;
    getUiDeposit(rootBank: RootBank | RootBankCache, mangoGroup: MangoGroup, tokenIndex: number): I80F48;
    getUiBorrow(rootBank: RootBank | RootBankCache, mangoGroup: MangoGroup, tokenIndex: number): I80F48;
    getSpotVal(mangoGroup: any, mangoCache: any, index: any, assetWeight: any): I80F48;
    getAssetsVal(mangoGroup: MangoGroup, mangoCache: MangoCache, healthType?: HealthType): I80F48;
    getLiabsVal(mangoGroup: MangoGroup, mangoCache: MangoCache, healthType?: HealthType): I80F48;
    getNativeLiabsVal(mangoGroup: MangoGroup, mangoCache: MangoCache, healthType?: HealthType): I80F48;
    /**
     * deposits - borrows in native terms
     */
    getNet(bankCache: RootBankCache, tokenIndex: number): I80F48;
    /**
     * Take health components and return the assets and liabs weighted
     */
    getWeightedAssetsLiabsVals(mangoGroup: MangoGroup, mangoCache: MangoCache, spot: I80F48[], perps: I80F48[], quote: I80F48, healthType?: HealthType): {
        assets: I80F48;
        liabs: I80F48;
    };
    getHealthFromComponents(mangoGroup: MangoGroup, mangoCache: MangoCache, spot: I80F48[], perps: I80F48[], quote: I80F48, healthType: HealthType): I80F48;
    getHealthsFromComponents(mangoGroup: MangoGroup, mangoCache: MangoCache, spot: I80F48[], perps: I80F48[], quote: I80F48, healthType: HealthType): {
        spot: I80F48;
        perp: I80F48;
    };
    /**
     * Amount of native quote currency available to expand your position in this market
     */
    getMarketMarginAvailable(mangoGroup: MangoGroup, mangoCache: MangoCache, marketIndex: number, marketType: 'spot' | 'perp'): I80F48;
    /**
     * Get token amount available to withdraw without borrowing.
     */
    getAvailableBalance(mangoGroup: MangoGroup, mangoCache: MangoCache, tokenIndex: number): I80F48;
    /**
     * Return the spot, perps and quote currency values after adjusting for
     * worst case open orders scenarios. These values are not adjusted for health
     * type
     * @param mangoGroup
     * @param mangoCache
     */
    getHealthComponents(mangoGroup: MangoGroup, mangoCache: MangoCache): {
        spot: I80F48[];
        perps: I80F48[];
        quote: I80F48;
    };
    getHealth(mangoGroup: MangoGroup, mangoCache: MangoCache, healthType: HealthType): I80F48;
    getHealthRatio(mangoGroup: MangoGroup, mangoCache: MangoCache, healthType: HealthType): I80F48;
    computeValue(mangoGroup: MangoGroup, mangoCache: MangoCache): I80F48;
    /**
     * Get the value of unclaimed MNGO liquidity mining rewards
     */
    mgnoAccruedValue(mangoGroup: MangoGroup, mangoCache: MangoCache): I80F48;
    getLeverage(mangoGroup: MangoGroup, mangoCache: MangoCache): I80F48;
    calcTotalPerpUnsettledPnl(mangoGroup: MangoGroup, mangoCache: MangoCache): I80F48;
    calcTotalPerpPosUnsettledPnl(mangoGroup: MangoGroup, mangoCache: MangoCache): I80F48;
    getMaxLeverageForMarket(mangoGroup: MangoGroup, mangoCache: MangoCache, marketIndex: number, market: Market | PerpMarket, side: 'buy' | 'sell', price: I80F48): {
        max: I80F48;
        uiDepositVal: I80F48;
        deposits: I80F48;
        uiBorrowVal: I80F48;
        borrows: I80F48;
    };
    getMaxWithBorrowForToken(mangoGroup: MangoGroup, mangoCache: MangoCache, tokenIndex: number): I80F48;
    isLiquidatable(mangoGroup: MangoGroup, mangoCache: MangoCache): boolean;
    toPrettyString(groupConfig: GroupConfig, mangoGroup: MangoGroup, cache: MangoCache): string;
    /**
     * Get all the open orders using only info in MangoAccount; Does not contain
     * information about the size of the order.
     */
    getPerpOpenOrders(): {
        marketIndex: number;
        price: BN;
        side: string;
    }[];
    /**
     * Return the open orders keys in basket and replace open orders not in basket with zero key
     */
    getOpenOrdersKeysInBasket(): PublicKey[];
    /**
     * Return the open orders keys in basket; no zero keys; useful for PlaceSpotOrder2 and PlacePerpOrder2
     */
    getOpenOrdersKeysInBasketPacked(): PublicKey[];
    /**
     *  Return the current position for the market at `marketIndex` in UI units
     *  e.g. if you buy 1 BTC in the UI, you're buying 1,000,000 native BTC,
     *  10,000 BTC-PERP contracts and exactly 1 BTC in UI
     *  Find the marketIndex in the ids.json list of perp markets
     */
    getPerpPositionUi(marketIndex: number, perpMarket: PerpMarket): number;
    /**
     *  Return the current position for the market at `marketIndex` in UI units
     *  e.g. if you buy 1 BTC in the UI, you're buying 1,000,000 native BTC,
     *  10,000 BTC-PERP contracts and exactly 1 BTC in UI
     *  Find the marketIndex in the ids.json list of perp markets
     */
    getBasePositionUiWithGroup(marketIndex: number, group: MangoGroup): number;
    /**
     * Return the equity in standard UI numbers. E.g. if equity is $100, this returns 100
     */
    getEquityUi(mangoGroup: MangoGroup, mangoCache: MangoCache): number;
    /**
     * This is the init health divided by quote decimals
     */
    getCollateralValueUi(mangoGroup: MangoGroup, mangoCache: MangoCache): number;
}
export declare type HealthType = 'Init' | 'Maint';
//# sourceMappingURL=MangoAccount.d.ts.map