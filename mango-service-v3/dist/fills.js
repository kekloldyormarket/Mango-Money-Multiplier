"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FillsController = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const utils_1 = require("./utils");
const node_fetch_1 = __importDefault(require("node-fetch"));
class FillsController {
    constructor(mangoSimpleClient) {
        this.mangoSimpleClient = mangoSimpleClient;
        this.path = "/api/fills";
        this.router = (0, express_1.Router)();
        this.getPerpFills = async (request, response, next) => {
            const errors = (0, express_validator_1.validationResult)(request);
            if (!errors.isEmpty()) {
                return response
                    .status(400)
                    .json({ errors: errors.array() });
            }
            const marketName = request.query.market
                ? (0, utils_1.patchExternalMarketName)(String(request.query.market))
                : undefined;
            const page = request.query.page;
            const allMarkets = await this.mangoSimpleClient.fetchAllMarkets(marketName);
            const market = allMarkets[Object.keys(allMarkets)[0]];
            // note: flip to example while developing
            // let eventHistoryPerpTradesUrl = `https://event-history-api.herokuapp.com/perp_trades/CGp2BQS5vgySstS1LHQh46FmPVNZNv9EcgtaaJo7o1yB`;
            let eventHistoryPerpTradesUrl = `https://event-history-api.herokuapp.com/perp_trades/${this.mangoSimpleClient.mangoAccount.publicKey.toBase58()}`;
            if (page) {
                eventHistoryPerpTradesUrl = eventHistoryPerpTradesUrl + `?page=${page}`;
            }
            (0, node_fetch_1.default)(eventHistoryPerpTradesUrl)
                .then(async (tradesResponse) => {
                const parsedTradesResponse = (await tradesResponse.json());
                const tradesAcrossAllPerpMarkets = parsedTradesResponse["data"];
                const tradesForMarket = tradesAcrossAllPerpMarkets.filter((trade) => trade.address === market.publicKey.toBase58());
                return response.send({ success: true, result: tradesForMarket });
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
        // GET /fills?market={market_name}
        this.router.get(this.path, (0, express_validator_1.query)("market").custom(utils_1.isValidPerpMarket).optional(), (0, express_validator_1.query)("page").isNumeric().optional(), this.getPerpFills);
    }
}
exports.FillsController = FillsController;
//# sourceMappingURL=fills.js.map