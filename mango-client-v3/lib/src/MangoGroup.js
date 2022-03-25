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
const big_js_1 = require("big.js");
const _1 = require(".");
const fixednum_1 = require("./utils/fixednum");
const layout_1 = require("./layout");
const PerpMarket_1 = __importDefault(require("./PerpMarket"));
const RootBank_1 = __importDefault(require("./RootBank"));
const utils_1 = require("./utils/utils");
class MangoGroup {
    constructor(publicKey, decoded) {
        this.publicKey = publicKey;
        Object.assign(this, decoded);
        this.oracles = this.oracles.filter((o) => !o.equals(utils_1.zeroKey));
        this.rootBankAccounts = new Array(layout_1.MAX_TOKENS).fill(undefined);
    }
    getOracleIndex(oracle) {
        for (let i = 0; i < this.numOracles; i++) {
            if (this.oracles[i].equals(oracle)) {
                return i;
            }
        }
        throw new Error('This Oracle does not belong to this MangoGroup');
    }
    getSpotMarketIndex(spotMarketPk) {
        for (let i = 0; i < this.numOracles; i++) {
            if (this.spotMarkets[i].spotMarket.equals(spotMarketPk)) {
                return i;
            }
        }
        throw new Error('This Market does not belong to this MangoGroup');
    }
    getPerpMarketIndex(perpMarketPk) {
        for (let i = 0; i < this.numOracles; i++) {
            if (this.perpMarkets[i].perpMarket.equals(perpMarketPk)) {
                return i;
            }
        }
        throw new Error('This PerpMarket does not belong to this MangoGroup');
    }
    getTokenIndex(token) {
        for (let i = 0; i < this.tokens.length; i++) {
            if (this.tokens[i].mint.equals(token)) {
                return i;
            }
        }
        throw new Error('This token does not belong in this MangoGroup');
    }
    getRootBankIndex(rootBank) {
        for (let i = 0; i < this.tokens.length; i++) {
            if (this.tokens[i].rootBank.equals(rootBank)) {
                return i;
            }
        }
        throw new Error('This root bank does not belong in this MangoGroup');
    }
    getBorrowRate(tokenIndex) {
        const rootBank = this.rootBankAccounts[tokenIndex];
        if (!rootBank)
            throw new Error(`Root bank at index ${tokenIndex} is not loaded`);
        return rootBank.getBorrowRate(this);
    }
    getDepositRate(tokenIndex) {
        const rootBank = this.rootBankAccounts[tokenIndex];
        if (!rootBank)
            throw new Error(`Root bank at index ${tokenIndex} is not loaded`);
        return rootBank.getDepositRate(this);
    }
    /**
     * Return the decimals in TokenInfo;
     * If it's not QUOTE_INDEX and there is an oracle for this index but no SPL-Token, this will default to 6
     * Otherwise throw error
     */
    getTokenDecimals(tokenIndex) {
        const tokenInfo = this.tokens[tokenIndex];
        if (tokenInfo.decimals == 0) {
            if (this.oracles[tokenIndex].equals(utils_1.zeroKey)) {
                throw new Error('No oracle for this tokenIndex');
            }
            else {
                return 6;
            }
        }
        else {
            return tokenInfo.decimals;
        }
    }
    cachePriceToUi(price, tokenIndex) {
        const decimalAdj = new big_js_1.Big(10).pow(this.getTokenDecimals(tokenIndex) - this.getTokenDecimals(layout_1.QUOTE_INDEX));
        return price.toBig().mul(decimalAdj).toNumber();
    }
    getPrice(tokenIndex, mangoCache) {
        var _a;
        if (tokenIndex === layout_1.QUOTE_INDEX)
            return fixednum_1.ONE_I80F48;
        const decimalAdj = new big_js_1.Big(10).pow(this.getTokenDecimals(tokenIndex) - this.getTokenDecimals(layout_1.QUOTE_INDEX));
        return fixednum_1.I80F48.fromBig((_a = mangoCache.priceCache[tokenIndex]) === null || _a === void 0 ? void 0 : _a.price.toBig().mul(decimalAdj));
    }
    getPriceUi(tokenIndex, mangoCache) {
        var _a;
        if (tokenIndex === layout_1.QUOTE_INDEX)
            return 1;
        return (((_a = mangoCache.priceCache[tokenIndex]) === null || _a === void 0 ? void 0 : _a.price.toNumber()) *
            Math.pow(10, this.getTokenDecimals(tokenIndex) - this.getTokenDecimals(layout_1.QUOTE_INDEX)));
    }
    getPriceNative(tokenIndex, mangoCache) {
        if (tokenIndex === layout_1.QUOTE_INDEX)
            return fixednum_1.ONE_I80F48;
        return mangoCache.priceCache[tokenIndex].price;
    }
    getUiTotalDeposit(tokenIndex) {
        const rootBank = this.rootBankAccounts[tokenIndex];
        if (!rootBank)
            throw new Error(`Root bank at index ${tokenIndex} is not loaded`);
        return rootBank.getUiTotalDeposit(this);
    }
    getUiTotalBorrow(tokenIndex) {
        const rootBank = this.rootBankAccounts[tokenIndex];
        if (!rootBank)
            throw new Error(`Root bank at index ${tokenIndex} is not loaded`);
        return rootBank.getUiTotalBorrow(this);
    }
    loadCache(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            const account = yield connection.getAccountInfo(this.mangoCache);
            if (!account || !(account === null || account === void 0 ? void 0 : account.data))
                throw new Error('Unable to load cache');
            const decoded = layout_1.MangoCacheLayout.decode(account.data);
            return new layout_1.MangoCache(this.mangoCache, decoded);
        });
    }
    onCacheChange(connection, cb) {
        const sub = connection.onAccountChange(this.mangoCache, (ai, _) => {
            const decoded = layout_1.MangoCacheLayout.decode(ai.data);
            const parsed = new layout_1.MangoCache(this.mangoCache, decoded);
            cb(parsed);
        }, connection.commitment);
        return sub;
    }
    loadRootBanks(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            const rootBankPks = this.tokens
                .map((t) => t.rootBank)
                .filter((rB) => !rB.equals(utils_1.zeroKey));
            const rootBankAccts = yield utils_1.getMultipleAccounts(connection, rootBankPks);
            const parsedRootBanks = rootBankAccts.map((acc) => {
                const decoded = layout_1.RootBankLayout.decode(acc.accountInfo.data);
                return new RootBank_1.default(acc.publicKey, decoded);
            });
            const nodeBankPks = parsedRootBanks.map((bank) => bank.nodeBanks.filter((key) => !key.equals(utils_1.zeroKey)));
            const nodeBankAccts = yield utils_1.getMultipleAccounts(connection, nodeBankPks.flat());
            const nodeBankAccounts = nodeBankAccts.map((acc) => {
                const decoded = _1.NodeBankLayout.decode(acc.accountInfo.data);
                return new _1.NodeBank(acc.publicKey, decoded);
            });
            let nodeBankIndex = 0;
            for (let i = 0; i < parsedRootBanks.length; i++) {
                const rootBank = parsedRootBanks[i];
                const numNodeBanks = rootBank.nodeBanks.filter((pk) => !pk.equals(utils_1.zeroKey)).length;
                rootBank.nodeBankAccounts = nodeBankAccounts.slice(nodeBankIndex, nodeBankIndex + numNodeBanks);
                nodeBankIndex += numNodeBanks;
            }
            this.rootBankAccounts = this.tokens.map((t) => {
                const rootBank = parsedRootBanks.find((rB) => rB.publicKey.equals(t.rootBank));
                return rootBank !== null && rootBank !== void 0 ? rootBank : undefined;
            });
            return this.rootBankAccounts;
        });
    }
    loadPerpMarket(connection, marketIndex, baseDecimals, quoteDecimals) {
        return __awaiter(this, void 0, void 0, function* () {
            const pk = this.perpMarkets[marketIndex].perpMarket;
            const acc = yield connection.getAccountInfo(pk);
            const decoded = layout_1.PerpMarketLayout.decode(acc === null || acc === void 0 ? void 0 : acc.data);
            return new PerpMarket_1.default(pk, baseDecimals, quoteDecimals, decoded);
        });
    }
    getQuoteTokenInfo() {
        return this.tokens[this.tokens.length - 1];
    }
}
exports.default = MangoGroup;
//# sourceMappingURL=MangoGroup.js.map