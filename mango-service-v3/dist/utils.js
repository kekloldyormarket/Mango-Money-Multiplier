"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidCoin = exports.isValidPerpMarket = exports.isValidMarket = exports.logger = exports.zipDict = exports.patchInternalMarketName = exports.patchExternalMarketName = exports.i80f48ToPercent = exports.transactionSize = void 0;
const mango_client_1 = require("@blockworks-foundation/mango-client");
const fixednum_1 = require("@blockworks-foundation/mango-client/lib/src/fixednum");
const pino_1 = __importDefault(require("pino"));
/// solana related
async function transactionSize(connection, singleTransaction, owner) {
    singleTransaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    singleTransaction.setSigners(owner.publicKey);
    singleTransaction.sign(this.owner);
    return singleTransaction.serialize().length;
}
exports.transactionSize = transactionSize;
/// mango related
const i80f48ToPercent = (value) => value.mul(fixednum_1.I80F48.fromNumber(100));
exports.i80f48ToPercent = i80f48ToPercent;
const groupName = process.env.GROUP || "mainnet.1";
const mangoGroupConfig = mango_client_1.Config.ids().groups.filter((group) => group.name === groupName)[0];
const allMarketNames = mangoGroupConfig.spotMarkets
    .map((spotMarketConfig) => spotMarketConfig.baseSymbol + "-SPOT")
    .concat(mangoGroupConfig.perpMarkets.map((perpMarketConfig) => perpMarketConfig.name));
const allPerpMarketNames = mangoGroupConfig.perpMarkets.map((perpMarketConfig) => perpMarketConfig.name);
const allCoins = mangoGroupConfig.tokens.map((tokenConfig) => tokenConfig.symbol);
function patchExternalMarketName(marketName) {
    if (marketName.includes("-SPOT")) {
        marketName = marketName.replace("-SPOT", "/USDC");
    }
    return marketName;
}
exports.patchExternalMarketName = patchExternalMarketName;
function patchInternalMarketName(marketName) {
    if (marketName.includes("/USDC")) {
        marketName = marketName.replace("/USDC", "-SPOT");
    }
    return marketName;
}
exports.patchInternalMarketName = patchInternalMarketName;
/// general
function zipDict(keys, values) {
    const result = {};
    keys.forEach((key, index) => {
        result[key] = values[index];
    });
    return result;
}
exports.zipDict = zipDict;
exports.logger = (0, pino_1.default)({
    prettyPrint: { translateTime: true },
});
/// expressjs related
const isValidMarket = (marketName) => {
    if (allMarketNames.indexOf(marketName) === -1) {
        return Promise.reject(`Market ${marketName} not supported!`);
    }
    return Promise.resolve();
};
exports.isValidMarket = isValidMarket;
const isValidPerpMarket = (marketName) => {
    if (allPerpMarketNames.indexOf(marketName) === -1) {
        return Promise.reject(`Perp Market ${marketName} not supported!`);
    }
    return Promise.resolve();
};
exports.isValidPerpMarket = isValidPerpMarket;
const isValidCoin = (coin) => {
    if (allCoins.indexOf(coin) === -1) {
        return Promise.reject(`Coin ${coin} not supported!`);
    }
    return Promise.resolve();
};
exports.isValidCoin = isValidCoin;
//# sourceMappingURL=utils.js.map