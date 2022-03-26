"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mango_client_1 = require("@blockworks-foundation/mango-client");
const bn_js_1 = __importDefault(require("bn.js"));
const express_1 = require("express");
const utils_1 = require("./utils");
class PositionsController {
    constructor(mangoSimpleClient) {
        this.mangoSimpleClient = mangoSimpleClient;
        this.path = "/api/positions";
        this.router = (0, express_1.Router)();
        this.fetchPerpPositions = async (request, response, next) => {
            this.fetchPerpPositionsInternal()
                .then((postionDtos) => {
                response.send({ success: true, result: postionDtos });
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
        // GET /positions
        this.router.get(this.path, this.fetchPerpPositions);
    }
    async fetchPerpPositionsInternal() {
        const groupConfig = this.mangoSimpleClient.mangoGroupConfig;
        const mangoGroup = this.mangoSimpleClient.mangoGroup;
        // (re)load+fetch things
        const [mangoAccount, mangoCache, allMarkets, mangoAccountPerpFills] = await Promise.all([
            // a new perp account might have been created since the last fetch
            this.mangoSimpleClient.mangoAccount.reload(this.mangoSimpleClient.connection, this.mangoSimpleClient.mangoGroup.dexProgramId),
            // in-order to use the fresh'est price
            this.mangoSimpleClient.mangoGroup.loadCache(this.mangoSimpleClient.connection),
            this.mangoSimpleClient.fetchAllMarkets(),
            this.mangoSimpleClient.fetchAllPerpFills(),
        ]);
        // find perp accounts with non zero positions
        const perpAccounts = mangoAccount
            ? groupConfig.perpMarkets.map((m) => {
                return {
                    perpAccount: mangoAccount.perpAccounts[m.marketIndex],
                    marketIndex: m.marketIndex,
                };
            })
            : [];
        const filteredPerpAccounts = perpAccounts.filter(({ perpAccount }) => !perpAccount.basePosition.eq(new bn_js_1.default(0)));
        // compute perp position details
        const postionDtos = filteredPerpAccounts.map(({ perpAccount, marketIndex }, index) => {
            const perpMarketInfo = this.mangoSimpleClient.mangoGroup.perpMarkets[marketIndex];
            const marketConfig = (0, mango_client_1.getMarketByPublicKey)(groupConfig, perpMarketInfo.perpMarket);
            const perpMarket = allMarkets[perpMarketInfo.perpMarket.toBase58()];
            const perpTradeHistory = mangoAccountPerpFills.filter((t) => t.address === marketConfig.publicKey.toBase58());
            let breakEvenPrice;
            try {
                breakEvenPrice = perpAccount.getBreakEvenPrice(mangoAccount, perpMarket, perpTradeHistory);
            }
            catch (e) {
                breakEvenPrice = null;
            }
            const pnl = breakEvenPrice !== null
                ? perpMarket.baseLotsToNumber(perpAccount.basePosition) *
                    (this.mangoSimpleClient.mangoGroup
                        .getPrice(marketIndex, mangoCache)
                        .toNumber() -
                        parseFloat(breakEvenPrice.toString()))
                : null;
            let entryPrice;
            try {
                entryPrice = perpAccount.getAverageOpenPrice(mangoAccount, perpMarket, perpTradeHistory);
            }
            catch {
                entryPrice = 0;
            }
            return {
                cost: Math.abs(perpMarket.baseLotsToNumber(perpAccount.basePosition) *
                    mangoGroup.getPrice(marketIndex, mangoCache).toNumber()),
                cumulativeBuySize: undefined,
                cumulativeSellSize: undefined,
                entryPrice,
                estimatedLiquidationPrice: undefined,
                future: (0, utils_1.patchInternalMarketName)(marketConfig.name),
                initialMarginRequirement: undefined,
                longOrderSize: undefined,
                maintenanceMarginRequirement: undefined,
                netSize: perpMarket.baseLotsToNumber(perpAccount.basePosition),
                openSize: undefined,
                realizedPnl: undefined,
                recentAverageOpenPrice: undefined,
                recentBreakEvenPrice: breakEvenPrice != null ? breakEvenPrice.toNumber() : null,
                recentPnl: undefined,
                shortOrderSize: undefined,
                side: perpAccount.basePosition.gt(mango_client_1.ZERO_BN) ? "long" : "short",
                size: Math.abs(perpMarket.baseLotsToNumber(perpAccount.basePosition)),
                unrealizedPnl: pnl,
                collateralUsed: undefined,
            };
        });
        return postionDtos;
    }
}
exports.default = PositionsController;
//# sourceMappingURL=positionsController.js.map