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
const ids_json_1 = __importDefault(require("../ids.json"));
const config_1 = require("../config");
const utils_1 = require("../utils/utils");
const client_1 = require("../client");
const web3_js_1 = require("@solana/web3.js");
const layout_1 = require("../layout");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const config = new config_1.Config(ids_json_1.default);
        const groupName = process.env.GROUP || 'mainnet.1';
        const groupIds = config.getGroupWithName(groupName);
        const cluster = groupIds.cluster;
        const mangoProgramId = groupIds.mangoProgramId;
        const mangoGroupKey = groupIds.publicKey;
        const connection = new web3_js_1.Connection(process.env.ENDPOINT_URL || config.cluster_urls[cluster], 'processed');
        const client = new client_1.MangoClient(connection, mangoProgramId);
        const group = yield client.getMangoGroup(mangoGroupKey);
        // AVAX-PERP
        const avaxParams = (0, utils_1.findPerpMarketParams)(18, group.tokens[layout_1.QUOTE_INDEX].decimals, 85, 10, 500);
        console.log('AVAX params:', avaxParams);
        // BNB-PERP
        const bnbParams = (0, utils_1.findPerpMarketParams)(18, group.tokens[layout_1.QUOTE_INDEX].decimals, 568, 10, 500);
        console.log('BNB params:', bnbParams);
        // MATIC-PERP
        const maticParams = (0, utils_1.findPerpMarketParams)(18, group.tokens[layout_1.QUOTE_INDEX].decimals, 2.22, 10, 500);
        console.log('MATIC params:', maticParams);
        // LUNA-PERP
        const lunaParams = (0, utils_1.findPerpMarketParams)(6, group.tokens[layout_1.QUOTE_INDEX].decimals, 85, 10, 500);
        console.log('LUNA params:', lunaParams);
        // DOT-PERP
        const dotParams = (0, utils_1.findPerpMarketParams)(10, group.tokens[layout_1.QUOTE_INDEX].decimals, 64, 10, 500);
        console.log('DOT params:', dotParams);
    });
}
main();
//# sourceMappingURL=perpconf.js.map