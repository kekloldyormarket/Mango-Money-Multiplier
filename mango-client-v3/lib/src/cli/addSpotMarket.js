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
Object.defineProperty(exports, "__esModule", { value: true });
const serum_1 = require("@project-serum/serum");
const client_1 = require("../client");
const config_1 = require("../config");
function addSpotMarket(connection, payer, groupConfig, symbol, spotMarket, baseMint, maintLeverage, initLeverage, liquidationFee, optimalUtil, optimalRate, maxRate) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
        let group = yield client.getMangoGroup(groupConfig.publicKey);
        const oracleDesc = (0, config_1.getOracleBySymbol)(groupConfig, symbol);
        yield client.addSpotMarket(group, oracleDesc.publicKey, spotMarket, baseMint, payer, maintLeverage, initLeverage, liquidationFee, optimalUtil, optimalRate, maxRate);
        group = yield client.getMangoGroup(groupConfig.publicKey);
        const market = yield serum_1.Market.load(connection, spotMarket, undefined, groupConfig.serumProgramId);
        const banks = yield group.loadRootBanks(connection);
        const tokenIndex = group.getTokenIndex(baseMint);
        const nodeBanks = yield ((_a = banks[tokenIndex]) === null || _a === void 0 ? void 0 : _a.loadNodeBanks(connection));
        const tokenDesc = {
            symbol,
            mintKey: baseMint,
            decimals: group.tokens[tokenIndex].decimals,
            rootKey: (_b = banks[tokenIndex]) === null || _b === void 0 ? void 0 : _b.publicKey,
            nodeKeys: nodeBanks === null || nodeBanks === void 0 ? void 0 : nodeBanks.map((n) => n === null || n === void 0 ? void 0 : n.publicKey),
        };
        try {
            const token = (0, config_1.getTokenBySymbol)(groupConfig, symbol);
            Object.assign(token, tokenDesc);
        }
        catch (_) {
            groupConfig.tokens.push(tokenDesc);
        }
        const marketDesc = {
            name: `${symbol}/${groupConfig.quoteSymbol}`,
            publicKey: spotMarket,
            baseSymbol: symbol,
            baseDecimals: market['_baseSplTokenDecimals'],
            quoteDecimals: market['_quoteSplTokenDecimals'],
            marketIndex: tokenIndex,
            bidsKey: market.bidsAddress,
            asksKey: market.asksAddress,
            eventsKey: market['_decoded'].eventQueue,
        };
        const marketConfig = (0, config_1.getSpotMarketByBaseSymbol)(groupConfig, symbol);
        if (marketConfig) {
            Object.assign(marketConfig, marketDesc);
        }
        else {
            groupConfig.spotMarkets.push(marketDesc);
        }
        return groupConfig;
    });
}
exports.default = addSpotMarket;
//# sourceMappingURL=addSpotMarket.js.map