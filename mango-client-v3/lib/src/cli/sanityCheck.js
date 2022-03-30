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
const client_1 = require("../client");
const config_1 = require("../config");
const layout_1 = require("../layout");
const fixednum_1 = require("../utils/fixednum");
const utils_1 = require("../utils/utils");
function setUp(client, mangoGroupKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const mangoGroup = yield client.getMangoGroup(mangoGroupKey);
        const rootBanks = yield mangoGroup.loadRootBanks(client.connection);
        const vaults = yield Promise.all(rootBanks.map((rootBank) => {
            if (rootBank === undefined) {
                return (0, utils_1.promiseUndef)();
            }
            else {
                // Assumes only one node bank; Fix if we add more node bank
                return client.connection.getTokenAccountBalance(rootBank.nodeBankAccounts[0].vault);
            }
        }));
        const mangoAccounts = yield client.getAllMangoAccounts(mangoGroup, undefined, true);
        const mangoCache = yield mangoGroup.loadCache(client.connection);
        const perpMarkets = yield Promise.all(mangoGroup.perpMarkets.map((pmi, i) => pmi.isEmpty()
            ? undefined
            : client.getPerpMarket(pmi.perpMarket, mangoGroup.tokens[i].decimals, mangoGroup.tokens[layout_1.QUOTE_INDEX].decimals)));
        return { mangoGroup, mangoCache, vaults, mangoAccounts, perpMarkets };
    });
}
function checkSumOfBasePositions(groupConfig, mangoCache, mangoAccounts, perpMarkets) {
    var _a;
    let totalBase = utils_1.ZERO_BN;
    let totalQuote = fixednum_1.ZERO_I80F48;
    for (let i = 0; i < layout_1.QUOTE_INDEX; i++) {
        if (perpMarkets[i] === undefined) {
            continue;
        }
        const perpMarket = perpMarkets[i];
        let sumOfAllBasePositions = utils_1.ZERO_BN;
        let absBasePositions = utils_1.ZERO_BN;
        let sumQuote = perpMarket.feesAccrued;
        const perpMarketCache = mangoCache.perpMarketCache[i];
        for (const mangoAccount of mangoAccounts) {
            const perpAccount = mangoAccount.perpAccounts[i];
            sumOfAllBasePositions = sumOfAllBasePositions.add(perpAccount.basePosition);
            absBasePositions = absBasePositions.add(perpAccount.basePosition.abs());
            sumQuote = sumQuote.add(perpAccount.getQuotePosition(perpMarketCache));
        }
        console.log(`Market: ${(_a = (0, config_1.getPerpMarketByIndex)(groupConfig, i)) === null || _a === void 0 ? void 0 : _a.name}
      Sum Base Pos: ${sumOfAllBasePositions.toString()}
      Sum Abs Base Pos ${absBasePositions.toString()}
      Open Interest: ${perpMarket.openInterest.toString()}
      Sum Quote: ${sumQuote.toString()}\n`);
        totalBase = totalBase.add(sumOfAllBasePositions);
        totalQuote = totalQuote.add(sumQuote);
    }
    console.log(`Total Base: ${totalBase.toString()}\nTotal Quote: ${totalQuote.toString()}`);
}
function checkSumOfNetDeposit(groupConfig, connection, mangoGroup, mangoCache, vaults, mangoAccounts) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < mangoGroup.tokens.length; i++) {
            if (mangoGroup.tokens[i].mint.equals(utils_1.zeroKey)) {
                continue;
            }
            console.log('======');
            console.log((_a = (0, config_1.getTokenByMint)(groupConfig, mangoGroup.tokens[i].mint)) === null || _a === void 0 ? void 0 : _a.symbol);
            console.log('deposit index', mangoCache.rootBankCache[i].depositIndex.toString());
            console.log('borrow index', mangoCache.rootBankCache[i].borrowIndex.toString());
            const sumOfNetDepositsAcrossMAs = mangoAccounts.reduce((sum, mangoAccount) => {
                return sum.add(mangoAccount.getNet(mangoCache.rootBankCache[i], i));
            }, fixednum_1.ZERO_I80F48);
            console.log('sumOfNetDepositsAcrossMAs:', sumOfNetDepositsAcrossMAs.toString());
            const rootBank = mangoGroup.rootBankAccounts[i];
            let vaultAmount = fixednum_1.ZERO_I80F48;
            if (rootBank) {
                const nodeBanks = rootBank.nodeBankAccounts;
                const sumOfNetDepositsAcrossNodes = nodeBanks.reduce((sum, nodeBank) => {
                    return sum.add(nodeBank.deposits.mul(mangoCache.rootBankCache[i].depositIndex));
                }, fixednum_1.ZERO_I80F48);
                const sumOfNetBorrowsAcrossNodes = nodeBanks.reduce((sum, nodeBank) => {
                    return sum.add(nodeBank.borrows.mul(mangoCache.rootBankCache[i].borrowIndex));
                }, fixednum_1.ZERO_I80F48);
                console.log('sumOfNetDepositsAcrossNodes:', sumOfNetDepositsAcrossNodes.toString());
                console.log('sumOfNetBorrowsAcrossNodes:', sumOfNetBorrowsAcrossNodes.toString());
                vaultAmount = fixednum_1.I80F48.fromString(vaults[i].value.amount);
                console.log('vaultAmount:', vaultAmount.toString());
                console.log('nodesDiff:', vaultAmount
                    .sub(sumOfNetDepositsAcrossNodes)
                    .add(sumOfNetBorrowsAcrossNodes)
                    .toString());
            }
            console.log('Diff', vaultAmount.sub(sumOfNetDepositsAcrossMAs).toString());
        }
    });
}
function sanityCheck(connection, groupConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
        const { mangoGroup, mangoCache, vaults, mangoAccounts, perpMarkets } = yield setUp(client, groupConfig.publicKey);
        checkSumOfBasePositions(groupConfig, mangoCache, mangoAccounts, perpMarkets);
        yield checkSumOfNetDeposit(groupConfig, connection, mangoGroup, mangoCache, vaults, mangoAccounts);
    });
}
exports.default = sanityCheck;
//# sourceMappingURL=sanityCheck.js.map