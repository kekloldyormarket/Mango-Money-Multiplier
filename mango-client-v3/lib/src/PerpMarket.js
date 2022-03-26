"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const big_js_1 = __importDefault(require("big.js"));
const bn_js_1 = __importDefault(require("bn.js"));
const _1 = require(".");
const fixednum_1 = require("./utils/fixednum");
const utils_1 = require("./utils/utils");
const os_1 = require("os");
class PerpMarket {
    constructor(publicKey, baseDecimals, quoteDecimals, decoded) {
        this.publicKey = publicKey;
        this.baseDecimals = baseDecimals;
        this.quoteDecimals = quoteDecimals;
        Object.assign(this, decoded);
        this.priceLotsToUiConvertor = new big_js_1.default(10)
            .pow(baseDecimals - quoteDecimals)
            .mul(new big_js_1.default(this.quoteLotSize.toString()))
            .div(new big_js_1.default(this.baseLotSize.toString()))
            .toNumber();
        this.baseLotsToUiConvertor = new big_js_1.default(this.baseLotSize.toString())
            .div(new big_js_1.default(10).pow(baseDecimals))
            .toNumber();
    }
    priceLotsToNative(price) {
        return fixednum_1.I80F48.fromI64(this.quoteLotSize.mul(price)).div(fixednum_1.I80F48.fromI64(this.baseLotSize));
    }
    baseLotsToNative(quantity) {
        return fixednum_1.I80F48.fromI64(this.baseLotSize.mul(quantity));
    }
    priceLotsToNumber(price) {
        return parseFloat(price.toString()) * this.priceLotsToUiConvertor;
    }
    baseLotsToNumber(quantity) {
        return parseFloat(quantity.toString()) * this.baseLotsToUiConvertor;
    }
    get minOrderSize() {
        if (this._minOrderSize === undefined) {
            this._minOrderSize = this.baseLotsToNumber(_1.ONE_BN);
        }
        return this._minOrderSize;
    }
    get tickSize() {
        if (this._tickSize === undefined) {
            this._tickSize = this.priceLotsToNumber(_1.ONE_BN);
        }
        return this._tickSize;
    }
    /**
     * Calculate the instantaneous funding rate using the bids and asks
     * Reported as an hourly number
     * Make sure `cache`, `bids` and `asks` are up to date
     */
    getCurrentFundingRate(group, cache, marketIndex, bids, asks) {
        const IMPACT_QUANTITY = new bn_js_1.default(100);
        const MIN_FUNDING = -0.05;
        const MAX_FUNDING = 0.05;
        const bid = bids.getImpactPriceUi(IMPACT_QUANTITY);
        const ask = asks.getImpactPriceUi(IMPACT_QUANTITY);
        const indexPrice = group.getPriceUi(marketIndex, cache);
        let diff;
        if (bid !== undefined && ask !== undefined) {
            const bookPrice = (bid + ask) / 2;
            diff = _1.clamp(bookPrice / indexPrice - 1, MIN_FUNDING, MAX_FUNDING);
        }
        else if (bid !== undefined) {
            diff = MAX_FUNDING;
        }
        else if (ask !== undefined) {
            diff = MIN_FUNDING;
        }
        else {
            diff = 0;
        }
        return diff / 24;
    }
    loadEventQueue(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            const acc = yield connection.getAccountInfo(this.eventQueue);
            const parsed = _1.PerpEventQueueLayout.decode(acc === null || acc === void 0 ? void 0 : acc.data);
            return new _1.PerpEventQueue(parsed);
        });
    }
    loadFills(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            const q = yield this.loadEventQueue(connection);
            // TODO - verify this works
            return q
                .eventsSince(utils_1.ZERO_BN)
                .map((e) => e.fill)
                .filter((e) => !!e)
                .map(this.parseFillEvent.bind(this));
        });
    }
    parseFillEvent(event) {
        const quantity = this.baseLotsToNumber(event.quantity);
        const price = this.priceLotsToNumber(event.price);
        return Object.assign(Object.assign({}, event), { quantity,
            price });
    }
    loadBids(connection, includeExpired = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const acc = yield connection.getAccountInfo(this.bids);
            return new _1.BookSide(this.bids, this, _1.BookSideLayout.decode(acc === null || acc === void 0 ? void 0 : acc.data), includeExpired);
        });
    }
    loadAsks(connection, includeExpired = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const acc = yield connection.getAccountInfo(this.asks);
            return new _1.BookSide(this.asks, this, _1.BookSideLayout.decode(acc === null || acc === void 0 ? void 0 : acc.data), includeExpired);
        });
    }
    loadOrdersForAccount(connection, account, includeExpired = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const [bids, asks] = yield Promise.all([
                this.loadBids(connection, includeExpired),
                this.loadAsks(connection, includeExpired),
            ]);
            // @ts-ignore
            return [...bids, ...asks].filter((order) => order.owner.equals(account.publicKey));
        });
    }
    uiToNativePriceQuantity(price, quantity) {
        const baseUnit = Math.pow(10, this.baseDecimals);
        const quoteUnit = Math.pow(10, this.quoteDecimals);
        const nativePrice = new bn_js_1.default(price * quoteUnit)
            .mul(this.baseLotSize)
            .div(this.quoteLotSize.mul(new bn_js_1.default(baseUnit)));
        const nativeQuantity = new bn_js_1.default(quantity * baseUnit).div(this.baseLotSize);
        return [nativePrice, nativeQuantity];
    }
    uiQuoteToLots(uiQuote) {
        const quoteUnit = Math.pow(10, this.quoteDecimals);
        return new bn_js_1.default(uiQuote * quoteUnit).div(this.quoteLotSize);
    }
    toPrettyString(group, perpMarketConfig) {
        const info = group.perpMarkets[perpMarketConfig.marketIndex];
        const oracle = group.oracles[perpMarketConfig.marketIndex];
        const lmi = this.liquidityMiningInfo;
        const now = Date.now() / 1000;
        const start = lmi.periodStart.toNumber();
        const elapsed = now - start;
        const progress = 1 - lmi.mngoLeft.toNumber() / lmi.mngoPerPeriod.toNumber();
        const est = start + elapsed / progress;
        const lines = [
            `${perpMarketConfig.name}`,
            `version: ${this.metaData.version}`,
            `publicKey: ${perpMarketConfig.publicKey.toBase58()}`,
            `oracle: ${oracle.toBase58()}`,
            `initAssetWeight: ${group.perpMarkets[perpMarketConfig.marketIndex].initAssetWeight.toString()}`,
            `maintAssetWeight: ${group.perpMarkets[perpMarketConfig.marketIndex].maintAssetWeight.toString()}`,
            `marketIndex: ${perpMarketConfig.marketIndex}`,
            `bidsKey: ${this.bids.toBase58()}`,
            `asksKey: ${this.asks.toBase58()}`,
            `eventQueue: ${this.eventQueue.toBase58()}`,
            `quoteLotSize: ${this.quoteLotSize.toString()}`,
            `baseLotSize: ${this.baseLotSize.toString()}`,
            `longFunding: ${this.longFunding.toString()}`,
            `shortFunding: ${this.shortFunding.toString()}`,
            `openInterest: ${this.openInterest.toString()}`,
            `lastUpdated: ${new Date(this.lastUpdated.toNumber() * 1000).toUTCString()}`,
            `seqNum: ${this.seqNum.toString()}`,
            `liquidationFee: ${info.liquidationFee.toString()}`,
            `takerFee: ${info.takerFee.toString()}`,
            `makerFee: ${info.makerFee.toString()}`,
            `feesAccrued: ${_1.nativeToUi(this.feesAccrued.toNumber(), 6).toFixed(6)}`,
            `\n----- ${perpMarketConfig.name} Liquidity Mining Info -----`,
            `rate: ${lmi.rate.toString()}`,
            `maxDepth: ${this.metaData.version === 0
                ? lmi.maxDepthBps.toString() + ' bps'
                : lmi.maxDepthBps.toString() + ' contracts'}`,
            `exp: ${this.metaData.extraInfo[0] || 2}`,
            `lmSizeShift: ${this.metaData.extraInfo[1]}`,
            `periodStart: ${new Date(lmi.periodStart.toNumber() * 1000).toUTCString()}`,
            `targetPeriodLength: ${lmi.targetPeriodLength.toString()}`,
            `mngoLeftInPeriod: ${(lmi.mngoLeft.toNumber() / Math.pow(10, 6)).toFixed(2)}`,
            `mngoPerPeriod: ${(lmi.mngoPerPeriod.toNumber() / Math.pow(10, 6)).toFixed(2)}`,
            `periodProgress: ${progress * 100}%`,
            `estPeriodEnd: ${new Date(est * 1000).toUTCString()}`,
            `mngoVault: ${this.mngoVault.toString()}`,
        ];
        return lines.join(os_1.EOL);
    }
}
exports.default = PerpMarket;
//# sourceMappingURL=PerpMarket.js.map