"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = exports.getTokenBySymbol = exports.getTokenByMint = exports.getMarketByPublicKey = exports.getMarketByBaseSymbolAndKind = exports.getAllMarkets = exports.getSpotMarketByBaseSymbol = exports.getPerpMarketByIndex = exports.getPerpMarketByBaseSymbol = exports.getOracleBySymbol = exports.getMarketIndexBySymbol = exports.mngoMints = exports.msrmMints = void 0;
const web3_js_1 = require("@solana/web3.js");
const ids_json_1 = __importDefault(require("./ids.json"));
const utils_1 = require("./utils/utils");
exports.msrmMints = {
    devnet: new web3_js_1.PublicKey('8DJBo4bF4mHNxobjdax3BL9RMh5o71Jf8UiKsf5C5eVH'),
    mainnet: new web3_js_1.PublicKey('MSRMcoVyrFxnSgo5uXwone5SKcGhT1KEJMFEkMEWf9L'),
    localnet: utils_1.zeroKey,
    testnet: utils_1.zeroKey,
};
exports.mngoMints = {
    devnet: new web3_js_1.PublicKey('Bb9bsTQa1bGEtQ5KagGkvSHyuLqDWumFUcRqFusFNJWC'),
    mainnet: new web3_js_1.PublicKey('MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac'),
};
function oracleConfigFromJson(j) {
    return Object.assign(Object.assign({}, j), { publicKey: new web3_js_1.PublicKey(j.publicKey) });
}
function oracleConfigToJson(o) {
    return Object.assign(Object.assign({}, o), { publicKey: o.publicKey.toBase58() });
}
function spotMarketConfigFromJson(j) {
    return Object.assign(Object.assign({}, j), { publicKey: new web3_js_1.PublicKey(j.publicKey), bidsKey: new web3_js_1.PublicKey(j.bidsKey), asksKey: new web3_js_1.PublicKey(j.asksKey), eventsKey: new web3_js_1.PublicKey(j.eventsKey) });
}
function spotMarketConfigToJson(p) {
    return Object.assign(Object.assign({}, p), { publicKey: p.publicKey.toBase58(), bidsKey: p.bidsKey.toBase58(), asksKey: p.asksKey.toBase58(), eventsKey: p.eventsKey.toBase58() });
}
function perpMarketConfigFromJson(j) {
    return Object.assign(Object.assign({}, j), { publicKey: new web3_js_1.PublicKey(j.publicKey), bidsKey: new web3_js_1.PublicKey(j.bidsKey), asksKey: new web3_js_1.PublicKey(j.asksKey), eventsKey: new web3_js_1.PublicKey(j.eventsKey) });
}
function perpMarketConfigToJson(p) {
    return Object.assign(Object.assign({}, p), { publicKey: p.publicKey.toBase58(), bidsKey: p.bidsKey.toBase58(), asksKey: p.asksKey.toBase58(), eventsKey: p.eventsKey.toBase58() });
}
function tokenConfigFromJson(j) {
    return Object.assign(Object.assign({}, j), { mintKey: new web3_js_1.PublicKey(j.mintKey), rootKey: new web3_js_1.PublicKey(j.rootKey), nodeKeys: j.nodeKeys.map((k) => new web3_js_1.PublicKey(k)) });
}
function tokenConfigToJson(t) {
    return Object.assign(Object.assign({}, t), { mintKey: t.mintKey.toBase58(), rootKey: t.rootKey.toBase58(), nodeKeys: t.nodeKeys.map((k) => k.toBase58()) });
}
function getMarketIndexBySymbol(group, symbol) {
    return group.oracles.findIndex((o) => o.symbol === symbol);
}
exports.getMarketIndexBySymbol = getMarketIndexBySymbol;
function getOracleBySymbol(group, symbol) {
    return group.oracles.find((o) => o.symbol === symbol);
}
exports.getOracleBySymbol = getOracleBySymbol;
function getPerpMarketByBaseSymbol(group, symbol) {
    return group.perpMarkets.find((p) => p.baseSymbol === symbol);
}
exports.getPerpMarketByBaseSymbol = getPerpMarketByBaseSymbol;
function getPerpMarketByIndex(group, marketIndex) {
    return group.perpMarkets.find((p) => p.marketIndex === marketIndex);
}
exports.getPerpMarketByIndex = getPerpMarketByIndex;
function getSpotMarketByBaseSymbol(group, symbol) {
    return group.spotMarkets.find((p) => p.baseSymbol === symbol);
}
exports.getSpotMarketByBaseSymbol = getSpotMarketByBaseSymbol;
function getAllMarkets(group) {
    const spotMarkets = group.spotMarkets.map((m) => (Object.assign({ kind: 'spot' }, m)));
    const perpMarkets = group.perpMarkets.map((m) => (Object.assign({ kind: 'perp' }, m)));
    return spotMarkets.concat(perpMarkets);
}
exports.getAllMarkets = getAllMarkets;
function getMarketByBaseSymbolAndKind(group, symbol, kind) {
    const market = kind === 'spot'
        ? getSpotMarketByBaseSymbol(group, symbol)
        : getPerpMarketByBaseSymbol(group, symbol);
    return Object.assign({ kind }, market);
}
exports.getMarketByBaseSymbolAndKind = getMarketByBaseSymbolAndKind;
function getMarketByPublicKey(group, key) {
    if (!(key instanceof web3_js_1.PublicKey)) {
        key = new web3_js_1.PublicKey(key);
    }
    const spot = group.spotMarkets.find((m) => m.publicKey.equals(key));
    if (spot) {
        return Object.assign({ kind: 'spot' }, spot);
    }
    const perp = group.perpMarkets.find((m) => m.publicKey.equals(key));
    if (perp) {
        return Object.assign({ kind: 'perp' }, perp);
    }
}
exports.getMarketByPublicKey = getMarketByPublicKey;
function getTokenByMint(group, mint) {
    if (!(mint instanceof web3_js_1.PublicKey)) {
        mint = new web3_js_1.PublicKey(mint);
    }
    return group.tokens.find((t) => t.mintKey.equals(mint));
}
exports.getTokenByMint = getTokenByMint;
function getTokenBySymbol(group, symbol) {
    const tokenConfig = group.tokens.find((t) => t.symbol === symbol);
    if (tokenConfig === undefined) {
        throw new Error(`Unable to find symbol: ${symbol} in GroupConfig`);
    }
    return tokenConfig;
}
exports.getTokenBySymbol = getTokenBySymbol;
// export function getTokenBySymbol(group: GroupConfig, symbol: string) {
//   return group.tokens.find((t) => t.symbol === symbol);
// }
function groupConfigFromJson(j) {
    return Object.assign(Object.assign({}, j), { publicKey: new web3_js_1.PublicKey(j.publicKey), mangoProgramId: new web3_js_1.PublicKey(j.mangoProgramId), serumProgramId: new web3_js_1.PublicKey(j.serumProgramId), oracles: j.oracles.map((o) => oracleConfigFromJson(o)), perpMarkets: j.perpMarkets.map((p) => perpMarketConfigFromJson(p)), spotMarkets: j.spotMarkets.map((p) => spotMarketConfigFromJson(p)), tokens: j.tokens.map((t) => tokenConfigFromJson(t)) });
}
function groupConfigToJson(g) {
    return Object.assign(Object.assign({}, g), { publicKey: g.publicKey.toBase58(), mangoProgramId: g.mangoProgramId.toBase58(), serumProgramId: g.serumProgramId.toBase58(), oracles: g.oracles.map((o) => oracleConfigToJson(o)), perpMarkets: g.perpMarkets.map((p) => perpMarketConfigToJson(p)), spotMarkets: g.spotMarkets.map((p) => spotMarketConfigToJson(p)), tokens: g.tokens.map((t) => tokenConfigToJson(t)) });
}
class Config {
    constructor(json) {
        this.cluster_urls = json.cluster_urls;
        this.groups = json.groups.map((g) => groupConfigFromJson(g));
    }
    static ids() {
        return staticConfig;
    }
    toJson() {
        return Object.assign(Object.assign({}, this), { groups: this.groups.map((g) => groupConfigToJson(g)) });
    }
    getGroup(cluster, name) {
        return this.groups.find((g) => g.cluster === cluster && g.name === name);
    }
    getGroupWithName(name) {
        return this.groups.find((g) => g.name === name);
    }
    storeGroup(group) {
        const _group = this.getGroup(group.cluster, group.name);
        if (_group) {
            Object.assign(_group, group);
        }
        else {
            this.groups.unshift(group);
        }
    }
}
exports.Config = Config;
const staticConfig = new Config(ids_json_1.default);
//# sourceMappingURL=config.js.map