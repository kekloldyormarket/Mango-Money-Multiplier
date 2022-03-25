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
const web3_js_1 = require("@solana/web3.js");
const __1 = require("..");
const client_1 = require("../client");
const config_1 = require("../config");
// e.g. CLUSTER=devnet GROUP=mainnet.1 yarn ts-node src/markets.ts
// e.g. SYMBOL=MNGO CLUSTER=devnet GROUP=devnet.3 yarn ts-node src/markets.ts
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.ids();
        const cluster = (process.env.CLUSTER || 'mainnet');
        const connection = new web3_js_1.Connection(config.cluster_urls[cluster], 'processed');
        const groupName = process.env.GROUP || 'mainnet.1';
        const groupIds = config.getGroup(cluster, groupName);
        if (!groupIds) {
            throw new Error(`Group ${groupName} not found`);
        }
        const mangoProgramId = groupIds.mangoProgramId;
        const mangoGroupKey = groupIds.publicKey;
        const client = new client_1.MangoClient(connection, mangoProgramId);
        const group = yield client.getMangoGroup(mangoGroupKey);
        const rootBanks = yield group.loadRootBanks(connection);
        function dumpPerpMarket(config) {
            return __awaiter(this, void 0, void 0, function* () {
                const market = yield client.getPerpMarket(config.publicKey, config.baseDecimals, config.quoteDecimals);
                console.log(market.toPrettyString(group, config), '\n');
            });
        }
        function dumpSpotMarket(spotMarketConfig) {
            return __awaiter(this, void 0, void 0, function* () {
                const spotMarketInfo = group.spotMarkets[group.getSpotMarketIndex(spotMarketConfig.publicKey)];
                console.log(`----- ${spotMarketConfig.name} SpotMarketInfo -----`);
                console.log(`- maintAssetWeight: ${spotMarketInfo.maintAssetWeight
                    .toNumber()
                    .toFixed(2)}`);
                console.log(`- initAssetWeight: ${spotMarketInfo.initAssetWeight
                    .toNumber()
                    .toFixed(2)}`);
                console.log(`- maintLiabWeight: ${spotMarketInfo.maintLiabWeight
                    .toNumber()
                    .toFixed(2)}`);
                console.log(`- initLiabWeight: ${spotMarketInfo.initLiabWeight
                    .toNumber()
                    .toFixed(2)}`);
                console.log(`- liquidationFee: ${spotMarketInfo.liquidationFee
                    .toNumber()
                    .toFixed(2)}`);
                console.log(``);
            });
        }
        for (const m of groupIds.perpMarkets.filter((config) => process.env.SYMBOL ? config.baseSymbol === process.env.SYMBOL : true)) {
            yield dumpPerpMarket(m);
        }
        function dumpRootBank(name, rootBank) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(`----- ${name} RootBank -----`);
                console.log(`- optimalUtil - ${rootBank.optimalUtil.toNumber().toFixed(2)}`);
                console.log(`- optimalRate - ${rootBank.optimalRate.toNumber().toFixed(2)}`);
                console.log(`- maxRate - ${rootBank.maxRate.toNumber().toFixed(2)}`);
                console.log(`- depositIndex - ${rootBank.depositIndex.toNumber()}`);
                console.log(`- borrowIndex - ${rootBank.borrowIndex.toNumber()}`);
                const date = new Date(0);
                date.setUTCSeconds(rootBank.lastUpdated.toNumber());
                console.log(`- lastUpdated - ${date.toUTCString()}`);
                console.log(``);
            });
        }
        for (const m of groupIds.spotMarkets.filter((config) => process.env.SYMBOL ? config.baseSymbol === process.env.SYMBOL : true)) {
            yield dumpSpotMarket(m);
            const tokenBySymbol = __1.getTokenBySymbol(groupIds, m.baseSymbol);
            const tokenIndex = group.getTokenIndex(tokenBySymbol.mintKey);
            const rootBank = rootBanks[tokenIndex];
            yield dumpRootBank(m.baseSymbol, rootBank);
        }
        // usdc
        const tokenBySymbol = __1.getTokenBySymbol(groupIds, 'USDC');
        const tokenIndex = group.getTokenIndex(tokenBySymbol.mintKey);
        const rootBank = rootBanks[tokenIndex];
        yield dumpRootBank('USDC', rootBank);
        process.exit();
    });
}
main();
//# sourceMappingURL=markets.js.map