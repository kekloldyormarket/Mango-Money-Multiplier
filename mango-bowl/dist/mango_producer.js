"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangoProducer = void 0;
const mango_client_1 = require("@blockworks-foundation/mango-client");
const web3_js_1 = require("@solana/web3.js");
const worker_threads_1 = require("worker_threads");
const data_mapper_1 = require("./data_mapper");
const helpers_1 = require("./helpers");
const logger_1 = require("./logger");
const rpc_client_1 = require("./rpc_client");
if (worker_threads_1.isMainThread) {
    const message = 'Exiting. Worker is not meant to run in main thread';
    logger_1.logger.log('error', message);
    throw new Error(message);
}
process.on('unhandledRejection', (err) => {
    throw err;
});
// MangoProducer responsibility is to:
// - connect to Solana Node RPC API via WS and subscribe to single Mango perp market
// - map received data to normalized data messages and broadcast those
class MangoProducer {
    _options;
    constructor(_options) {
        this._options = _options;
    }
    async run(onData) {
        let started = false;
        logger_1.logger.log('info', `Mango producer starting for ${this._options.market.name} market...`);
        // don't use Solana web3.js Connection but custom rpcClient so we have more control and insight what is going on
        const rpcClient = new rpc_client_1.RPCClient({
            nodeEndpoint: this._options.nodeEndpoint,
            commitment: this._options.commitment,
            wsEndpointPort: this._options.wsEndpointPort
        });
        const mangoClient = new mango_client_1.MangoClient(rpcClient, new web3_js_1.PublicKey(this._options.market.programId));
        const mangoGroup = await mangoClient.getMangoGroup(new web3_js_1.PublicKey(this._options.market.groupPublicKey));
        const market = await mangoGroup.loadPerpMarket(rpcClient, this._options.market.marketIndex, this._options.market.baseDecimals, this._options.market.quoteDecimals);
        const priceDecimalPlaces = (0, helpers_1.decimalPlaces)(market.tickSize);
        const sizeDecimalPlaces = (0, helpers_1.decimalPlaces)(market.minOrderSize);
        const dataMapper = new data_mapper_1.DataMapper({
            symbol: this._options.market.name,
            market,
            priceDecimalPlaces,
            sizeDecimalPlaces
        });
        let start = process.hrtime();
        const interval = 600;
        // based on https://github.com/tj/node-blocked/blob/master/index.js
        setInterval(() => {
            const delta = process.hrtime(start);
            const nanosec = delta[0] * 1e9 + delta[1];
            const ms = nanosec / 1e6;
            const n = ms - interval;
            if (n > 200) {
                logger_1.logger.log('info', `Event loop blocked for ${Math.round(n)} ms.`, {
                    market: this._options.market.name
                });
            }
            start = process.hrtime();
        }, interval).unref();
        for await (const notification of rpcClient.streamAccountsNotification(market, this._options.market.name)) {
            if (started === false) {
                logger_1.logger.log('info', `Mango producer started for ${this._options.market.name} market...`);
                started = true;
                helpers_1.mangoProducerReadyChannel.postMessage('ready');
            }
            const messagesForSlot = [...dataMapper.map(notification)];
            if (messagesForSlot.length > 0) {
                onData(messagesForSlot);
            }
        }
    }
}
exports.MangoProducer = MangoProducer;
const mangoProducer = new MangoProducer(worker_threads_1.workerData);
mangoProducer.run((envelopes) => {
    helpers_1.mangoDataChannel.postMessage(envelopes);
});
//# sourceMappingURL=mango_producer.js.map