import BN from 'bn.js';
import { PerpMarketCache, PerpMarketInfo } from '.';
import { I80F48 } from './utils/fixednum';
import PerpMarket from './PerpMarket';
import MangoAccount from './MangoAccount';
import Big from 'big.js';
export default class PerpAccount {
    basePosition: BN;
    quotePosition: I80F48;
    longSettledFunding: I80F48;
    shortSettledFunding: I80F48;
    bidsQuantity: BN;
    asksQuantity: BN;
    takerBase: BN;
    takerQuote: BN;
    mngoAccrued: BN;
    constructor(decoded: any);
    /**
     * Get average entry price of current position. Returned value is UI number.
     * Does not include fees.
     * Events are sorted latest event first
     */
    getAverageOpenPrice(mangoAccount: MangoAccount, // circular import?
    perpMarket: PerpMarket, events: any[]): Big;
    /**
     * Get price at which you break even. Includes fees.
     */
    getBreakEvenPrice(mangoAccount: MangoAccount, // circular import?
    perpMarket: PerpMarket, events: any[]): Big;
    getPnl(perpMarketInfo: PerpMarketInfo, perpMarketCache: PerpMarketCache, price: I80F48): I80F48;
    getUnsettledFunding(perpMarketCache: PerpMarketCache): I80F48;
    /**
     * Return the quote position after adjusting for unsettled funding
     */
    getQuotePosition(perpMarketCache: PerpMarketCache): I80F48;
    simPositionHealth(perpMarketInfo: PerpMarketInfo, price: I80F48, assetWeight: I80F48, liabWeight: I80F48, baseChange: BN): I80F48;
    getHealth(perpMarketInfo: PerpMarketInfo, price: I80F48, assetWeight: I80F48, liabWeight: I80F48, longFunding: I80F48, shortFunding: I80F48): I80F48;
    getLiabsVal(perpMarketInfo: PerpMarketInfo, price: I80F48, shortFunding: I80F48, longFunding: I80F48): I80F48;
    getAssetVal(perpMarketInfo: PerpMarketInfo, price: I80F48, shortFunding: I80F48, longFunding: I80F48): I80F48;
    getBasePositionUi(perpMarket: PerpMarket): number;
}
//# sourceMappingURL=PerpAccount.d.ts.map