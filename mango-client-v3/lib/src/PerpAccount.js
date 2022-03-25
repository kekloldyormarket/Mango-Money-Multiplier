"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const fixednum_1 = require("./utils/fixednum");
const big_js_1 = __importDefault(require("big.js"));
const ZERO = new big_js_1.default(0);
const NEG_ONE = new big_js_1.default(-1);
class PerpAccount {
    constructor(decoded) {
        Object.assign(this, decoded);
    }
    /**
     * Get average entry price of current position. Returned value is UI number.
     * Does not include fees.
     * Events are sorted latest event first
     */
    getAverageOpenPrice(mangoAccount, // circular import?
    perpMarket, events) {
        if (this.basePosition.isZero()) {
            return ZERO;
        }
        const basePos = perpMarket.baseLotsToNumber(this.basePosition);
        const userPk = mangoAccount.publicKey.toString();
        let currBase = new big_js_1.default(basePos);
        let openingQuote = ZERO;
        for (const event of events) {
            let price, baseChange;
            if ('liqor' in event) {
                const le = event;
                price = new big_js_1.default(le.price);
                let quantity = new big_js_1.default(le.quantity);
                if (userPk === le.liqee.toString()) {
                    quantity = quantity.mul(NEG_ONE);
                }
                if (currBase.gt(ZERO) && quantity.gt(ZERO)) {
                    // liquidation that opens
                    baseChange = quantity.lt(currBase) ? quantity : currBase; // get min value
                }
                else if (currBase.lt(ZERO) && quantity.lt(ZERO)) {
                    // liquidation that opens
                    baseChange = currBase.gt(quantity) ? currBase : quantity; // get max value
                }
                else {
                    // liquidation that closes
                    continue;
                }
            }
            else {
                const fe = event;
                // TODO - verify this gives proper UI number
                price = new big_js_1.default(fe.price);
                let quantity = new big_js_1.default(fe.quantity);
                if ((userPk === fe.taker.toString() && fe.takerSide === 'sell') ||
                    (userPk === fe.maker.toString() && fe.takerSide === 'buy')) {
                    quantity = quantity.mul(NEG_ONE);
                }
                if (currBase.gt(ZERO) && quantity.gt(ZERO)) {
                    // Means we are opening long
                    baseChange = quantity.lt(currBase) ? quantity : currBase; // get min value
                }
                else if (currBase.lt(ZERO) && quantity.lt(ZERO)) {
                    // means we are opening short
                    baseChange = currBase.gt(quantity) ? currBase : quantity; // get max value
                }
                else {
                    // ignore closing trades
                    continue;
                }
            }
            openingQuote = openingQuote.sub(baseChange.mul(price));
            currBase = currBase.sub(baseChange);
            if (currBase.eq(ZERO)) {
                return openingQuote.div(basePos).abs();
            }
        }
        // If we haven't returned yet, there was an error or missing data
        // TODO - consider failing silently
        throw new Error('Trade history incomplete');
    }
    /**
     * Get price at which you break even. Includes fees.
     */
    getBreakEvenPrice(mangoAccount, // circular import?
    perpMarket, events) {
        if (this.basePosition.isZero()) {
            return ZERO;
        }
        const basePos = perpMarket.baseLotsToNumber(this.basePosition);
        const userPk = mangoAccount.publicKey.toString();
        let currBase = new big_js_1.default(basePos);
        let totalQuoteChange = ZERO;
        for (const event of events) {
            let price, baseChange;
            if ('liqor' in event) {
                // TODO - build cleaner way to distinguish events
                const le = event;
                price = new big_js_1.default(le.price);
                let quantity = new big_js_1.default(le.quantity);
                if (userPk === le.liqee.toString()) {
                    quantity = quantity.mul(NEG_ONE);
                }
                if (currBase.gt(ZERO) && quantity.gt(ZERO)) {
                    // liquidation that opens
                    baseChange = quantity.lt(currBase) ? quantity : currBase; // get min value
                }
                else if (currBase.lt(ZERO) && quantity.lt(ZERO)) {
                    // liquidation that opens
                    baseChange = currBase.gt(quantity) ? currBase : quantity; // get max value
                }
                else {
                    // liquidation that closes
                    baseChange = quantity;
                }
            }
            else {
                const fe = event;
                // TODO - verify this gives proper UI number
                price = new big_js_1.default(fe.price);
                let quantity = new big_js_1.default(fe.quantity);
                if ((userPk === fe.taker.toString() && fe.takerSide === 'sell') ||
                    (userPk === fe.maker.toString() && fe.takerSide === 'buy')) {
                    quantity = quantity.mul(NEG_ONE);
                }
                if (currBase.gt(ZERO) && quantity.gt(ZERO)) {
                    // Means we are opening long
                    baseChange = currBase.lt(quantity) ? currBase : quantity; // get min value
                }
                else if (currBase.lt(ZERO) && quantity.lt(ZERO)) {
                    // means we are opening short
                    baseChange = currBase.gt(quantity) ? currBase : quantity; // get max value
                }
                else {
                    baseChange = quantity;
                }
            }
            totalQuoteChange = totalQuoteChange.sub(baseChange.mul(price));
            currBase = currBase.sub(baseChange);
            if (currBase.eq(ZERO)) {
                return totalQuoteChange.mul(NEG_ONE).div(basePos);
            }
        }
        // If we haven't returned yet, there was an error or missing data
        // TODO - consider failing silently
        throw new Error('Trade history incomplete');
    }
    getPnl(perpMarketInfo, perpMarketCache, price) {
        return fixednum_1.I80F48.fromI64(this.basePosition.mul(perpMarketInfo.baseLotSize))
            .mul(price)
            .add(this.getQuotePosition(perpMarketCache));
    }
    getUnsettledFunding(perpMarketCache) {
        if (this.basePosition.isNeg()) {
            return fixednum_1.I80F48.fromI64(this.basePosition).mul(perpMarketCache.shortFunding.sub(this.shortSettledFunding));
        }
        else {
            return fixednum_1.I80F48.fromI64(this.basePosition).mul(perpMarketCache.longFunding.sub(this.longSettledFunding));
        }
    }
    /**
     * Return the quote position after adjusting for unsettled funding
     */
    getQuotePosition(perpMarketCache) {
        return this.quotePosition.sub(this.getUnsettledFunding(perpMarketCache));
    }
    simPositionHealth(perpMarketInfo, price, assetWeight, liabWeight, baseChange) {
        const newBase = this.basePosition.add(baseChange);
        let health = this.quotePosition.sub(fixednum_1.I80F48.fromI64(baseChange.mul(perpMarketInfo.baseLotSize)).mul(price));
        if (newBase.gt(_1.ZERO_BN)) {
            health = health.add(fixednum_1.I80F48.fromI64(newBase.mul(perpMarketInfo.baseLotSize))
                .mul(price)
                .mul(assetWeight));
        }
        else {
            health = health.add(fixednum_1.I80F48.fromI64(newBase.mul(perpMarketInfo.baseLotSize))
                .mul(price)
                .mul(liabWeight));
        }
        return health;
    }
    getHealth(perpMarketInfo, price, assetWeight, liabWeight, longFunding, shortFunding) {
        const bidsHealth = this.simPositionHealth(perpMarketInfo, price, assetWeight, liabWeight, this.bidsQuantity);
        const asksHealth = this.simPositionHealth(perpMarketInfo, price, assetWeight, liabWeight, this.asksQuantity.neg());
        const health = bidsHealth.lt(asksHealth) ? bidsHealth : asksHealth;
        let x;
        if (this.basePosition.gt(_1.ZERO_BN)) {
            x = health.sub(longFunding
                .sub(this.longSettledFunding)
                .mul(fixednum_1.I80F48.fromI64(this.basePosition)));
        }
        else {
            x = health.add(shortFunding
                .sub(this.shortSettledFunding)
                .mul(fixednum_1.I80F48.fromI64(this.basePosition)));
        }
        return x;
    }
    getLiabsVal(perpMarketInfo, price, shortFunding, longFunding) {
        let liabsVal = fixednum_1.ZERO_I80F48;
        if (this.basePosition.lt(_1.ZERO_BN)) {
            liabsVal = liabsVal.add(fixednum_1.I80F48.fromI64(this.basePosition.mul(perpMarketInfo.baseLotSize)).mul(price));
        }
        let realQuotePosition = this.quotePosition;
        if (this.basePosition.gt(_1.ZERO_BN)) {
            realQuotePosition = this.quotePosition.sub(longFunding
                .sub(this.longSettledFunding)
                .mul(fixednum_1.I80F48.fromI64(this.basePosition)));
        }
        else if (this.basePosition.lt(_1.ZERO_BN)) {
            realQuotePosition = this.quotePosition.sub(shortFunding
                .sub(this.shortSettledFunding)
                .mul(fixednum_1.I80F48.fromI64(this.basePosition)));
        }
        if (realQuotePosition.lt(fixednum_1.ZERO_I80F48)) {
            liabsVal = liabsVal.add(realQuotePosition);
        }
        return liabsVal.neg();
    }
    getAssetVal(perpMarketInfo, price, shortFunding, longFunding) {
        let assetsVal = fixednum_1.ZERO_I80F48;
        if (this.basePosition.gt(_1.ZERO_BN)) {
            assetsVal = assetsVal.add(fixednum_1.I80F48.fromI64(this.basePosition.mul(perpMarketInfo.baseLotSize)).mul(price));
        }
        let realQuotePosition = this.quotePosition;
        if (this.basePosition.gt(_1.ZERO_BN)) {
            realQuotePosition = this.quotePosition.sub(longFunding
                .sub(this.longSettledFunding)
                .mul(fixednum_1.I80F48.fromI64(this.basePosition)));
        }
        else if (this.basePosition.lt(_1.ZERO_BN)) {
            realQuotePosition = this.quotePosition.sub(shortFunding
                .sub(this.shortSettledFunding)
                .mul(fixednum_1.I80F48.fromI64(this.basePosition)));
        }
        if (realQuotePosition.gt(fixednum_1.ZERO_I80F48)) {
            assetsVal = assetsVal.add(realQuotePosition);
        }
        return assetsVal;
    }
    getBasePositionUi(perpMarket) {
        return perpMarket.baseLotsToNumber(this.basePosition);
    }
}
exports.default = PerpAccount;
//# sourceMappingURL=PerpAccount.js.map