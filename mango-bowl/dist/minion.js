"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mango_client_1 = require("@blockworks-foundation/mango-client");
const web3_js_1 = require("@solana/web3.js");
const uWebSockets_js_1 = require("uWebSockets.js");
const worker_threads_1 = require("worker_threads");
const consts_1 = require("./consts");
const helpers_1 = require("./helpers");
const logger_1 = require("./logger");
const meta = {
    minionId: worker_threads_1.threadId
};
if (worker_threads_1.isMainThread) {
    const message = 'Exiting. Worker is not meant to run in main thread';
    logger_1.logger.log('error', message, meta);
    throw new Error(message);
}
process.on('unhandledRejection', (err) => {
    throw err;
});
// based on https://github.com/uNetworking/uWebSockets.js/issues/335#issuecomment-643500581
const RateLimit = (limit, interval) => {
    let now = 0;
    const last = Symbol(), count = Symbol();
    setInterval(() => ++now, interval);
    return (ws) => {
        if (ws[last] != now) {
            ws[last] = now;
            ws[count] = 1;
            return false;
        }
        else {
            return ++ws[count] > limit;
        }
    };
};
// Minion is the actual HTTP and WS server implementation
// it is meant to run in Node.js worker_thread and handles:
// - HTTP requests
// - WS subscriptions requests
// - WS data publishing to connected clients
class Minion {
    _nodeEndpoint;
    _markets;
    _server;
    _apiVersion = '1';
    MAX_MESSAGES_PER_SECOND = 50;
    // 100 messages per second limit
    _wsMessagesRateLimit = RateLimit(this.MAX_MESSAGES_PER_SECOND, 1000);
    _l2SnapshotsSerialized = {};
    _l3SnapshotsSerialized = {};
    _recentTradesSerialized = {};
    _quotesSerialized = {};
    _marketNames;
    _listenSocket = undefined;
    _openConnectionsCount = 0;
    _tid = undefined;
    MAX_BACKPRESSURE = 1024 * 1024;
    constructor(_nodeEndpoint, _markets) {
        this._nodeEndpoint = _nodeEndpoint;
        this._markets = _markets;
        this._marketNames = _markets.map((m) => m.name);
        this._server = this._initServer();
        this._tid = setInterval(() => {
            logger_1.logger.log('debug', `Open WS client connections count: ${this._openConnectionsCount}`, meta);
        }, 60 * 1000);
    }
    _initServer() {
        const apiPrefix = `/v${this._apiVersion}`;
        const useSSL = process.env.KEY_FILE_NAME !== undefined;
        const WsApp = useSSL ? uWebSockets_js_1.SSLApp : uWebSockets_js_1.App;
        const options = useSSL
            ? {
                key_file_name: process.env.KEY_FILE_NAME,
                cert_file_name: process.env.CERT_FILE_NAME
            }
            : {};
        return WsApp(options)
            .ws(`${apiPrefix}/ws`, {
            compression: uWebSockets_js_1.DISABLED,
            maxPayloadLength: 256 * 1024,
            idleTimeout: 60,
            maxBackpressure: this.MAX_BACKPRESSURE,
            closeOnBackpressureLimit: true,
            message: (ws, message) => {
                this._handleSubscriptionRequest(ws, message);
            },
            open: () => {
                this._openConnectionsCount++;
            },
            close: () => {
                this._openConnectionsCount--;
            }
        })
            .get(`${apiPrefix}/markets`, this._listMarkets);
    }
    async start(port) {
        return new Promise((resolve, reject) => {
            this._server.listen(port, (socket) => {
                if (socket) {
                    this._listenSocket = socket;
                    logger_1.logger.log('info', `Listening on port ${port}`, meta);
                    resolve();
                }
                else {
                    const message = `Failed to listen on port ${port}`;
                    logger_1.logger.log('error', message, meta);
                    reject(new Error(message));
                }
            });
        });
    }
    async stop() {
        if (this._listenSocket !== undefined) {
            (0, uWebSockets_js_1.us_listen_socket_close)(this._listenSocket);
        }
        if (this._tid !== undefined) {
            clearInterval(this._tid);
        }
    }
    _cachedListMarketsResponse = undefined;
    //async based on https://github.com/uNetworking/uWebSockets.js/blob/master/examples/AsyncFunction.js
    _listMarkets = async (res) => {
        res.onAborted(() => {
            res.aborted = true;
        });
        if (this._cachedListMarketsResponse === undefined) {
            const markets = await Promise.all(this._markets.map((market) => {
                return (0, helpers_1.executeAndRetry)(async () => {
                    const connection = new web3_js_1.Connection(this._nodeEndpoint);
                    const mangoClient = new mango_client_1.MangoClient(connection, new web3_js_1.PublicKey(market.programId));
                    const mangoGroup = await mangoClient.getMangoGroup(new web3_js_1.PublicKey(market.groupPublicKey));
                    const perpMarket = await mangoGroup.loadPerpMarket(connection, market.marketIndex, market.baseDecimals, market.quoteDecimals);
                    const info = mangoGroup.perpMarkets[market.marketIndex];
                    const [baseCurrency] = market.name.split('-');
                    const marketInfo = {
                        name: market.name,
                        baseCurrency: baseCurrency,
                        quoteCurrency: 'USDC',
                        version: perpMarket.metaData.version,
                        address: market.address,
                        programId: market.programId,
                        tickSize: perpMarket.tickSize,
                        minOrderSize: perpMarket.minOrderSize,
                        takerFee: info.takerFee.toFixed(5),
                        makerFee: info.makerFee.toFixed(5),
                        liquidationFee: info.liquidationFee.toFixed(5)
                    };
                    return marketInfo;
                }, { maxRetries: 10 });
            }));
            this._cachedListMarketsResponse = JSON.stringify(markets, null, 2);
            helpers_1.mangoMarketsChannel.postMessage(this._cachedListMarketsResponse);
        }
        await (0, helpers_1.wait)(1);
        if (!res.aborted) {
            res.writeStatus('200 OK');
            res.writeHeader('Content-Type', 'application/json');
            res.end(this._cachedListMarketsResponse);
        }
    };
    initMarketsCache(cachedResponse) {
        this._cachedListMarketsResponse = cachedResponse;
        logger_1.logger.log('info', 'Cached markets info response', meta);
    }
    processMessages(messages) {
        for (const message of messages) {
            const topic = `${message.type}-${message.market}`;
            if (logger_1.logger.level === 'debug') {
                const diff = new Date().valueOf() - new Date(message.timestamp).valueOf();
                logger_1.logger.log('debug', `Processing message, topic: ${topic}, receive delay: ${diff}ms`, meta);
            }
            if (message.type === 'l2snapshot') {
                this._l2SnapshotsSerialized[message.market] = message.payload;
            }
            if (message.type === 'l3snapshot') {
                this._l3SnapshotsSerialized[message.market] = message.payload;
            }
            if (message.type === 'quote') {
                this._quotesSerialized[message.market] = message.payload;
            }
            if (message.type === 'recent_trades') {
                this._recentTradesSerialized[message.market] = message.payload;
            }
            if (message.publish) {
                this._server.publish(topic, message.payload);
            }
        }
    }
    async _handleSubscriptionRequest(ws, buffer) {
        try {
            if (this._wsMessagesRateLimit(ws)) {
                const message = `Too many requests, slow down. Current limit: ${this.MAX_MESSAGES_PER_SECOND} messages per second.`;
                logger_1.logger.log('info', message, meta);
                const errorMessage = {
                    type: 'error',
                    message,
                    timestamp: new Date().toISOString()
                };
                await this._send(ws, () => JSON.stringify(errorMessage));
                return;
            }
            const message = Buffer.from(buffer).toString();
            if (message === 'ping' || message === 'PING') {
                return;
            }
            const validationResult = this._validateRequestPayload(message);
            if (validationResult.isValid === false) {
                logger_1.logger.log('debug', `Invalid subscription message received, error: ${validationResult.error}`, {
                    message,
                    ...meta
                });
                const errorMessage = {
                    type: 'error',
                    message: validationResult.error,
                    timestamp: new Date().toISOString()
                };
                await this._send(ws, () => JSON.stringify(errorMessage));
                return;
            }
            const request = validationResult.request;
            // 'unpack' channel to specific message types that will be published for it
            const requestedTypes = consts_1.MESSAGE_TYPES_PER_CHANNEL[request.channel];
            for (const market of request.markets) {
                for (const type of requestedTypes) {
                    const topic = `${type}-${market}`;
                    if (request.op === 'subscribe') {
                        if (ws.isSubscribed(topic)) {
                            continue;
                        }
                        if (type === 'recent_trades') {
                            const recentTrades = this._recentTradesSerialized[market];
                            if (recentTrades !== undefined) {
                                await this._send(ws, () => this._recentTradesSerialized[market]);
                            }
                            else {
                                const emptyRecentTradesMessage = {
                                    type: 'recent_trades',
                                    market,
                                    timestamp: new Date().toISOString(),
                                    trades: []
                                };
                                await this._send(ws, () => JSON.stringify(emptyRecentTradesMessage));
                            }
                        }
                        if (type === 'quote') {
                            await this._send(ws, () => this._quotesSerialized[market]);
                        }
                        if (type == 'l2snapshot') {
                            await this._send(ws, () => this._l2SnapshotsSerialized[market]);
                        }
                        if (type === 'l3snapshot') {
                            await this._send(ws, () => this._l3SnapshotsSerialized[market]);
                        }
                        const succeeded = ws.subscribe(topic);
                        if (!succeeded) {
                            logger_1.logger.log('info', `Subscribe failure`, {
                                topic,
                                bufferedAmount: ws.getBufferedAmount()
                            });
                        }
                    }
                    else {
                        if (ws.isSubscribed(topic)) {
                            ws.unsubscribe(topic);
                        }
                    }
                }
            }
            const confirmationMessage = {
                type: request.op == 'subscribe' ? 'subscribed' : 'unsubscribed',
                channel: request.channel,
                markets: request.markets,
                timestamp: new Date().toISOString()
            };
            await this._send(ws, () => JSON.stringify(confirmationMessage));
            logger_1.logger.log('debug', request.op == 'subscribe' ? 'Subscribe successfully' : 'Unsubscribed successfully', {
                successMessage: confirmationMessage,
                ...meta
            });
        }
        catch (err) {
            const message = 'Subscription request internal error';
            const errorMessage = typeof err === 'string' ? err : `${err.message}, ${err.stack}`;
            logger_1.logger.log('info', `${message}, ${errorMessage}`, meta);
            try {
                ws.end(1011, message);
            }
            catch { }
        }
    }
    async _send(ws, getMessage) {
        let retries = 0;
        while (ws.getBufferedAmount() > 0) {
            await (0, helpers_1.wait)(10);
            retries += 1;
            if (retries > 200) {
                ws.end(1008, 'Too much backpressure');
                return;
            }
        }
        const message = getMessage();
        if (message !== undefined) {
            ws.send(message);
        }
    }
    _validateRequestPayload(message) {
        let payload;
        try {
            payload = JSON.parse(message);
        }
        catch {
            return {
                isValid: false,
                error: `Invalid JSON`
            };
        }
        if (consts_1.OPS.includes(payload.op) === false) {
            return {
                isValid: false,
                error: `Invalid op: '${payload.op}'.${(0, helpers_1.getDidYouMean)(payload.op, consts_1.OPS)} ${(0, helpers_1.getAllowedValuesText)(consts_1.OPS)}`
            };
        }
        if (consts_1.CHANNELS.includes(payload.channel) === false) {
            return {
                isValid: false,
                error: `Invalid channel provided: '${payload.channel}'.${(0, helpers_1.getDidYouMean)(payload.channel, consts_1.CHANNELS)}  ${(0, helpers_1.getAllowedValuesText)(consts_1.CHANNELS)}`
            };
        }
        if (!Array.isArray(payload.markets) || payload.markets.length === 0) {
            return {
                isValid: false,
                error: `Invalid or empty markets array provided.`
            };
        }
        if (payload.markets.length > 100) {
            return {
                isValid: false,
                error: `Too large markets array provided (> 100 items).`
            };
        }
        for (const market of payload.markets) {
            if (this._marketNames.includes(market) === false) {
                return {
                    isValid: false,
                    error: `Invalid market name provided: '${market}'.${(0, helpers_1.getDidYouMean)(market, this._marketNames)} ${(0, helpers_1.getAllowedValuesText)(this._marketNames)}`
                };
            }
        }
        return {
            isValid: true,
            error: undefined,
            request: payload
        };
    }
}
const { port, nodeEndpoint, markets, minionNumber } = worker_threads_1.workerData;
const minion = new Minion(nodeEndpoint, markets);
let lastPublishTimestamp = new Date();
if (minionNumber === 0) {
    setInterval(() => {
        const noDataPublishedForSeconds = (new Date().valueOf() - lastPublishTimestamp.valueOf()) / 1000;
        if (noDataPublishedForSeconds > 30) {
            logger_1.logger.log('info', `No market data published for prolonged time`, {
                lastPublishTimestamp: lastPublishTimestamp.toISOString(),
                noDataPublishedForSeconds
            });
        }
    }, 15 * 1000).unref();
}
minion.start(port).then(() => {
    helpers_1.mangoDataChannel.onmessage = (message) => {
        lastPublishTimestamp = new Date();
        minion.processMessages(message.data);
    };
    helpers_1.mangoMarketsChannel.onmessage = (message) => {
        minion.initMarketsCache(message.data);
    };
    helpers_1.minionReadyChannel.postMessage('ready');
});
helpers_1.cleanupChannel.onmessage = async () => {
    await minion.stop();
};
//# sourceMappingURL=minion.js.map