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
const config_1 = require("../config");
const web3_js_1 = require("@solana/web3.js");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const index_1 = require("../index");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const payer = new web3_js_1.Account(JSON.parse(fs_1.default.readFileSync(process.env.KEYPAIR || os_1.default.homedir() + '/.config/solana/id.json', 'utf-8')));
        const config = new config_1.Config(index_1.IDS);
        const groupIds = config.getGroupWithName('mainnet.1');
        if (!groupIds) {
            throw new Error(`Group ${'mainnet.1'} not found`);
        }
        const cluster = groupIds.cluster;
        const mangoProgramId = groupIds.mangoProgramId;
        const mangoGroupKey = groupIds.publicKey;
        const connection = new web3_js_1.Connection(process.env.ENDPOINT_URL || config.cluster_urls[cluster], 'processed');
        const client = new index_1.MangoClient(connection, mangoProgramId);
        const mangoGroup = yield client.getMangoGroup(mangoGroupKey);
        const mangoAccount = yield client.getMangoAccount(new web3_js_1.PublicKey(''), mangoGroup.dexProgramId);
        const rootBanks = yield mangoGroup.loadRootBanks(connection);
        const quoteRootBank = rootBanks[index_1.QUOTE_INDEX];
        const mangoCache = yield mangoGroup.loadCache(connection);
        const perpMarkets = yield Promise.all(groupIds.perpMarkets.map((pmc) => client.getPerpMarket(pmc.publicKey, pmc.baseDecimals, pmc.quoteDecimals)));
        const x = mangoAccount.calcTotalPerpPosUnsettledPnl(mangoGroup, mangoCache);
        console.log(x.toNumber() / Math.pow(10, 6));
        const txids = yield client.settlePosPnl(mangoGroup, mangoCache, mangoAccount, perpMarkets, quoteRootBank, payer);
        console.log(txids);
    });
}
main();
//# sourceMappingURL=scratch.js.map