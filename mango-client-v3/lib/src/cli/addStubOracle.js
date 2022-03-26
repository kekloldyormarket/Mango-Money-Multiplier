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
const client_1 = require("../client");
const config_1 = require("../config");
function addStubOracle(connection, payer, groupConfig, symbol) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log({
            connection,
            payer,
            groupConfig,
            symbol,
        });
        const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
        yield client.addStubOracle(groupConfig.publicKey, payer);
        const group = yield client.getMangoGroup(groupConfig.publicKey);
        const oracle = {
            symbol: symbol,
            publicKey: group.oracles[group.numOracles - 1],
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
exports.default = addStubOracle;
//# sourceMappingURL=addStubOracle.js.map