"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopServer = exports.bootServer = void 0;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const worker_threads_1 = require("worker_threads");
const helpers_1 = require("./helpers");
const logger_1 = require("./logger");
async function bootServer({ port, nodeEndpoint, wsEndpointPort, minionsCount, markets, commitment }) {
    // multi core support is linux only feature which allows multiple threads to bind to the same port
    // see https://github.com/uNetworking/uWebSockets.js/issues/304 and https://lwn.net/Articles/542629/
    const MINIONS_COUNT = os_1.default.platform() === 'linux' ? minionsCount : 1;
    let readyMinionsCount = 0;
    logger_1.logger.log('info', MINIONS_COUNT === 1 ? 'Starting single minion worker...' : `Starting ${MINIONS_COUNT} minion workers...`);
    helpers_1.minionReadyChannel.onmessage = () => readyMinionsCount++;
    // start minions workers and wait until all are ready
    for (let i = 0; i < MINIONS_COUNT; i++) {
        const minionWorker = new worker_threads_1.Worker(path_1.default.resolve(__dirname, 'minion.js'), {
            workerData: { nodeEndpoint, port, markets, minionNumber: i }
        });
        minionWorker.on('error', (err) => {
            logger_1.logger.log('error', `Minion worker ${minionWorker.threadId} error occurred: ${err.message} ${err.stack}`);
            throw err;
        });
        minionWorker.on('exit', (code) => {
            logger_1.logger.log('error', `Minion worker: ${minionWorker.threadId} died with code: ${code}`);
        });
    }
    await new Promise(async (resolve) => {
        while (true) {
            if (readyMinionsCount === MINIONS_COUNT) {
                break;
            }
            await (0, helpers_1.wait)(100);
        }
        resolve();
    });
    logger_1.logger.log('info', `Starting mango producers for ${markets.length} markets, rpc endpoint: ${nodeEndpoint}`);
    let readyProducersCount = 0;
    helpers_1.mangoProducerReadyChannel.onmessage = () => readyProducersCount++;
    for (const market of markets) {
        const mangoProducerWorker = new worker_threads_1.Worker(path_1.default.resolve(__dirname, 'mango_producer.js'), {
            workerData: { market, nodeEndpoint, commitment, wsEndpointPort }
        });
        mangoProducerWorker.on('error', (err) => {
            logger_1.logger.log('error', `Mango producer worker ${mangoProducerWorker.threadId} error occurred: ${err.message} ${err.stack}`);
            throw err;
        });
        mangoProducerWorker.on('exit', (code) => {
            logger_1.logger.log('error', `Mango producer worker: ${mangoProducerWorker.threadId} died with code: ${code}`);
        });
        // just in case to not get hit by Solana RPC node rate limits...
        await (0, helpers_1.wait)(100);
    }
    await new Promise(async (resolve) => {
        while (true) {
            if (readyProducersCount === markets.length) {
                break;
            }
            await (0, helpers_1.wait)(100);
        }
        resolve();
    });
}
exports.bootServer = bootServer;
async function stopServer() {
    helpers_1.cleanupChannel.postMessage('cleanup');
    await (0, helpers_1.wait)(10 * 1000);
}
exports.stopServer = stopServer;
//# sourceMappingURL=boot_server.js.map