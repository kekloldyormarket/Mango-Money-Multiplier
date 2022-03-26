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
function initGroup(connection, payer, cluster, groupName, mangoProgramId, serumProgramId, quoteSymbol, quoteMint, feesVault, validInterval, quoteOptimalUtil, quoteOptimalRate, quoteMaxRate) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        console.log({
            connection,
            payer,
            groupName,
            mangoProgramId,
            serumProgramId,
            quoteSymbol,
            quoteMint,
            validInterval,
        });
        const client = new client_1.MangoClient(connection, mangoProgramId);
        const groupKey = yield client.initMangoGroup(quoteMint, config_1.msrmMints[cluster], serumProgramId, feesVault, validInterval, quoteOptimalUtil, quoteOptimalRate, quoteMaxRate, payer);
        const group = yield client.getMangoGroup(groupKey);
        const banks = yield group.loadRootBanks(connection);
        const tokenIndex = group.getTokenIndex(quoteMint);
        const nodeBanks = yield ((_a = banks[tokenIndex]) === null || _a === void 0 ? void 0 : _a.loadNodeBanks(connection));
        console.log(banks);
        console.log(nodeBanks);
        const tokenDesc = {
            symbol: quoteSymbol,
            mintKey: quoteMint,
            decimals: group.tokens[tokenIndex].decimals,
            rootKey: (_b = banks[tokenIndex]) === null || _b === void 0 ? void 0 : _b.publicKey,
            nodeKeys: nodeBanks === null || nodeBanks === void 0 ? void 0 : nodeBanks.map((n) => n === null || n === void 0 ? void 0 : n.publicKey),
        };
        const groupDesc = {
            cluster,
            name: groupName,
            publicKey: groupKey,
            quoteSymbol: quoteSymbol,
            mangoProgramId: mangoProgramId,
            serumProgramId: serumProgramId,
            tokens: [tokenDesc],
            oracles: [],
            perpMarkets: [],
            spotMarkets: [],
        };
        return groupDesc;
    });
}
exports.default = initGroup;
//# sourceMappingURL=initGroup.js.map