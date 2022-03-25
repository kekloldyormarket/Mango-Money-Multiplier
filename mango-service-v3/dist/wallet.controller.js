"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mango_client_1 = require("@blockworks-foundation/mango-client");
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
class WalletController {
    constructor(mangoSimpleClient) {
        this.mangoSimpleClient = mangoSimpleClient;
        this.path = "/api/wallet";
        this.router = (0, express_1.Router)();
        this.fetchBalances = async (request, response, next) => {
            this.fetchBalancesInternal()
                .then((balanceDtos) => {
                return response.send({
                    success: true,
                    result: balanceDtos,
                });
            })
                .catch((error) => {
                utils_1.logger.error(`message - ${error.message}, ${error.stack}`);
                return response.status(500).send({
                    errors: [{ msg: error.message }],
                });
            });
        };
        this.withdraw = async (request, response, next) => {
            const withdrawDto = request.body;
            this.mangoSimpleClient
                .withdraw(withdrawDto.coin, withdrawDto.size)
                .then(() => {
                response.status(200);
            })
                .catch((error) => {
                utils_1.logger.error(`message - ${error.message}, ${error.stack}`);
                return response.status(500).send({
                    errors: [{ msg: error.message }],
                });
            });
        };
        this.initializeRoutes();
    }
    initializeRoutes() {
        // POST /wallet/balances
        this.router.get(`${this.path}/balances`, this.fetchBalances);
        // POST /wallet/withdrawals
        this.router.post(`${this.path}/withdrawals`, (0, express_validator_1.body)("coin").not().isEmpty().custom(utils_1.isValidCoin), (0, express_validator_1.body)("size").isNumeric(), this.withdraw);
    }
    async fetchBalancesInternal() {
        // local copies of mango objects
        const mangoGroupConfig = this.mangoSimpleClient.mangoGroupConfig;
        const mangoGroup = this.mangoSimpleClient.mangoGroup;
        // (re)load things which we want fresh
        const [mangoAccount, mangoCache, rootBanks] = await Promise.all([
            this.mangoSimpleClient.mangoAccount.reload(this.mangoSimpleClient.connection, this.mangoSimpleClient.mangoGroup.dexProgramId),
            this.mangoSimpleClient.mangoGroup.loadCache(this.mangoSimpleClient.connection),
            mangoGroup.loadRootBanks(this.mangoSimpleClient.connection),
        ]);
        ////// copy pasta block from mango-ui-v3
        /* tslint:disable */
        const balances = new Array();
        for (const { marketIndex, baseSymbol, name, } of mangoGroupConfig.spotMarkets) {
            if (!mangoAccount || !mangoGroup) {
                return [];
            }
            const openOrders = mangoAccount.spotOpenOrdersAccounts[marketIndex];
            const quoteCurrencyIndex = mango_client_1.QUOTE_INDEX;
            let nativeBaseFree = 0;
            let nativeQuoteFree = 0;
            let nativeBaseLocked = 0;
            let nativeQuoteLocked = 0;
            if (openOrders) {
                nativeBaseFree = openOrders.baseTokenFree.toNumber();
                nativeQuoteFree = openOrders.quoteTokenFree
                    .add(openOrders["referrerRebatesAccrued"])
                    .toNumber();
                nativeBaseLocked = openOrders.baseTokenTotal
                    .sub(openOrders.baseTokenFree)
                    .toNumber();
                nativeQuoteLocked = openOrders.quoteTokenTotal
                    .sub(openOrders.quoteTokenFree)
                    .toNumber();
            }
            const tokenIndex = marketIndex;
            const net = (nativeBaseLocked, tokenIndex) => {
                const amount = mangoAccount
                    .getUiDeposit(mangoCache.rootBankCache[tokenIndex], mangoGroup, tokenIndex)
                    .add((0, mango_client_1.nativeI80F48ToUi)(mango_client_1.I80F48.fromNumber(nativeBaseLocked), mangoGroup.tokens[tokenIndex].decimals).sub(mangoAccount.getUiBorrow(mangoCache.rootBankCache[tokenIndex], mangoGroup, tokenIndex)));
                return amount;
            };
            const value = (nativeBaseLocked, tokenIndex) => {
                const amount = mangoGroup
                    .getPrice(tokenIndex, mangoCache)
                    .mul(net(nativeBaseLocked, tokenIndex));
                return amount;
            };
            const marketPair = [
                {
                    market: null,
                    key: `${name}`,
                    symbol: baseSymbol,
                    deposits: mangoAccount.getUiDeposit(mangoCache.rootBankCache[tokenIndex], mangoGroup, tokenIndex),
                    borrows: mangoAccount.getUiBorrow(mangoCache.rootBankCache[tokenIndex], mangoGroup, tokenIndex),
                    orders: (0, mango_client_1.nativeToUi)(nativeBaseLocked, mangoGroup.tokens[tokenIndex].decimals),
                    unsettled: (0, mango_client_1.nativeToUi)(nativeBaseFree, mangoGroup.tokens[tokenIndex].decimals),
                    net: net(nativeBaseLocked, tokenIndex),
                    value: value(nativeBaseLocked, tokenIndex),
                    depositRate: (0, utils_1.i80f48ToPercent)(mangoGroup.getDepositRate(tokenIndex)),
                    borrowRate: (0, utils_1.i80f48ToPercent)(mangoGroup.getBorrowRate(tokenIndex)),
                },
                {
                    market: null,
                    key: `${name}`,
                    symbol: mangoGroupConfig.quoteSymbol,
                    deposits: mangoAccount.getUiDeposit(mangoCache.rootBankCache[quoteCurrencyIndex], mangoGroup, quoteCurrencyIndex),
                    borrows: mangoAccount.getUiBorrow(mangoCache.rootBankCache[quoteCurrencyIndex], mangoGroup, quoteCurrencyIndex),
                    orders: (0, mango_client_1.nativeToUi)(nativeQuoteLocked, mangoGroup.tokens[quoteCurrencyIndex].decimals),
                    unsettled: (0, mango_client_1.nativeToUi)(nativeQuoteFree, mangoGroup.tokens[quoteCurrencyIndex].decimals),
                    net: net(nativeQuoteLocked, quoteCurrencyIndex),
                    value: value(nativeQuoteLocked, quoteCurrencyIndex),
                    depositRate: (0, utils_1.i80f48ToPercent)(mangoGroup.getDepositRate(tokenIndex)),
                    borrowRate: (0, utils_1.i80f48ToPercent)(mangoGroup.getBorrowRate(tokenIndex)),
                },
            ];
            balances.push(marketPair);
        }
        const baseBalances = balances.map((b) => b[0]);
        const quoteBalances = balances.map((b) => b[1]);
        const quoteMeta = quoteBalances[0];
        const quoteInOrders = (0, lodash_1.sumBy)(quoteBalances, "orders");
        const unsettled = (0, lodash_1.sumBy)(quoteBalances, "unsettled");
        const net = quoteMeta.deposits
            .add(mango_client_1.I80F48.fromNumber(unsettled))
            .sub(quoteMeta.borrows)
            .add(mango_client_1.I80F48.fromNumber(quoteInOrders));
        const token = (0, mango_client_1.getTokenBySymbol)(mangoGroupConfig, quoteMeta.symbol);
        const tokenIndex = mangoGroup.getTokenIndex(token.mintKey);
        const value = net.mul(mangoGroup.getPrice(tokenIndex, mangoCache));
        /* tslint:enable */
        ////// end of copy pasta block from mango-ui-v3
        // append balances for base symbols
        const balanceDtos = baseBalances.map((baseBalance) => {
            return {
                coin: (0, utils_1.patchInternalMarketName)(baseBalance.key),
                free: baseBalance.deposits.toNumber(),
                spotBorrow: baseBalance.borrows.toNumber(),
                total: baseBalance.net.toNumber(),
                usdValue: baseBalance.value.toNumber(),
                availableWithoutBorrow: baseBalance.net
                    .sub(baseBalance.borrows)
                    .toNumber(),
            };
        });
        // append balance for quote symbol
        balanceDtos.push({
            coin: (0, utils_1.patchInternalMarketName)(this.mangoSimpleClient.mangoGroupConfig.quoteSymbol),
            free: quoteMeta.deposits.toNumber(),
            spotBorrow: quoteMeta.borrows.toNumber(),
            total: net.toNumber(),
            usdValue: value.toNumber(),
            availableWithoutBorrow: net.sub(quoteMeta.borrows).toNumber(),
        });
        return balanceDtos;
    }
}
exports.default = WalletController;
//# sourceMappingURL=wallet.controller.js.map