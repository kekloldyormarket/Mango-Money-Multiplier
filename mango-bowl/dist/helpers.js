"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPerpMarkets = exports.executeAndRetry = exports.cleanupChannel = exports.mangoMarketsChannel = exports.mangoDataChannel = exports.mangoProducerReadyChannel = exports.minionReadyChannel = exports.CircularBuffer = exports.decimalPlaces = exports.batch = exports.getAllowedValuesText = exports.getDidYouMean = exports.wait = void 0;
const mango_client_1 = require("@blockworks-foundation/mango-client");
const didyoumean2_1 = __importDefault(require("didyoumean2"));
const wait = (delayMS) => new Promise((resolve) => setTimeout(resolve, delayMS));
exports.wait = wait;
function getDidYouMean(input, allowedValues) {
    let tip = '';
    if (typeof input === 'string') {
        let result = (0, didyoumean2_1.default)(input, allowedValues, {});
        if (result !== null) {
            tip = ` Did you mean '${result}'?`;
        }
    }
    return tip;
}
exports.getDidYouMean = getDidYouMean;
function getAllowedValuesText(allowedValues) {
    return `Allowed values: ${allowedValues.map((val) => `'${val}'`).join(', ')}.`;
}
exports.getAllowedValuesText = getAllowedValuesText;
function* batch(items, batchSize) {
    for (let i = 0; i < items.length; i += batchSize) {
        yield items.slice(i, i + batchSize);
    }
}
exports.batch = batch;
// https://stackoverflow.com/questions/9539513/is-there-a-reliable-way-in-javascript-to-obtain-the-number-of-decimal-places-of?noredirect=1&lq=1
function decimalPlaces(n) {
    // Make sure it is a number and use the builtin number -> string.
    var s = '' + +n;
    // Pull out the fraction and the exponent.
    var match = /(?:\.(\d+))?(?:[eE]([+\-]?\d+))?$/.exec(s);
    // NaN or Infinity or integer.
    // We arbitrarily decide that Infinity is integral.
    if (!match) {
        return 0;
    }
    // Count the number of digits in the fraction and subtract the
    // exponent to simulate moving the decimal point left by exponent places.
    // 1.234e+2 has 1 fraction digit and '234'.length -  2 == 1
    // 1.234e-2 has 5 fraction digit and '234'.length - -2 == 5
    return Math.max(0, // lower limit.
    (match[1] == '0' ? 0 : (match[1] || '').length) - // fraction length
        (+match[2] || 0)); // exponent
}
exports.decimalPlaces = decimalPlaces;
class CircularBuffer {
    _bufferSize;
    _buffer = [];
    _index = 0;
    constructor(_bufferSize) {
        this._bufferSize = _bufferSize;
    }
    append(value) {
        const isFull = this._buffer.length === this._bufferSize;
        let poppedValue;
        if (isFull) {
            poppedValue = this._buffer[this._index];
        }
        this._buffer[this._index] = value;
        this._index = (this._index + 1) % this._bufferSize;
        return poppedValue;
    }
    *items() {
        for (let i = 0; i < this._buffer.length; i++) {
            const index = (this._index + i) % this._buffer.length;
            yield this._buffer[index];
        }
    }
    get count() {
        return this._buffer.length;
    }
    clear() {
        this._buffer = [];
        this._index = 0;
    }
}
exports.CircularBuffer = CircularBuffer;
const { BroadcastChannel } = require('worker_threads');
exports.minionReadyChannel = new BroadcastChannel('MinionReady');
exports.mangoProducerReadyChannel = new BroadcastChannel('MangoProducerReady');
exports.mangoDataChannel = new BroadcastChannel('MangoData');
exports.mangoMarketsChannel = new BroadcastChannel('MangoMarkets');
exports.cleanupChannel = new BroadcastChannel('Cleanup');
async function executeAndRetry(operation, { maxRetries }) {
    let attempts = 0;
    while (true) {
        attempts++;
        try {
            return await operation(attempts);
        }
        catch (err) {
            if (attempts > maxRetries) {
                throw err;
            }
            await (0, exports.wait)(500 * attempts * attempts);
        }
    }
}
exports.executeAndRetry = executeAndRetry;
function getPerpMarkets(groupName) {
    mango_client_1.Config.ids().cluster_urls['mainnet'];
    const mangoGroupConfig = mango_client_1.Config.ids().groups.filter((group) => group.name === groupName)[0];
    if (mangoGroupConfig === undefined || mangoGroupConfig.perpMarkets.length === 0) {
        throw new Error(`Invalid groupName provided: ${groupName}.`);
    }
    return mangoGroupConfig.perpMarkets.map((market) => {
        return {
            name: market.name,
            address: market.publicKey.toBase58(),
            programId: mangoGroupConfig.mangoProgramId.toBase58(),
            groupPublicKey: mangoGroupConfig.publicKey.toBase58(),
            marketIndex: market.marketIndex,
            baseDecimals: market.baseDecimals,
            quoteDecimals: market.quoteDecimals
        };
    });
}
exports.getPerpMarkets = getPerpMarkets;
//# sourceMappingURL=helpers.js.map