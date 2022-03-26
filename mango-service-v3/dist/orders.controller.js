"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const utils_1 = require("./utils");
class OrdersController {
    constructor(mangoSimpleClient) {
        this.mangoSimpleClient = mangoSimpleClient;
        this.path = "/api/orders";
        this.router = (0, express_1.Router)();
        this.getOpenOrders = async (request, response, next) => {
            const errors = (0, express_validator_1.validationResult)(request);
            if (!errors.isEmpty()) {
                return response
                    .status(400)
                    .json({ errors: errors.array() });
            }
            const marketName = request.query.market
                ? (0, utils_1.patchExternalMarketName)(String(request.query.market))
                : undefined;
            this.getOpenOrdersInternal(marketName)
                .then((orderDtos) => {
                return response.send({ success: true, result: orderDtos });
            })
                .catch((error) => {
                utils_1.logger.error(`message - ${error.message}, ${error.stack}`);
                return response.status(500).send({
                    errors: [{ msg: error.message }],
                });
            });
        };
        this.placeOrder = async (request, response, next) => {
            const errors = (0, express_validator_1.validationResult)(request);
            if (!errors.isEmpty()) {
                return response
                    .status(400)
                    .json({ errors: errors.array() });
            }
            const placeOrderDto = request.body;
            if (placeOrderDto.type !== "market" && placeOrderDto.price === undefined) {
                utils_1.logger.error("here");
                return response.status(400).send({
                    errors: [{ msg: "missing price" }],
                });
            }
            utils_1.logger.info(`placing order`);
            this.mangoSimpleClient
                .placeOrder((0, utils_1.patchExternalMarketName)(placeOrderDto.market), placeOrderDto.side, placeOrderDto.size, placeOrderDto.price, 
            // preference - market, then ioc, then postOnly, otherwise default i.e. limit
            placeOrderDto.type == "market"
                ? "market"
                : placeOrderDto.ioc
                    ? "ioc"
                    : placeOrderDto.postOnly
                        ? "postOnly"
                        : "limit", placeOrderDto.clientId)
                .then((transactionSignature) => {
                return response.send({
                    success: true,
                    result: { tx: transactionSignature },
                });
            })
                .catch((error) => {
                utils_1.logger.error(`message - ${error.message}, ${error.stack}`);
                return response.status(500).send({
                    errors: [{ msg: error.message }],
                });
            });
        };
        this.cancelAllOrders = async (request, response, next) => {
            utils_1.logger.info(`cancelling all orders...`);
            this.mangoSimpleClient
                .cancelAllOrders()
                .then(() => {
                return response.status(200).send();
            })
                .catch((error) => {
                utils_1.logger.error(`message - ${error.message}, ${error.stack}`);
                return response.status(500).send({
                    errors: [{ msg: error.message }],
                });
            });
        };
        this.cancelOrderByOrderId = async (request, response, next) => {
            const orderId = request.params.order_id;
            utils_1.logger.info(`cancelling order with orderId ${orderId}...`);
            this.mangoSimpleClient
                .getOrderByOrderId(orderId)
                .then((orderInfos) => {
                if (!orderInfos.length) {
                    return response
                        .status(400)
                        .json({ errors: [{ msg: "Order not found!" }] });
                }
                this.mangoSimpleClient
                    .cancelOrder(orderInfos[0])
                    .then((transactionSignature) => response.send({
                    success: true,
                    result: { tx: transactionSignature },
                }))
                    .catch((error) => {
                    utils_1.logger.error(`message - ${error.message}, ${error.stack}`);
                    return response
                        .status(500)
                        .json({ errors: [{ msg: error.message }] });
                });
            })
                .catch((error) => {
                utils_1.logger.error(`message - ${error.message}, ${error.stack}`);
                return response.status(500).json({ errors: [{ msg: error.message }] });
            });
        };
        this.cancelOrderByClientId = async (request, response, next) => {
            const clientId = request.params.client_id;
            utils_1.logger.info(`cancelling order with clientId ${clientId}...`);
            this.mangoSimpleClient
                .getOrderByClientId(clientId)
                .then((orderInfos) => {
                if (!orderInfos.length) {
                    return response
                        .status(400)
                        .json({ errors: [{ msg: "Order not found!" }] });
                }
                this.mangoSimpleClient
                    .cancelOrder(orderInfos[0])
                    .then((transactionSignature) => response.send({
                    success: true,
                    result: { tx: transactionSignature },
                }))
                    .catch((error) => {
                    utils_1.logger.error(`message - ${error.message}, ${error.stack}`);
                    return response
                        .status(500)
                        .json({ errors: [{ msg: error.message }] });
                });
            })
                .catch((error) => {
                utils_1.logger.error(`message - ${error.message}, ${error.stack}`);
                return response.status(500).json({ errors: [{ msg: error.message }] });
            });
        };
        this.initializeRoutes();
    }
    initializeRoutes() {
        // GET /orders?market={market_name}
        this.router.get(this.path, (0, express_validator_1.query)("market").custom(utils_1.isValidMarket).optional(), this.getOpenOrders);
        // POST /orders
        this.router.post(this.path, (0, express_validator_1.body)("market").not().isEmpty().custom(utils_1.isValidMarket), (0, express_validator_1.body)("side").not().isEmpty().isIn(["sell", "buy"]), (0, express_validator_1.body)("type").not().isEmpty().isIn(["limit", "market"]), (0, express_validator_1.body)("size").not().isEmpty().isNumeric(), (0, express_validator_1.body)("reduceOnly").isBoolean(), (0, express_validator_1.body)("ioc").isBoolean(), (0, express_validator_1.body)("postOnly").isBoolean(), (0, express_validator_1.body)("clientId").isNumeric(), this.placeOrder);
        // // POST /orders/{order_id}/modify todo
        // this.router.post(this.path, this.modifyOrder);
        // DELETE /orders
        this.router.delete(this.path, this.cancelAllOrders);
        // DELETE /orders/{order_id}
        this.router.delete(`${this.path}/:order_id`, this.cancelOrderByOrderId);
        // DELETE /orders/by_client_id/{client_id}
        this.router.delete(`${this.path}/by_client_id/:client_id`, this.cancelOrderByClientId);
    }
    async getOpenOrdersInternal(marketName) {
        const openOrders = await this.mangoSimpleClient.fetchAllBidsAndAsks(true, marketName);
        const orderDtos = openOrders.flat().map((orderInfo) => {
            if ("bestInitial" in orderInfo.order) {
                const perpOrder = orderInfo.order;
                return {
                    createdAt: new Date(perpOrder.timestamp.toNumber() * 1000),
                    filledSize: undefined,
                    future: (0, utils_1.patchInternalMarketName)(orderInfo.market.config.name),
                    id: perpOrder.orderId.toString(),
                    market: (0, utils_1.patchInternalMarketName)(orderInfo.market.config.name),
                    price: perpOrder.price,
                    avgFillPrice: undefined,
                    remainingSize: undefined,
                    side: perpOrder.side,
                    size: perpOrder.size,
                    status: "open",
                    type: "limit",
                    reduceOnly: undefined,
                    ioc: undefined,
                    postOnly: undefined,
                    clientId: perpOrder.clientId && perpOrder.clientId.toString() !== "0"
                        ? perpOrder.clientId.toString()
                        : undefined,
                };
            }
            const spotOrder = orderInfo.order;
            return {
                createdAt: undefined,
                filledSize: undefined,
                future: (0, utils_1.patchInternalMarketName)(orderInfo.market.config.name),
                id: spotOrder.orderId.toString(),
                market: (0, utils_1.patchInternalMarketName)(orderInfo.market.config.name),
                price: spotOrder.price,
                avgFillPrice: undefined,
                remainingSize: undefined,
                side: spotOrder.side,
                size: spotOrder.size,
                status: "open",
                type: undefined,
                reduceOnly: undefined,
                ioc: undefined,
                postOnly: undefined,
                clientId: spotOrder.clientId && spotOrder.clientId.toString() !== "0"
                    ? spotOrder.clientId.toString()
                    : undefined,
            };
        });
        return orderDtos;
    }
}
exports.default = OrdersController;
//# sourceMappingURL=orders.controller.js.map