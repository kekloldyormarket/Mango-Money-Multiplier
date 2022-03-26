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
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const client_1 = require("../client");
const config_1 = require("../config");
// devnet
const SWITCHBOARD_ORACLES_DEVNET = {
    MNGO: '8k7F9Xb36oFJsjpCKpsXvg4cgBRoZtwNTc3EzG5Ttd2o',
};
// mainnet
const SWITCHBOARD_ORACLES_MAINNET = {
    RAY: 'AS2yMpqPY16tY5hQmpdkomaqSckMuDvR6K9P9tk9FA4d',
    MNGO: '49cnp1ejyvQi3CJw3kKXNCDGnNbWDuZd3UG3Y2zGvQkX',
};
function addSwitchboardOracle(connection, payer, groupConfig, symbol) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log({
            connection,
            payer,
            groupConfig,
            symbol,
        });
        const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
        const group = yield client.getMangoGroup(groupConfig.publicKey);
        let oraclePk;
        if (groupConfig.cluster === 'mainnet') {
            oraclePk = new web3_js_1.PublicKey(SWITCHBOARD_ORACLES_MAINNET[symbol]);
        }
        else {
            oraclePk = new web3_js_1.PublicKey(SWITCHBOARD_ORACLES_DEVNET[symbol]);
        }
        yield client.addOracle(group, oraclePk, payer);
        const oracle = {
            symbol: symbol,
            publicKey: oraclePk,
        };
        const _oracle = config_1.getOracleBySymbol(groupConfig, symbol);
        if (_oracle) {
            Object.assign(_oracle, oracle);
        }
        else {
            groupConfig.oracles.push(oracle);
        }
        return groupConfig;
    });
}
exports.default = addSwitchboardOracle;
//# sourceMappingURL=addSwitchboardOracle.js.map