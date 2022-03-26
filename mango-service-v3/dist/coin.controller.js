"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
class CoinController {
    constructor(mangoSimpleClient) {
        this.mangoSimpleClient = mangoSimpleClient;
        this.path = "/api/coins";
        this.router = (0, express_1.Router)();
        this.getCoins = async (request, response, next) => {
            const coinDtos = this.mangoSimpleClient.mangoGroupConfig.tokens.map((tokenConfig) => {
                return {
                    name: tokenConfig.symbol,
                    id: tokenConfig.symbol,
                };
            });
            response.send({ success: true, result: coinDtos });
        };
        this.initializeRoutes();
    }
    initializeRoutes() {
        // GET /coins
        this.router.get(this.path, this.getCoins);
    }
}
exports.default = CoinController;
//# sourceMappingURL=coin.controller.js.map