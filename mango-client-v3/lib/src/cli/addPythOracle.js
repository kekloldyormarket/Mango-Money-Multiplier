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
const PYTH_ORACLES_DEVNET = {
    BTC: 'HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J',
    ETH: 'EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw',
    SOL: 'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix',
    SRM: '992moaMQKs32GKZ9dxi8keyM2bUmbrwBZpK4p2K6X5Vs',
    RAY: '8PugCXTAHLM9kfLSQWe2njE5pzAgUdpPk3Nx5zSm7BD3',
    MNGO: '4GqTjGm686yihQ1m1YdTsSvfm4mNfadv6xskzgCYWNC5',
    DOGE: '4L6YhY8VvUgmqG5MvJkUJATtzB2rFqdrJwQCmFLv4Jzy',
    SUSHI: 'BLArYBCUYhdWiY8PCUTpvFE21iaJq85dvxLk9bYMobcU',
    FTT: '6vivTRs5ZPeeXbjo7dfburfaYDWoXjBtdtuYgQRuGfu',
    USDT: '38xoQ4oeJCBrcVvca2cGk7iV1dAfrmTR1kmhSCJQ8Jto',
};
// mainnet
const PYTH_ORACLES_MAINNET = {
    BTC: 'GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU',
    ETH: 'JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB',
    SOL: 'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG',
    SRM: '3NBReDRTLKMQEKiLD5tGcx4kXbTf88b7f2xLS9UuGjym',
    USDT: '3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqEEefL',
};
function addPythOracle(connection, payer, groupConfig, symbol) {
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
            oraclePk = new web3_js_1.PublicKey(PYTH_ORACLES_MAINNET[symbol]);
        }
        else {
            oraclePk = new web3_js_1.PublicKey(PYTH_ORACLES_DEVNET[symbol]);
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
exports.default = addPythOracle;
//# sourceMappingURL=addPythOracle.js.map