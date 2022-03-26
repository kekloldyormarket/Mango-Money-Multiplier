"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const express_1 = require("express");
const utils_1 = require("./utils");
const mango_client_1 = require("@blockworks-foundation/mango-client");
/**
 * Houses every non-ftx style, mango specific information
 */
class AccountController {
    constructor(mangoSimpleClient) {
        this.mangoSimpleClient = mangoSimpleClient;
        this.path = "/api/mango";
        this.router = (0, express_1.Router)();
        this.fetchMangoAccount = async (request, response, next) => {
            const accountInternalDto = await this.fetchAccountInternal();
            response.send({
                success: true,
                result: accountInternalDto,
            });
        };
        this.initializeRoutes();
    }
    initializeRoutes() {
        // GET /account
        this.router.get(`${this.path}/account`, this.fetchMangoAccount);
    }
    async fetchAccountInternal() {
        let allMarketConfigs = (0, mango_client_1.getAllMarkets)(this.mangoSimpleClient.mangoGroupConfig);
        const marketMarginAvailableListDtos = await this.getMarketMarginAvailable(allMarketConfigs);
        const spotOpenOrdersAccountDtos = this.getSpotOpenOrdersAccount(allMarketConfigs);
        return {
            spotOpenOrdersAccounts: spotOpenOrdersAccountDtos,
            marketMarginAvailable: marketMarginAvailableListDtos,
        };
    }
    async getMarketMarginAvailable(allMarketConfigs) {
        const mangoCache = await this.mangoSimpleClient.mangoGroup.loadCache(this.mangoSimpleClient.connection);
        const marketMarginAvailableDtos = [];
        for (let marketConfig of allMarketConfigs) {
            marketMarginAvailableDtos.push({
                name: (0, utils_1.patchInternalMarketName)(marketConfig.name),
                marginAvailable: (0, mango_client_1.nativeI80F48ToUi)(this.mangoSimpleClient.mangoAccount.getMarketMarginAvailable(this.mangoSimpleClient.mangoGroup, mangoCache, marketConfig.marketIndex, marketConfig.kind), this.mangoSimpleClient.mangoGroup.tokens[mango_client_1.QUOTE_INDEX].decimals).toNumber(),
            });
        }
        return marketMarginAvailableDtos;
    }
    getSpotOpenOrdersAccount(allMarketConfigs) {
        const spotOpenOrdersAccountDtos = allMarketConfigs
            .filter((marketConfig) => !marketConfig.name.includes("PERP"))
            .map((spotMarketConfig) => this.getSpotOpenOrdersAccountForMarket(spotMarketConfig))
            // filter markets where a spotOpenOrdersAccount exists
            .filter((spotOpenOrdersAccount) => spotOpenOrdersAccount.publicKey != null);
        return spotOpenOrdersAccountDtos;
    }
    getSpotOpenOrdersAccountForMarket(marketConfig) {
        const spotOpenOrdersAccount = this.mangoSimpleClient.getSpotOpenOrdersAccount(marketConfig);
        return {
            name: (0, utils_1.patchInternalMarketName)(marketConfig.name),
            publicKey: spotOpenOrdersAccount
                ? spotOpenOrdersAccount.toBase58()
                : null,
        };
    }
}
exports.AccountController = AccountController;
//# sourceMappingURL=account.controller.js.map