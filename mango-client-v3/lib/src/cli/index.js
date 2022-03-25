#!/usr/bin/env node
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
exports.writeConfig = exports.readConfig = exports.sanityCheck = exports.listMarket = exports.setStubOracle = exports.initGroup = exports.addSwitchboardOracle = exports.addPythOracle = exports.addStubOracle = exports.addSpotMarket = exports.addPerpMarket = void 0;
// TODO put node banks and vaults inside the GroupConfig
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const yargs_1 = __importDefault(require("yargs/yargs"));
const helpers_1 = require("yargs/helpers");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
const client_1 = require("../client");
const utils_1 = require("../utils/utils");
const layout_1 = require("../layout");
const mango_logs_json_1 = __importDefault(require("../mango_logs.json"));
const config_2 = require("../config");
const serum_1 = require("@project-serum/serum");
const initGroup_1 = __importDefault(require("./initGroup"));
exports.initGroup = initGroup_1.default;
const addPerpMarket_1 = __importDefault(require("./addPerpMarket"));
exports.addPerpMarket = addPerpMarket_1.default;
const addSpotMarket_1 = __importDefault(require("./addSpotMarket"));
exports.addSpotMarket = addSpotMarket_1.default;
const addStubOracle_1 = __importDefault(require("./addStubOracle"));
exports.addStubOracle = addStubOracle_1.default;
const addPythOracle_1 = __importDefault(require("./addPythOracle"));
exports.addPythOracle = addPythOracle_1.default;
const addSwitchboardOracle_1 = __importDefault(require("./addSwitchboardOracle"));
exports.addSwitchboardOracle = addSwitchboardOracle_1.default;
const setStubOracle_1 = __importDefault(require("./setStubOracle"));
exports.setStubOracle = setStubOracle_1.default;
const listMarket_1 = __importDefault(require("./listMarket"));
exports.listMarket = listMarket_1.default;
const sanityCheck_1 = __importDefault(require("./sanityCheck"));
exports.sanityCheck = sanityCheck_1.default;
const clusterDesc = [
    'cluster',
    {
        describe: 'the cluster to connect to',
        default: 'devnet',
        choices: ['devnet', 'mainnet'],
    },
];
const configDesc = [
    'config',
    {
        describe: 'the config file to store all public keys',
        default: './src/ids.json',
        type: 'string',
    },
];
const keypairDesc = [
    'keypair',
    {
        describe: 'the keypair used to sign all transactions',
        default: os.homedir() + '/.config/solana/id.json',
        type: 'string',
    },
];
const groupDesc = [
    'group',
    { describe: 'the mango group name 🥭', type: 'string' },
];
const symbolDesc = [
    'symbol',
    { describe: 'the base token symbol', type: 'string' },
];
function openConnection(config, cluster) {
    return new web3_js_1.Connection(config.cluster_urls[cluster], 'processed');
}
function readKeypair(keypairPath) {
    return new web3_js_1.Account(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')));
}
function readConfig(configPath) {
    return new config_1.Config(JSON.parse(fs.readFileSync(configPath, 'utf-8')));
}
exports.readConfig = readConfig;
function writeConfig(configPath, config) {
    fs.writeFileSync(configPath, JSON.stringify(config.toJson(), null, 2));
}
exports.writeConfig = writeConfig;
yargs_1.default(helpers_1.hideBin(process.argv)).command('init-group <group> <mangoProgramId> <serumProgramId> <quote_mint> <fees_vault>', 'initialize a new group', (y) => {
    return y
        .positional(...groupDesc)
        .positional('mangoProgramId', {
        describe: 'the program id of the mango smart contract',
        type: 'string',
    })
        .positional('serumProgramId', {
        describe: 'the program id of the serum dex smart contract',
        type: 'string',
    })
        .positional('quote_mint', {
        describe: 'the mint of the quote currency 💵',
        type: 'string',
    })
        .positional('fees_vault', {
        describe: 'the quote currency vault owned by Mango DAO token governance',
        type: 'string',
    })
        .option('quote_optimal_util', {
        describe: 'optimal utilization interest rate param for quote currency',
        default: 0.7,
        type: 'number',
    })
        .option('quote_optimal_rate', {
        describe: 'optimal interest rate param for quote currency',
        default: 0.06,
        type: 'number',
    })
        .option('quote_max_rate', {
        describe: 'max interest rate param for quote currency',
        default: 1.5,
        type: 'number',
    })
        .option('valid_interval', {
        describe: 'the interval where caches are no longer valid',
        default: 10,
        type: 'number',
    })
        .option('symbol', {
        describe: 'the quote symbol',
        default: 'USDC',
        type: 'string',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('init_group', args);
    const mangoProgramId = new web3_js_1.PublicKey(args.mangoProgramId);
    const serumProgramId = new web3_js_1.PublicKey(args.serumProgramId);
    const quoteMint = new web3_js_1.PublicKey(args.quote_mint);
    const feesVault = new web3_js_1.PublicKey(args.fees_vault);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const result = yield initGroup_1.default(connection, account, cluster, args.group, mangoProgramId, serumProgramId, args.symbol, quoteMint, feesVault, args.valid_interval, args.quote_optimal_util, args.quote_optimal_rate, args.quote_max_rate);
    console.log(result);
    config.storeGroup(result);
    writeConfig(args.config, config);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('add-oracle <group> <symbol>', 'add an oracle to the group', (y) => {
    return y
        .positional(...groupDesc)
        .positional(...symbolDesc)
        .option('provider', {
        describe: 'oracle provider',
        default: 'stub',
        choices: ['stub', 'pyth', 'switchboard'],
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('add_oracle', args);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const group = config.getGroup(cluster, args.group);
    let result;
    if (args.provider === 'pyth') {
        result = yield addPythOracle_1.default(connection, account, group, args.symbol);
    }
    else if (args.provider === 'switchboard') {
        result = yield addSwitchboardOracle_1.default(connection, account, group, args.symbol);
    }
    else if (args.provider === 'stub') {
        result = yield addStubOracle_1.default(connection, account, group, args.symbol);
    }
    else {
        throw new Error();
    }
    config.storeGroup(result);
    writeConfig(args.config, config);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('set-oracle <group> <symbol> <value>', 'set stub oracle to given value', (y) => {
    return y
        .positional(...groupDesc)
        .positional(...symbolDesc)
        .positional('value', {
        describe: 'new oracle value is base_price * quote_unit / base_unit',
        type: 'number',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('set_oracle', args);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const group = config.getGroup(cluster, args.group);
    yield setStubOracle_1.default(connection, account, group, args.symbol, args.value);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('add-perp-market <group> <symbol>', 'add a perp market to the group', (y) => {
    return y
        .positional(...groupDesc)
        .positional(...symbolDesc)
        .option('maint_leverage', {
        default: 20,
        type: 'number',
    })
        .option('init_leverage', {
        default: 10,
        type: 'number',
    })
        .option('liquidation_fee', {
        default: 0.025,
        type: 'number',
    })
        .option('maker_fee', {
        default: 0.0,
        type: 'number',
    })
        .option('taker_fee', {
        default: 0.0005,
        type: 'number',
    })
        .option('base_lot_size', {
        default: 100,
        type: 'number',
    })
        .option('quote_lot_size', {
        default: 10,
        type: 'number',
    })
        .option('max_num_events', {
        default: 256,
        type: 'number',
    })
        .option('rate', {
        default: 1,
        type: 'number',
    })
        .option('max_depth_bps', {
        default: 200,
        type: 'number',
    })
        .option('target_period_length', {
        default: 3600,
        type: 'number',
    })
        .option('mngo_per_period', {
        // default: 11400, // roughly corresponds to 100m MNGO per year
        default: 0,
        type: 'number',
    })
        .option('exp', {
        default: 2,
        type: 'number',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('add-perp-market', args);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const group = config.getGroup(cluster, args.group);
    const result = yield addPerpMarket_1.default(connection, account, group, args.symbol, args.maint_leverage, args.init_leverage, args.liquidation_fee, args.maker_fee, args.taker_fee, args.base_lot_size, args.quote_lot_size, args.max_num_events, args.rate, args.max_depth_bps, args.target_period_length, args.mngo_per_period, args.exp);
    config.storeGroup(result);
    writeConfig(args.config, config);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('add-spot-market <group> <symbol> <mint_pk>', 'add a spot market to the group', (y) => {
    return y
        .positional(...groupDesc)
        .positional(...symbolDesc)
        .positional('mint_pk', {
        describe: 'the public key of the base token mint',
        type: 'string',
    })
        .option('market_pk', {
        default: '',
        describe: 'the public key of the spot market',
        type: 'string',
    })
        .option('base_lot_size', {
        default: 100,
        describe: 'Lot size of the base mint',
        type: 'number',
    })
        .option('quote_lot_size', {
        default: 10,
        describe: 'Lot size of the quote mint',
        type: 'number',
    })
        .option('maint_leverage', {
        default: 10,
        type: 'number',
    })
        .option('init_leverage', {
        default: 5,
        type: 'number',
    })
        .option('liquidation_fee', {
        default: 0.05,
        type: 'number',
    })
        .option('optimal_util', {
        describe: 'optimal utilization interest rate param',
        default: 0.7,
        type: 'number',
    })
        .option('optimal_rate', {
        describe: 'optimal interest rate param',
        default: 0.06,
        type: 'number',
    })
        .option('max_rate', {
        describe: 'max interest rate param',
        default: 1.5,
        type: 'number',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('add-spot-market', args);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const group = config.getGroup(cluster, args.group);
    const quoteMintPk = (_a = config_1.getTokenBySymbol(group, group.quoteSymbol)) === null || _a === void 0 ? void 0 : _a.mintKey;
    const market_pk = args.market_pk
        ? new web3_js_1.PublicKey(args.market_pk)
        : yield listMarket_1.default(connection, account, group.mangoProgramId, new web3_js_1.PublicKey(args.mint_pk), quoteMintPk, args.base_lot_size, args.quote_lot_size, group.serumProgramId);
    const result = yield addSpotMarket_1.default(connection, account, group, args.symbol, market_pk, new web3_js_1.PublicKey(args.mint_pk), args.maint_leverage, args.init_leverage, args.liquidation_fee, args.optimal_util, args.optimal_rate, args.max_rate);
    config.storeGroup(result);
    writeConfig(args.config, config);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('sanity-check <group>', 'check group conditions that always have to be true', (y) => {
    return y.positional(...groupDesc).option(...configDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('sanity check', args);
    const config = readConfig(args.config);
    const groupConfig = config.getGroupWithName(args.group);
    const connection = openConnection(config, groupConfig.cluster);
    yield sanityCheck_1.default(connection, groupConfig);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('show <group> <mango_account_pk>', 'Print relevant details about a mango account', (y) => {
    return y
        .positional(...groupDesc)
        .positional('mango_account_pk', {
        describe: 'the public key of the MangoAccount',
        type: 'string',
    })
        .option(...configDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('show', args);
    const config = readConfig(args.config);
    const groupConfig = config.getGroupWithName(args.group);
    const connection = openConnection(config, groupConfig.cluster);
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    const mangoAccount = yield client.getMangoAccount(new web3_js_1.PublicKey(args.mango_account_pk), groupConfig.serumProgramId);
    const cache = yield mangoGroup.loadCache(connection);
    console.log(mangoAccount.toPrettyString(groupConfig, mangoGroup, cache));
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('inspect-wallet <group> <wallet_pk>', 'Print relevant details about a mango account', (y) => {
    return y
        .positional(...groupDesc)
        .positional('mango_account_pk', {
        describe: 'the public key of the MangoAccount',
        type: 'string',
    })
        .option(...configDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inspect-wallet', args);
    const config = readConfig(args.config);
    const groupConfig = config.getGroupWithName(args.group);
    const connection = openConnection(config, groupConfig.cluster);
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    const mangoAccounts = yield client.getMangoAccountsForOwner(mangoGroup, new web3_js_1.PublicKey(args.wallet_pk), false);
    console.log('total # mango accts: ', mangoAccounts.length);
    const cache = yield mangoGroup.loadCache(connection);
    for (const mangoAccount of mangoAccounts) {
        console.log(mangoAccount.toPrettyString(groupConfig, mangoGroup, cache));
    }
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('decode-log <log_b64>', 'Decode and print out log', (y) => {
    return y
        .positional('log_b64', {
        describe: 'base 64 encoded mango log',
        type: 'string',
    })
        .option(...configDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('decode-log', args);
    // @ts-ignore
    const coder = new Coder(mango_logs_json_1.default);
    const event = coder.events.decode(args.log_b64);
    if (!event) {
        throw new Error('Invalid mango log');
    }
    const data = event.data;
    if (event.name === 'CancelAllPerpOrdersLog') {
        data.allOrderIds = data.allOrderIds.map((oid) => oid.toString());
        data.canceledOrderIds = data.canceledOrderIds.map((oid) => oid.toString());
        data.mangoGroup = data['mangoGroup'].toString();
        data.mangoAccount = data['mangoAccount'].toString();
    }
    else {
        for (const key in data) {
            data[key] = data[key].toString();
        }
    }
    console.log(event);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('show-group <group>', 'Print relevant details about a MangoGroup', (y) => {
    return y.positional(...groupDesc).option(...configDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('show-group', args);
    const config = readConfig(args.config);
    const groupConfig = config.getGroupWithName(args.group);
    const connection = openConnection(config, groupConfig.cluster);
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    for (let i = 0; i < layout_1.QUOTE_INDEX; i++) {
        const perpMarket = mangoGroup.perpMarkets[i];
        if (perpMarket.isEmpty()) {
            continue;
        }
        const pmc = config_1.getPerpMarketByIndex(groupConfig, i);
        const pm = yield client.getPerpMarket(perpMarket.perpMarket, pmc.baseDecimals, pmc.quoteDecimals);
        const x = yield connection.getTokenAccountBalance(pm.mngoVault);
        console.log(pmc.baseSymbol, pm.mngoVault.toBase58(), x);
    }
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('show-insurance-vault <group>', 'Print relevant details about a MangoGroup', (y) => {
    return y.positional(...groupDesc).option(...configDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('show-group', args);
    const config = readConfig(args.config);
    const groupConfig = config.getGroupWithName(args.group);
    const connection = openConnection(config, groupConfig.cluster);
    const vaultBalance = yield connection.getTokenAccountBalance(new web3_js_1.PublicKey('59BEyxwrFpt3x4sZ7TcXC3bHx3seGfqGkATcDx6siLWy'));
    console.log(`Insurance Vault: ${vaultBalance.value.uiAmountString}`);
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('show-top-positions <group> <symbol>', 'Print top 10 positions for the symbol perp market', (y) => {
    return y.positional(...groupDesc).option(...configDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('show-top-positions', args);
    const config = readConfig(args.config);
    const groupConfig = config.getGroupWithName(args.group);
    const perpMarketConfig = utils_1.throwUndefined(config_1.getPerpMarketByBaseSymbol(groupConfig, args.symbol));
    const connection = openConnection(config, groupConfig.cluster);
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    const mangoAccounts = yield client.getAllMangoAccounts(mangoGroup, [], false);
    const mangoCache = yield mangoGroup.loadCache(connection);
    mangoAccounts.sort((a, b) => b.perpAccounts[perpMarketConfig.marketIndex].basePosition
        .abs()
        .cmp(a.perpAccounts[perpMarketConfig.marketIndex].basePosition.abs()));
    for (let i = 0; i < 10; i++) {
        console.log(`${i}: ${mangoAccounts[i].toPrettyString(groupConfig, mangoGroup, mangoCache)}\n`);
    }
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('get-mango-account-by-oo <group> <oo_account_pk>', 'Print top 10 positions for the symbol perp market', (y) => {
    return y.positional(...groupDesc).option(...configDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('show-top-positions', args);
    const config = readConfig(args.config);
    const groupConfig = config.getGroupWithName(args.group);
    const connection = openConnection(config, groupConfig.cluster);
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    const mangoAccounts = yield client.getAllMangoAccounts(mangoGroup, [], false);
    const mangoAccount = mangoAccounts.find((ma) => ma.spotOpenOrders.find((x) => x.equals(new web3_js_1.PublicKey(args.oo_account_pk))));
    const mangoCache = yield mangoGroup.loadCache(connection);
    console.log(mangoAccount === null || mangoAccount === void 0 ? void 0 : mangoAccount.toPrettyString(groupConfig, mangoGroup, mangoCache));
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('show-top-spot-positions <group> <symbol> <deposits_or_borrows>', 'Print top 10 positions for the symbol perp market', (y) => {
    return y.positional(...groupDesc).option(...configDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('show-top-positions', args);
    const config = readConfig(args.config);
    const groupConfig = config.getGroupWithName(args.group);
    const marketIndex = utils_1.throwUndefined(config_2.getMarketIndexBySymbol(groupConfig, args.symbol));
    const connection = openConnection(config, groupConfig.cluster);
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    const mangoAccounts = yield client.getAllMangoAccounts(mangoGroup, [], false);
    mangoAccounts.sort((a, b) => b[args.deposits_or_borrows][marketIndex]
        .abs()
        .cmp(a[args.deposits_or_borrows][marketIndex].abs()));
    const mangoCache = yield mangoGroup.loadCache(connection);
    for (let i = 0; i < 10; i++) {
        console.log(`${i}: ${mangoAccounts[i].toPrettyString(groupConfig, mangoGroup, mangoCache)}\n`);
    }
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('show-perp-market <group> <symbol>', 'Print relevant details about a perp market', (y) => {
    return y
        .positional(...groupDesc)
        .positional('symbol', {
        describe: 'The ticker symbol of the perp market',
        type: 'string',
    })
        .option(...configDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('show-perp-market', args);
    const config = readConfig(args.config);
    const groupConfig = config.getGroupWithName(args.group);
    const perpMarketConfig = utils_1.throwUndefined(config_1.getPerpMarketByBaseSymbol(groupConfig, args.symbol));
    const connection = openConnection(config, groupConfig.cluster);
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    const perpMarket = yield client.getPerpMarket(perpMarketConfig.publicKey, perpMarketConfig.baseDecimals, perpMarketConfig.quoteDecimals);
    console.log(perpMarket.toPrettyString(mangoGroup, perpMarketConfig));
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('verify-token-gov <token_account> <owner>', 'Verify the owner of token_account is a governance PDA', (y) => {
    return y
        .positional('token_account', {
        describe: 'the public key of the MangoAccount',
        type: 'string',
    })
        .positional('owner', {
        describe: 'The owner of the token_account',
        type: 'string',
    })
        .option('program_id', {
        default: 'GqTPL6qRf5aUuqscLh8Rg2HTxPUXfhhAXDptTLhp1t2J',
        describe: 'Mango DAO program id',
        type: 'string',
    })
        .option('realm', {
        default: 'DPiH3H3c7t47BMxqTxLsuPQpEC6Kne8GA9VXbxpnZxFE',
        describe: 'Realm of this governance',
        type: 'string',
    });
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    const programId = new web3_js_1.PublicKey(args.program_id);
    const realm = new web3_js_1.PublicKey(args.realm);
    const tokenAccount = new web3_js_1.PublicKey(args.token_account);
    const owner = new web3_js_1.PublicKey(args.owner);
    const [address] = yield web3_js_1.PublicKey.findProgramAddress([
        Buffer.from('token-governance', 'utf-8'),
        realm.toBuffer(),
        tokenAccount.toBuffer(),
    ], programId);
    if (address.equals(owner)) {
        console.log(`Success. The token_account: ${tokenAccount.toBase58()} is owned by a governance PDA`);
    }
    else {
        console.log(`Failure`);
    }
    process.exit(0);
})).argv;
yargs_1.default(helpers_1.hideBin(process.argv)).command('change-perp-market-params <group> <symbol>', 'change params for a perp market', (y) => {
    return y
        .positional(...groupDesc)
        .positional(...symbolDesc)
        .option('maint_leverage', {
        type: 'number',
    })
        .option('init_leverage', {
        type: 'number',
    })
        .option('liquidation_fee', {
        type: 'number',
    })
        .option('maker_fee', {
        type: 'number',
    })
        .option('taker_fee', {
        type: 'number',
    })
        .option('rate', {
        type: 'number',
    })
        .option('max_depth_bps', {
        type: 'number',
    })
        .option('target_period_length', {
        type: 'number',
    })
        .option('mngo_per_period', {
        type: 'number',
    })
        .option('exp', {
        type: 'number',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('change-perp-market-params', args);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const groupConfig = config.getGroup(cluster, args.group);
    const symbol = args.symbol;
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    const perpMarketConfig = utils_1.throwUndefined(config_1.getPerpMarketByBaseSymbol(groupConfig, symbol));
    const perpMarket = yield client.getPerpMarket(perpMarketConfig.publicKey, perpMarketConfig.baseDecimals, perpMarketConfig.quoteDecimals);
    // console.log(perpMarket.liquidityMiningInfo.rate.toString());
    // console.log(perpMarket.liquidityMiningInfo.mngoPerPeriod.toString());
    // console.log(perpMarket.liquidityMiningInfo.mngoLeft.toString());
    // console.log(perpMarket.liquidityMiningInfo.periodStart.toString());
    // console.log(perpMarket.liquidityMiningInfo.targetPeriodLength.toString());
    let mngoPerPeriod = getNumberOrUndef(args, 'mngo_per_period');
    if (mngoPerPeriod !== undefined) {
        const token = config_1.getTokenBySymbol(groupConfig, 'MNGO');
        mngoPerPeriod = utils_1.uiToNative(mngoPerPeriod, token.decimals).toNumber();
    }
    const exp = getNumberOrUndef(args, 'exp');
    if (exp !== undefined && !Number.isInteger(exp)) {
        throw new Error('exp must be an integer');
    }
    yield client.changePerpMarketParams(mangoGroup, perpMarket, account, getNumberOrUndef(args, 'maint_leverage'), getNumberOrUndef(args, 'init_leverage'), getNumberOrUndef(args, 'liquidation_fee'), getNumberOrUndef(args, 'maker_fee'), getNumberOrUndef(args, 'taker_fee'), getNumberOrUndef(args, 'rate'), getNumberOrUndef(args, 'max_depth_bps'), getNumberOrUndef(args, 'target_period_length'), mngoPerPeriod, exp);
    // await sleep(2000);
    // perpMarket = await client.getPerpMarket(
    //   perpMarketConfig.publicKey,
    //   perpMarketConfig.baseDecimals,
    //   perpMarketConfig.quoteDecimals,
    // );
    // console.log(perpMarket.liquidityMiningInfo.rate.toString());
    // console.log(perpMarket.liquidityMiningInfo.mngoPerPeriod.toString());
    // console.log(perpMarket.liquidityMiningInfo.mngoLeft.toString());
    // console.log(perpMarket.liquidityMiningInfo.periodStart.toString());
    // console.log(perpMarket.liquidityMiningInfo.targetPeriodLength.toString());
    process.exit(0);
})).argv;
function getNumberOrUndef(args, k) {
    return args[k] === undefined ? undefined : args[k];
}
yargs_1.default(helpers_1.hideBin(process.argv)).command('set-admin <group> <admin_pk>', 'transfer admin permissions over group to another account', (y) => {
    return y
        .positional(...groupDesc)
        .positional('admin_pk', {
        describe: 'the public key of the new group admin',
        type: 'string',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('set-admin', args);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const groupConfig = config.getGroup(cluster, args.group);
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    yield client.setGroupAdmin(mangoGroup, new web3_js_1.PublicKey(args.admin_pk), account);
    process.exit(0);
})).argv;
// e.g. yarn cli set-delegate mainnet.1 <mango-account-pk> <delegate-pk> \
// --keypair ~/.config/solana/<mango-account-owner-keypair>.json \
// --config src/ids.json --cluster mainnet
yargs_1.default(helpers_1.hideBin(process.argv)).command('set-delegate <group> <mango_account> <delegate>', 'support setting a delegate as a signer for a mango account', (y) => {
    return y
        .positional(...groupDesc)
        .positional('mango_account', {
        describe: 'the public key of the mango account',
        type: 'string',
    })
        .positional('delegate_pk', {
        describe: 'the public key of the delegate',
        type: 'string',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('set-delegate', args);
    const account = readKeypair(args.keypair);
    const mangoAccountPk = new web3_js_1.PublicKey(args.mango_account);
    const delegatePk = new web3_js_1.PublicKey(args.delegate);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const groupConfig = config.getGroup(cluster, args.group);
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    const mangoAccount = yield client.getMangoAccount(mangoAccountPk, groupConfig.serumProgramId);
    yield client.setDelegate(mangoGroup, mangoAccount, account, delegatePk);
    process.exit(0);
})).argv;
// e.g. yarn cli change-spot-market-params devnet.3 MNGO \
// --keypair ~/.config/solana/mango-devnet-admin.json \
// --maint_leverage 2.5 --init_leverage 1.25 --liquidation_fee 0.2 \
// --cluster devnet
//
// to view change do, SYMBOL=MNGO CLUSTER=devnet GROUP=devnet.3 yarn \
// ts-node src/markets.ts
yargs_1.default(helpers_1.hideBin(process.argv)).command('change-spot-market-params <group> <symbol>', 'change params for a spot market', (y) => {
    return y
        .positional(...groupDesc)
        .positional(...symbolDesc)
        .option('maint_leverage', {
        type: 'number',
    })
        .option('init_leverage', {
        type: 'number',
    })
        .option('liquidation_fee', {
        type: 'number',
    })
        .option('optimal_util', {
        type: 'number',
    })
        .option('optimal_rate', {
        type: 'number',
    })
        .option('max_rate', {
        type: 'number',
    })
        .option(...clusterDesc)
        .option(...configDesc)
        .option(...keypairDesc);
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('change-spot-market-params', args);
    const account = readKeypair(args.keypair);
    const config = readConfig(args.config);
    const cluster = args.cluster;
    const connection = openConnection(config, cluster);
    const groupConfig = config.getGroup(cluster, args.group);
    const client = new client_1.MangoClient(connection, groupConfig.mangoProgramId);
    const symbol = args.symbol;
    const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
    const spotMarketConfig = utils_1.throwUndefined(config_1.getSpotMarketByBaseSymbol(groupConfig, symbol));
    const spotMarket = yield serum_1.Market.load(connection, spotMarketConfig.publicKey, undefined, groupConfig.serumProgramId);
    const rootBanks = yield mangoGroup.loadRootBanks(connection);
    const tokenBySymbol = config_1.getTokenBySymbol(groupConfig, symbol);
    const tokenIndex = mangoGroup.getTokenIndex(tokenBySymbol.mintKey);
    const rootBank = rootBanks[tokenIndex];
    if (!rootBank) {
        console.log('Root bank cannot be undefined!', args);
        process.exit(1);
    }
    yield client.changeSpotMarketParams(mangoGroup, spotMarket, rootBank, account, getNumberOrUndef(args, 'maint_leverage'), getNumberOrUndef(args, 'init_leverage'), getNumberOrUndef(args, 'liquidation_fee'), getNumberOrUndef(args, 'optimal_util'), getNumberOrUndef(args, 'optimal_rate'), getNumberOrUndef(args, 'max_rate'), 0);
    process.exit(0);
})).argv;
//# sourceMappingURL=index.js.map