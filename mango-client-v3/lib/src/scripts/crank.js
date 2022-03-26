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
const bn_js_1 = __importDefault(require("bn.js"));
const serum_1 = require("@project-serum/serum");
const spl_token_1 = require("@solana/spl-token");
// const interval = process.env.INTERVAL || 3500;
const interval = 4000; // TODO - stop sharing env var with Keeper
const maxUniqueAccounts = parseInt(process.env.MAX_UNIQUE_ACCOUNTS || '10');
const consumeEventsLimit = new bn_js_1.default(process.env.CONSUME_EVENTS_LIMIT || '10');
const config = new config_1.Config(ids_json_1.default);
const cluster = (process.env.CLUSTER || 'devnet');
const groupName = process.env.GROUP || 'devnet.1';
const groupIds = config.getGroup(cluster, groupName);
if (!groupIds) {
    throw new Error(`Group ${groupName} not found`);
}
const mangoProgramId = groupIds.mangoProgramId;
const mangoGroupKey = groupIds.publicKey;
const payer = new web3_js_1.Account(JSON.parse(process.env.KEYPAIR ||
    fs.readFileSync(os.homedir() + '/.config/solana/id.json', 'utf-8')));
const connection = new web3_js_1.Connection(process.env.ENDPOINT_URL || config.cluster_urls[cluster], 'processed');
const client = new client_1.MangoClient(connection, mangoProgramId);
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!groupIds) {
            throw new Error(`Group ${groupName} not found`);
        }
        const mangoGroup = yield client.getMangoGroup(mangoGroupKey);
        const spotMarkets = yield Promise.all(groupIds.spotMarkets.map((m) => {
            return serum_1.Market.load(connection, m.publicKey, {
                skipPreflight: true,
                commitment: 'processed',
            }, mangoGroup.dexProgramId);
        }));
        const quoteToken = new spl_token_1.Token(connection, spotMarkets[0].quoteMintAddress, spl_token_1.TOKEN_PROGRAM_ID, payer);
        const quoteWallet = yield quoteToken
            .getOrCreateAssociatedAccountInfo(payer.publicKey)
            .then((a) => a.address);
        const baseWallets = yield Promise.all(spotMarkets.map((m) => {
            const token = new spl_token_1.Token(connection, m.baseMintAddress, spl_token_1.TOKEN_PROGRAM_ID, payer);
            return token
                .getOrCreateAssociatedAccountInfo(payer.publicKey)
                .then((a) => a.address);
        }));
        const eventQueuePks = spotMarkets.map((market) => market['_decoded'].eventQueue);
        // eslint-disable-next-line
        while (true) {
            const eventQueueAccts = yield utils_1.getMultipleAccounts(connection, eventQueuePks);
            for (let i = 0; i < eventQueueAccts.length; i++) {
                const accountInfo = eventQueueAccts[i].accountInfo;
                const events = serum_1.decodeEventQueue(accountInfo.data);
                if (events.length === 0) {
                    continue;
                }
                const accounts = new Set();
                for (const event of events) {
                    accounts.add(event.openOrders.toBase58());
                    // Limit unique accounts to first 10
                    if (accounts.size >= maxUniqueAccounts) {
                        break;
                    }
                }
                const openOrdersAccounts = [...accounts]
                    .map((s) => new web3_js_1.PublicKey(s))
                    .sort((a, b) => a.toBuffer().swap64().compare(b.toBuffer().swap64()));
                const instr = serum_1.DexInstructions.consumeEvents({
                    market: spotMarkets[i].publicKey,
                    eventQueue: spotMarkets[i]['_decoded'].eventQueue,
                    coinFee: baseWallets[i],
                    pcFee: quoteWallet,
                    openOrdersAccounts,
                    limit: consumeEventsLimit,
                    programId: mangoGroup.dexProgramId,
                });
                const transaction = new web3_js_1.Transaction();
                transaction.add(instr);
                console.log('market', i, 'sending consume events for', events.length, 'events');
                yield client.sendTransaction(transaction, payer, []);
            }
            yield utils_1.sleep(interval);
        }
    });
}
run();
//# sourceMappingURL=crank.js.map