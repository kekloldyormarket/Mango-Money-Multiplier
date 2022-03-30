"use strict";
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
exports.Fetcher = void 0;
const client_1 = require("../client");
const web3_js_1 = require("@solana/web3.js");
const utils_1 = require("../utils/utils");
const ids_json_1 = __importDefault(require("../ids.json"));
const config_1 = require("../config");
const __1 = require("..");
class Fetcher {
    /**
     * Long running program that never exits except on keyboard interrupt
     */
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const interval = process.env.INTERVAL || 5000;
            const config = new config_1.Config(ids_json_1.default);
            // defaults to mainnet since there's more going on there
            const cluster = (process.env.CLUSTER || 'mainnet');
            const groupName = process.env.GROUP || 'mainnet.1';
            const groupIds = config.getGroup(cluster, groupName);
            if (!groupIds) {
                throw new Error(`Group ${groupName} not found`);
            }
            const mangoProgramId = groupIds.mangoProgramId;
            const mangoGroupKey = groupIds.publicKey;
            // we don't need to load a solana Account; we're not gonna be signing anything
            const connection = new web3_js_1.Connection(process.env.ENDPOINT_URL || config.cluster_urls[cluster], 'processed');
            const client = new client_1.MangoClient(connection, mangoProgramId);
            const mangoGroup = yield client.getMangoGroup(mangoGroupKey);
            const marketName = process.env.MARKET || 'MNGO';
            const perpMarketConfig = (0, config_1.getPerpMarketByBaseSymbol)(groupIds, marketName.toUpperCase());
            if (!perpMarketConfig) {
                throw new Error(`Couldn't find market: ${marketName.toUpperCase()}`);
            }
            const marketIndex = perpMarketConfig.marketIndex;
            const mk = groupIds.perpMarkets[marketIndex];
            const perpMarket = yield mangoGroup.loadPerpMarket(connection, mk.marketIndex, mk.baseDecimals, mk.quoteDecimals);
            let lastSeqNum = __1.ZERO_BN;
            // eslint-disable-next-line
            while (true) {
                yield (0, utils_1.sleep)(interval);
                const queue = yield perpMarket.loadEventQueue(connection);
                console.log(queue.eventsSince(lastSeqNum));
                // -1 here since queue.seqNum is the seqNum for the next (future) event
                lastSeqNum = queue.seqNum.sub(__1.ONE_BN);
            }
        });
    }
}
exports.Fetcher = Fetcher;
new Fetcher().run();
//# sourceMappingURL=fetcher.js.map