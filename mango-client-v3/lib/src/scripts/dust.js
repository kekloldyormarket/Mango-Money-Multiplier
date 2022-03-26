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
const ids_json_1 = __importDefault(require("../ids.json"));
const config_1 = require("../config");
const __1 = require("..");
const config = new config_1.Config(ids_json_1.default);
const cluster = (process.env.CLUSTER || 'devnet');
const groupName = process.env.GROUP || 'mainnet.1';
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
        const rootBanks = yield mangoGroup.loadRootBanks(connection);
        const cache = yield mangoGroup.loadCache(connection);
        const quoteRootBank = rootBanks[__1.QUOTE_INDEX];
        if (!quoteRootBank) {
            throw new Error('Quote Rootbank Not Found');
        }
        const mangoAccount = yield client.getMangoAccount(new web3_js_1.PublicKey('8m3Lh1Exh5WaG76aFRWFGgMU5yWXLxifbgVfCnFjv15p'), mangoGroup.dexProgramId);
        //    console.log('Creating group dust account');
        //    await client.createDustAccount(mangoGroup, payer);
        console.log('Resolving account dust');
        yield client.resolveDust(mangoGroup, mangoAccount, quoteRootBank, cache, payer);
    });
}
run();
//# sourceMappingURL=dust.js.map