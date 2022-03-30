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
const __1 = require("..");
const client_1 = require("../client");
const config_1 = require("../config");
function addPerpMarket(connection, payer, groupConfig, symbol, maintLeverage, initLeverage, liquidationFee, makerFee, takerFee, baseLotSize, quoteLotSize, maxNumEvents, rate, maxDepthBps, targetPeriodLength, mngoPerPeriod, exp) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        console.log({
            connection,
            payer,
            groupConfig,
            symbol,
        });
        const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
        let group = yield client.getMangoGroup(groupConfig.publicKey);
        const oracleDesc = (0, config_1.getOracleBySymbol)(groupConfig, symbol);
        const marketIndex = group.getOracleIndex(oracleDesc.publicKey);
        // Adding perp market
        let nativeMngoPerPeriod = 0;
        if (rate !== 0) {
            const token = (0, config_1.getTokenBySymbol)(groupConfig, 'MNGO');
            if (token === undefined) {
                throw new Error('MNGO not found in group config');
            }
            else {
                nativeMngoPerPeriod = (0, __1.uiToNative)(mngoPerPeriod, token.decimals).toNumber();
            }
        }
        yield client.addPerpMarket(group, oracleDesc.publicKey, config_1.mngoMints[groupConfig.cluster], payer, maintLeverage, initLeverage, liquidationFee, makerFee, takerFee, baseLotSize, quoteLotSize, maxNumEvents, rate, maxDepthBps, targetPeriodLength, nativeMngoPerPeriod, exp);
        group = yield client.getMangoGroup(groupConfig.publicKey);
        const marketPk = group.perpMarkets[marketIndex].perpMarket;
        const baseDecimals = (_a = (0, config_1.getTokenBySymbol)(groupConfig, symbol)) === null || _a === void 0 ? void 0 : _a.decimals;
        const quoteDecimals = (_b = (0, config_1.getTokenBySymbol)(groupConfig, groupConfig.quoteSymbol)) === null || _b === void 0 ? void 0 : _b.decimals;
        const market = yield client.getPerpMarket(marketPk, baseDecimals, quoteDecimals);
        const marketDesc = {
            name: `${symbol}-PERP`,
            publicKey: marketPk,
            baseSymbol: symbol,
            baseDecimals,
            quoteDecimals,
            marketIndex,
            bidsKey: market.bids,
            asksKey: market.asks,
            eventsKey: market.eventQueue,
        };
        const marketConfig = (0, config_1.getPerpMarketByBaseSymbol)(groupConfig, symbol);
        if (marketConfig) {
            Object.assign(marketConfig, marketDesc);
        }
        else {
            groupConfig.perpMarkets.push(marketDesc);
        }
        return groupConfig;
    });
}
exports.default = addPerpMarket;
//# sourceMappingURL=addPerpMarket.js.map