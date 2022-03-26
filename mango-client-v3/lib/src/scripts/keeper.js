"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
This will probably move to its own repo at some point but easier to keep it here for now
 */
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const client_1 = require("../client");
const web3_js_1 = require("@solana/web3.js");
const utils_1 = require("../utils/utils");
const ids_json_1 = __importDefault(require("../ids.json"));
const config_1 = require("../config");
const instruction_1 = require("../instruction");
const bn_js_1 = __importDefault(require("bn.js"));
const layout_1 = require("../layout");
const __1 = require("..");
const PerpEventQueue_1 = __importDefault(require("../PerpEventQueue"));
let lastRootBankCacheUpdate = 0;
const groupName = process.env.GROUP || 'mainnet.1';
const updateCacheInterval = parseInt(process.env.UPDATE_CACHE_INTERVAL || '3000');
const updateRootBankCacheInterval = parseInt(process.env.UPDATE_ROOT_BANK_CACHE_INTERVAL || '5000');
const processKeeperInterval = parseInt(process.env.PROCESS_KEEPER_INTERVAL || '10000');
const consumeEventsInterval = parseInt(process.env.CONSUME_EVENTS_INTERVAL || '1000');
const maxUniqueAccounts = parseInt(process.env.MAX_UNIQUE_ACCOUNTS || '10');
const consumeEventsLimit = new bn_js_1.default(process.env.CONSUME_EVENTS_LIMIT || '10');
const consumeEvents = process.env.CONSUME_EVENTS
    ? process.env.CONSUME_EVENTS === 'true'
    : true;
const cluster = (process.env.CLUSTER || 'mainnet');
const config = new config_1.Config(ids_json_1.default);
const groupIds = config.getGroup(cluster, groupName);
if (!groupIds) {
    throw new Error(`Group ${groupName} not found`);
}
const mangoProgramId = groupIds.mangoProgramId;
const mangoGroupKey = groupIds.publicKey;
const payer = new web3_js_1.Account(JSON.parse(process.env.KEYPAIR ||
    fs.readFileSync(os.homedir() + '/.config/solana/blw.json', 'utf-8')));
const connection = new web3_js_1.Connection(process.env.ENDPOINT_URL || config.cluster_urls[cluster], 'processed');
const client = new client_1.MangoClient(connection, mangoProgramId);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!groupIds) {
            throw new Error(`Group ${groupName} not found`);
        }
        const mangoGroup = yield client.getMangoGroup(mangoGroupKey);
        const perpMarkets = yield Promise.all(groupIds.perpMarkets.map((m) => {
            return mangoGroup.loadPerpMarket(connection, m.marketIndex, m.baseDecimals, m.quoteDecimals);
        }));
        processUpdateCache(mangoGroup);
        processKeeperTransactions(mangoGroup, perpMarkets);
        if (consumeEvents) {
            processConsumeEvents(mangoGroup, perpMarkets);
        }
    });
}
console.time('processUpdateCache');
function processUpdateCache(mangoGroup) {
    return __awaiter(this, void 0, void 0, function* () {
        console.timeEnd('processUpdateCache');
        try {
            const batchSize = 8;
            const promises = [];
            const rootBanks = mangoGroup.tokens
                .map((t) => t.rootBank)
                .filter((t) => !t.equals(utils_1.zeroKey));
            const oracles = mangoGroup.oracles.filter((o) => !o.equals(utils_1.zeroKey));
            const perpMarkets = mangoGroup.perpMarkets
                .filter((pm) => !pm.isEmpty())
                .map((pm) => pm.perpMarket);
            const nowTs = Date.now();
            let shouldUpdateRootBankCache = false;
            if (nowTs - lastRootBankCacheUpdate > updateRootBankCacheInterval) {
                shouldUpdateRootBankCache = true;
                lastRootBankCacheUpdate = nowTs;
            }
            for (let i = 0; i < rootBanks.length / batchSize; i++) {
                const startIndex = i * batchSize;
                const endIndex = i * batchSize + batchSize;
                const cacheTransaction = new web3_js_1.Transaction();
                if (shouldUpdateRootBankCache) {
                    cacheTransaction.add(instruction_1.makeCacheRootBankInstruction(mangoProgramId, mangoGroup.publicKey, mangoGroup.mangoCache, rootBanks.slice(startIndex, endIndex)));
                }
                cacheTransaction.add(instruction_1.makeCachePricesInstruction(mangoProgramId, mangoGroup.publicKey, mangoGroup.mangoCache, oracles.slice(startIndex, endIndex)));
                cacheTransaction.add(instruction_1.makeCachePerpMarketsInstruction(mangoProgramId, mangoGroup.publicKey, mangoGroup.mangoCache, perpMarkets.slice(startIndex, endIndex)));
                if (cacheTransaction.instructions.length > 0) {
                    promises.push(client.sendTransaction(cacheTransaction, payer, []));
                }
            }
            Promise.all(promises).catch((err) => {
                console.error('Error updating cache', err);
            });
        }
        finally {
            console.time('processUpdateCache');
            setTimeout(processUpdateCache, updateCacheInterval, mangoGroup);
        }
    });
}
function processConsumeEvents(mangoGroup, perpMarkets) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const eventQueuePks = perpMarkets.map((mkt) => mkt.eventQueue);
            const eventQueueAccts = yield utils_1.getMultipleAccounts(connection, eventQueuePks);
            const perpMktAndEventQueue = eventQueueAccts.map(({ publicKey, accountInfo }) => {
                const parsed = layout_1.PerpEventQueueLayout.decode(accountInfo === null || accountInfo === void 0 ? void 0 : accountInfo.data);
                const eventQueue = new PerpEventQueue_1.default(parsed);
                const perpMarket = perpMarkets.find((mkt) => mkt.eventQueue.equals(publicKey));
                if (!perpMarket) {
                    throw new Error('PerpMarket not found');
                }
                return { perpMarket, eventQueue };
            });
            const promises = perpMktAndEventQueue.map(({ perpMarket, eventQueue }) => {
                const events = eventQueue.getUnconsumedEvents();
                if (events.length === 0) {
                    // console.log('No events to consume');
                    return __1.promiseUndef();
                }
                const accounts = new Set();
                for (const event of events) {
                    if (event.fill) {
                        accounts.add(event.fill.maker.toBase58());
                        accounts.add(event.fill.taker.toBase58());
                    }
                    else if (event.out) {
                        accounts.add(event.out.owner.toBase58());
                    }
                    // Limit unique accounts to first 20 or 21
                    if (accounts.size >= maxUniqueAccounts) {
                        break;
                    }
                }
                return client
                    .consumeEvents(mangoGroup, perpMarket, Array.from(accounts)
                    .map((s) => new web3_js_1.PublicKey(s))
                    .sort(), payer, consumeEventsLimit)
                    .then(() => {
                    console.log(`Consumed up to ${events.length} events ${perpMarket.publicKey.toBase58()}`);
                    console.log('EVENTS:', events.map((e) => { var _a; return (_a = e === null || e === void 0 ? void 0 : e.fill) === null || _a === void 0 ? void 0 : _a.seqNum.toString(); }));
                })
                    .catch((err) => {
                    console.error('Error consuming events', err);
                });
            });
            Promise.all(promises);
        }
        finally {
            setTimeout(processConsumeEvents, consumeEventsInterval, mangoGroup, perpMarkets);
        }
    });
}
function processKeeperTransactions(mangoGroup, perpMarkets) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!groupIds) {
                throw new Error(`Group ${groupName} not found`);
            }
            console.log('processKeeperTransactions');
            const batchSize = 8;
            const promises = [];
            const filteredPerpMarkets = perpMarkets.filter((pm) => !pm.publicKey.equals(utils_1.zeroKey));
            for (let i = 0; i < groupIds.tokens.length / batchSize; i++) {
                const startIndex = i * batchSize;
                const endIndex = i * batchSize + batchSize;
                const updateRootBankTransaction = new web3_js_1.Transaction();
                groupIds.tokens.slice(startIndex, endIndex).forEach((token) => {
                    updateRootBankTransaction.add(instruction_1.makeUpdateRootBankInstruction(mangoProgramId, mangoGroup.publicKey, mangoGroup.mangoCache, token.rootKey, token.nodeKeys));
                });
                const updateFundingTransaction = new web3_js_1.Transaction();
                filteredPerpMarkets.slice(startIndex, endIndex).forEach((market) => {
                    if (market) {
                        updateFundingTransaction.add(instruction_1.makeUpdateFundingInstruction(mangoProgramId, mangoGroup.publicKey, mangoGroup.mangoCache, market.publicKey, market.bids, market.asks));
                    }
                });
                if (updateRootBankTransaction.instructions.length > 0) {
                    promises.push(client.sendTransaction(updateRootBankTransaction, payer, []));
                }
                if (updateFundingTransaction.instructions.length > 0) {
                    promises.push(client.sendTransaction(updateFundingTransaction, payer, []));
                }
            }
            Promise.all(promises).catch((err) => {
                console.error('Error processing keeper instructions', err);
            });
        }
        finally {
            setTimeout(processKeeperTransactions, processKeeperInterval, mangoGroup, perpMarkets);
        }
    });
}
main();
//# sourceMappingURL=keeper.js.map