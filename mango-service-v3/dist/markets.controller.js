"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mango_client_1 = require("@blockworks-foundation/mango-client");
const serum_1 = require("@project-serum/serum");
const big_js_1 = __importDefault(require("big.js"));
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const node_fetch_1 = __importDefault(require("node-fetch"));
const utils_1 = require("./utils");
class MarketsController {
    constructor(mangoSimpleClient) {
        this.mangoSimpleClient = mangoSimpleClient;
        this.path = "/api/markets";
        this.router = (0, express_1.Router)();
        this.fetchMarkets = async (request, response, next) => {
            this.fetchMarketsInternal()
                .then((marketsDto) => {
                response.send({
                    success: true,
                    result: marketsDto,
                });
            })
                .catch((error) => {
                utils_1.logger.error(`message - ${error.message}, ${error.stack}`);
                return response.status(500).send({
                    errors: [{ msg: error.message }],
                });
            });
        };
        this.fetchMarket = async (request, response, next) => {
            const errors = (0, express_validator_1.validationResult)(request);
            if (!errors.isEmpty()) {
                return response
                    .status(400)
                    .json({ errors: errors.array() });
            }
            const marketName = (0, utils_1.patchExternalMarketName)(request.params.market_name);
            this.fetchMarketsInternal(marketName)
                .then((marketsDto) => {
                response.send({
                    success: true,
                    result: marketsDto,
                });
            })
                .catch((error) => {
                utils_1.logger.error(`message - ${error.message}, ${error.stack}`);
                return response.status(500).send({
                    errors: [{ msg: error.message }],
                });
            });
        };
        this.getOrderBook = async (request, response, next) => {
            const errors = (0, express_validator_1.validationResult)(request);
            if (!errors.isEmpty()) {
                return response
                    .status(400)
                    .json({ errors: errors.array() });
            }
            const marketName = (0, utils_1.patchExternalMarketName)(request.params.market_name);
            const depth = Number(request.query.depth) || 20;
            this.getOrderBookInternal(marketName, depth)
                .then(({ asks, bids }) => {
                return response.send({
                    success: true,
                    result: {
                        asks: asks,
                        bids: bids,
                    },
                });
            })
                .catch((error) => {
                utils_1.logger.error(`message - ${error.message}, ${error.stack}`);
                return response.status(500).send({
                    errors: [{ msg: error.message }],
                });
            });
        };
        this.getTrades = async (request, response, next) => {
            const errors = (0, express_validator_1.validationResult)(request);
            if (!errors.isEmpty()) {
                return response
                    .status(400)
                    .json({ errors: errors.array() });
            }
            const allMarketConfigs = (0, mango_client_1.getAllMarkets)(this.mangoSimpleClient.mangoGroupConfig);
            const marketName = (0, utils_1.patchExternalMarketName)(request.params.market_name);
            const marketPk = allMarketConfigs.filter((marketConfig) => marketConfig.name === marketName)[0].publicKey;
            this.getTradesInternal(marketPk)
                .then((tradeDtos) => {
                return response.send({
                    success: true,
                    result: tradeDtos,
                });
            })
                .catch((error) => {
                utils_1.logger.error(`message - ${error.message}, ${error.stack}`);
                return response.status(500).send({
                    errors: [{ msg: error.message }],
                });
            });
        };
        this.getCandles = async (request, response, next) => {
            const errors = (0, express_validator_1.validationResult)(request);
            if (!errors.isEmpty()) {
                return response
                    .status(400)
                    .json({ errors: errors.array() });
            }
            const marketName = (0, utils_1.patchExternalMarketName)(request.params.market_name);
            const resolution = String(request.query.resolution);
            const fromEpochS = Number(request.query.start_time);
            const toEpochS = Number(request.query.end_time);
            await getOhlcv(marketName, resolution, fromEpochS, toEpochS, false)
                .then(({ t, o, h, l, c, v }) => {
                const ohlcvDtos = [];
                for (let i = 0; i < t.length; i++) {
                    ohlcvDtos.push({
                        time: t[i],
                        open: o[i],
                        high: h[i],
                        low: l[i],
                        close: c[i],
                        volume: v[i],
                    });
                }
                return response.send({
                    success: true,
                    result: ohlcvDtos,
                });
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
        // GET /markets
        this.router.get(this.path, this.fetchMarkets);
        // GET /markets/{market_name}
        this.router.get(`${this.path}/:market_name`, (0, express_validator_1.param)("market_name").custom(utils_1.isValidMarket), this.fetchMarket);
        // GET /markets/{market_name}/orderbook?depth={depth}
        this.router.get(`${this.path}/:market_name/orderbook`, (0, express_validator_1.param)("market_name").custom(utils_1.isValidMarket), (0, express_validator_1.query)("depth", "Depth should be a number between 20 and 100!")
            .optional()
            .isInt({ max: 100, min: 20 }), this.getOrderBook);
        // GET /markets/{market_name}/trades
        this.router.get(`${this.path}/:market_name/trades`, (0, express_validator_1.param)("market_name").custom(utils_1.isValidMarket), this.getTrades);
        // GET /markets/{market_name}/candles?resolution={resolution}&start_time={start_time}&end_time={end_time}
        this.router.get(`${this.path}/:market_name/candles`, (0, express_validator_1.param)("market_name").custom(utils_1.isValidMarket), this.getCandles);
    }
    async fetchMarketsInternal(marketName) {
        let allMarketConfigs = (0, mango_client_1.getAllMarkets)(this.mangoSimpleClient.mangoGroupConfig);
        if (marketName !== undefined) {
            allMarketConfigs = allMarketConfigs.filter((marketConfig) => marketConfig.name === marketName);
        }
        const allMarkets = await this.mangoSimpleClient.fetchAllMarkets(marketName);
        return Promise.all(allMarketConfigs.map((marketConfig) => this.computeMarketLatestDetails(marketConfig, allMarkets)));
    }
    async computeMarketLatestDetails(marketConfig, allMarkets) {
        const market = allMarkets[marketConfig.publicKey.toBase58()];
        const [marketData, // contains volume, 1H, 24H, bod changes
        ordersInfo, // used for latest bid+ask
        tradesResponse, // used for latest trade+price
        ] = await Promise.all([
            getMarketData(marketConfig),
            (await this.mangoSimpleClient.fetchAllBidsAndAsks(false, marketConfig.name)),
            (0, node_fetch_1.default)(`https://event-history-api-candles.herokuapp.com/trades/address/${marketConfig.publicKey.toBase58()}`),
        ]);
        // latest bid+ask
        const bids = ordersInfo
            .flat()
            .filter((orderInfo) => orderInfo.order.side === "buy")
            .sort((b1, b2) => b2.order.price - b1.order.price);
        const asks = ordersInfo
            .flat()
            .filter((orderInfo) => orderInfo.order.side === "sell")
            .sort((a1, a2) => a1.order.price - a2.order.price);
        // latest trade+price
        const parsedTradesResponse = (await tradesResponse.json());
        const lastPrice = "s" in parsedTradesResponse && parsedTradesResponse["s"] === "error"
            ? null
            : parsedTradesResponse["data"][0]["price"];
        // size increments
        let minOrderSize;
        if (market instanceof serum_1.Market && market.minOrderSize) {
            minOrderSize = market.minOrderSize;
        }
        else if (market instanceof mango_client_1.PerpMarket) {
            const baseDecimals = market.baseDecimals;
            minOrderSize = new big_js_1.default(market.baseLotSize.toString())
                .div(new big_js_1.default(10).pow(baseDecimals))
                .toNumber();
        }
        // price increment
        let tickSize = 1;
        if (market instanceof serum_1.Market) {
            tickSize = market.tickSize;
        }
        else if (market instanceof mango_client_1.PerpMarket) {
            const baseDecimals = market.baseDecimals;
            const quoteDecimals = (0, mango_client_1.getTokenBySymbol)(this.mangoSimpleClient.mangoGroupConfig, this.mangoSimpleClient.mangoGroupConfig.quoteSymbol).decimals;
            const nativeToUi = new big_js_1.default(10).pow(baseDecimals - quoteDecimals);
            const lotsToNative = new big_js_1.default(market.quoteLotSize.toString()).div(new big_js_1.default(market.baseLotSize.toString()));
            tickSize = lotsToNative.mul(nativeToUi).toNumber();
        }
        return {
            name: (0, utils_1.patchInternalMarketName)(marketConfig.name),
            baseCurrency: marketConfig.baseSymbol,
            quoteCurrency: "USDC",
            // note: event-history-api doesn't index volume for spot
            quoteVolume24h: marketData.quoteVolume24h !== 0 ? marketData.quoteVolume24h : undefined,
            change1h: marketData.change1h,
            change24h: marketData.change24h,
            changeBod: marketData.changeBod,
            highLeverageFeeExempt: undefined,
            minProvideSize: undefined,
            type: marketConfig.name.includes("PERP") ? "futures" : "spot",
            underlying: marketConfig.baseSymbol,
            enabled: undefined,
            ask: asks.length > 0 ? asks[0].order.price : null,
            bid: bids.length > 0 ? bids[0].order.price : null,
            last: lastPrice,
            postOnly: undefined,
            price: lastPrice,
            priceIncrement: tickSize,
            sizeIncrement: minOrderSize,
            restricted: undefined,
            // note: event-history-api doesn't index volume for spot
            volumeUsd24h: marketData.volumeUsd24h !== 0 ? marketData.volumeUsd24h : undefined,
        };
    }
    async getOrderBookInternal(marketName, depth) {
        const ordersInfo = await this.mangoSimpleClient.fetchAllBidsAndAsks(false, marketName);
        const bids_ = ordersInfo
            .flat()
            .filter((orderInfo) => orderInfo.order.side === "buy")
            .sort((b1, b2) => b2.order.price - b1.order.price);
        const asks_ = ordersInfo
            .flat()
            .filter((orderInfo) => orderInfo.order.side === "sell")
            .sort((a1, a2) => a1.order.price - a2.order.price);
        const asks = asks_
            .slice(0, depth)
            .map((ask) => [ask.order.price, ask.order.size]);
        const bids = bids_
            .slice(0, depth)
            .map((bid) => [bid.order.price, bid.order.size]);
        return { asks, bids };
    }
    async getTradesInternal(marketPk) {
        const tradesResponse = await (0, node_fetch_1.default)(`https://event-history-api-candles.herokuapp.com/trades/address/${marketPk.toBase58()}`);
        const parsedTradesResponse = (await tradesResponse.json());
        if ("s" in parsedTradesResponse && parsedTradesResponse["s"] === "error") {
            return [];
        }
        return parsedTradesResponse["data"].map((trade) => {
            return {
                id: trade["orderId"],
                liquidation: undefined,
                price: trade["price"],
                side: trade["side"],
                size: trade["size"],
                time: new Date(trade["time"]),
            };
        });
    }
}
exports.default = MarketsController;
/// helper functions
async function getMarketData(marketConfig) {
    const marketDataResponse = await (0, node_fetch_1.default)(`https://event-history-api-candles.herokuapp.com/markets/` +
        `${(0, utils_1.patchInternalMarketName)(marketConfig.name)}`);
    return marketDataResponse.json();
}
async function getOhlcv(market, resolution, fromS, toS, forceMinimumMinuteResolution = true) {
    // to leverage caching on backend,
    // and not spam with requests having ms resolution,
    // force minimum resolution to a minute
    if (forceMinimumMinuteResolution) {
        fromS = Math.floor(fromS / 60) * 60;
        toS = Math.floor(toS / 60) * 60;
    }
    const fromSFixed = fromS.toFixed();
    const toSFixed = toS.toFixed();
    const historyResponse = await (0, node_fetch_1.default)(`https://event-history-api-candles.herokuapp.com/tv/history` +
        `?symbol=${market}&resolution=${resolution}&from=${fromSFixed}&to=${toSFixed}`);
    return historyResponse.json();
}
//# sourceMappingURL=markets.controller.js.map