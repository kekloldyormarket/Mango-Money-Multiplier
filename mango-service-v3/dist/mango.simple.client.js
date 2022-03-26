"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mango_client_1 = require("@blockworks-foundation/mango-client");
const serum_1 = require("@project-serum/serum");
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const os_1 = __importDefault(require("os"));
const utils_1 = require("./utils");
class MangoSimpleClient {
    constructor(connection, client, mangoGroupConfig, mangoGroup, owner, mangoAccount, lenAccs) {
        this.connection = connection;
        this.client = client;
        this.mangoGroupConfig = mangoGroupConfig;
        this.mangoGroup = mangoGroup;
        this.owner = owner;
        this.mangoAccount = mangoAccount;
        this.lenAccs = lenAccs;
        // refresh things which might get stale over time
        setInterval(this.refresh, 3600000, connection, mangoGroupConfig, mangoAccount);
    }
    static async create() {
        let sortedMangoAccounts;
        const groupName = process.env.GROUP_NAME || "mainnet.1";
        const clusterUrl = process.env.CLUSTER_URL || "https://solana--mainnet.datahub.figment.io/apikey/24c64e276fc5db6ff73da2f59bac40f2";
        utils_1.logger.info(`Creating mango client for ${groupName} using ${clusterUrl}`);
        const mangoGroupConfig = mango_client_1.Config.ids().groups.filter((group) => group.name === groupName)[0];
        const connection = new web3_js_1.Connection(clusterUrl, "processed");
        const mangoClient = new mango_client_1.MangoClient(connection, mangoGroupConfig.mangoProgramId);
        utils_1.logger.info(`- fetching mango group`);
        const mangoGroup = await mangoClient.getMangoGroup(mangoGroupConfig.publicKey);
        utils_1.logger.info(`- loading root banks`);
        await mangoGroup.loadRootBanks(connection);
        utils_1.logger.info(`- loading cache`);
        await mangoGroup.loadCache(connection);
        const privateKeyPath = process.env.PRIVATE_KEY_PATH || os_1.default.homedir() + "/.config/solana/id.json";
        utils_1.logger.info(`- loading private key at location ${privateKeyPath}`);
        const owner = new web3_js_1.Account(JSON.parse(fs_1.default.readFileSync(privateKeyPath, "utf-8")));
        let mangoAccount;
        if (process.env.MANGO_ACCOUNT) {
            utils_1.logger.info(`- MANGO_ACCOUNT explicitly specified, fetching mango account ${process.env.MANGO_ACCOUNT}`);
            mangoAccount = await mangoClient.getMangoAccount(new web3_js_1.PublicKey(process.env.MANGO_ACCOUNT), mangoGroupConfig.serumProgramId);
        }
        else {
            utils_1.logger.info(`- fetching mango accounts for ${owner.publicKey.toBase58()}`);
            let mangoAccounts;
            try {
                mangoAccounts = await mangoClient.getMangoAccountsForOwner(mangoGroup, owner.publicKey);
            }
            catch (error) {
                utils_1.logger.error(`- error retrieving mango accounts for ${owner.publicKey.toBase58()}`);
                process.exit(1);
            }
            if (!mangoAccounts.length) {
                utils_1.logger.error(`- no mango account found ${owner.publicKey.toBase58()}`);
                process.exit(1);
            }
            sortedMangoAccounts = mangoAccounts
                .slice()
                .sort((a, b) => a.publicKey.toBase58() > b.publicKey.toBase58() ? 1 : -1);
            // just select first arbitrarily
            mangoAccount = sortedMangoAccounts[Math.floor(Math.random() * sortedMangoAccounts.length + 1)];
            const debugAccounts = sortedMangoAccounts
                .map((mangoAccount) => mangoAccount.publicKey.toBase58())
                .join(", ");
            utils_1.logger.info(`- found mango accounts ${debugAccounts}, using ${mangoAccount.publicKey.toBase58()}`);
        }
        if (mangoAccount.owner.toBase58() !== owner.publicKey.toBase58()) {
            utils_1.logger.info(`- Note: ${owner.publicKey.toBase58()} is a delegate for ${mangoAccount.publicKey.toBase58()}`);
        }
        // load open orders accounts, used by e.g. getSpotOpenOrdersAccountForMarket
        await mangoAccount.loadOpenOrders(connection, new web3_js_1.PublicKey(mangoGroupConfig.serumProgramId));
        return new MangoSimpleClient(connection, mangoClient, mangoGroupConfig, mangoGroup, owner, mangoAccount, sortedMangoAccounts.length);
    }
    /// public
    async fetchAllMarkets(marketName) {
        let allMarketConfigs = (0, mango_client_1.getAllMarkets)(this.mangoGroupConfig);
        let allMarketPks = allMarketConfigs.map((m) => m.publicKey);
        if (marketName !== undefined) {
            allMarketConfigs = allMarketConfigs.filter((marketConfig) => marketConfig.name === marketName);
            allMarketPks = allMarketConfigs.map((m) => m.publicKey);
        }
        const allMarketAccountInfos = await (0, mango_client_1.getMultipleAccounts)(this.connection, allMarketPks);
        const allMarketAccounts = allMarketConfigs.map((config, i) => {
            if (config.kind === "spot") {
                const decoded = serum_1.Market.getLayout(this.mangoGroupConfig.mangoProgramId).decode(allMarketAccountInfos[i].accountInfo.data);
                return new serum_1.Market(decoded, config.baseDecimals, config.quoteDecimals, undefined, this.mangoGroupConfig.serumProgramId);
            }
            if (config.kind === "perp") {
                const decoded = mango_client_1.PerpMarketLayout.decode(allMarketAccountInfos[i].accountInfo.data);
                return new mango_client_1.PerpMarket(config.publicKey, config.baseDecimals, config.quoteDecimals, decoded);
            }
        });
        return (0, utils_1.zipDict)(allMarketPks.map((pk) => pk.toBase58()), allMarketAccounts);
    }
    async fetchAllBidsAndAsks(filterForMangoAccount = false, marketName) {
        this.mangoAccount.loadOpenOrders(this.connection, new web3_js_1.PublicKey(this.mangoGroupConfig.serumProgramId));
        let allMarketConfigs = (0, mango_client_1.getAllMarkets)(this.mangoGroupConfig);
        let allMarketPks = allMarketConfigs.map((m) => m.publicKey);
        if (marketName !== undefined) {
            allMarketConfigs = allMarketConfigs.filter((marketConfig) => marketConfig.name === marketName);
            allMarketPks = allMarketConfigs.map((m) => m.publicKey);
        }
        const allBidsAndAsksPks = allMarketConfigs
            .map((m) => [m.bidsKey, m.asksKey])
            .flat();
        const allBidsAndAsksAccountInfos = await (0, mango_client_1.getMultipleAccounts)(this.connection, allBidsAndAsksPks);
        const accountInfos = {};
        allBidsAndAsksAccountInfos.forEach(({ publicKey, context, accountInfo }) => {
            accountInfos[publicKey.toBase58()] = accountInfo;
        });
        const markets = await this.fetchAllMarkets(marketName);
        return Object.entries(markets).map(([address, market]) => {
            const marketConfig = (0, mango_client_1.getMarketByPublicKey)(this.mangoGroupConfig, address);
            if (market instanceof serum_1.Market) {
                return this.parseSpotOrders(market, marketConfig, accountInfos, filterForMangoAccount ? this.mangoAccount : undefined);
            }
            else if (market instanceof mango_client_1.PerpMarket) {
                return this.parsePerpOpenOrders(market, marketConfig, accountInfos, filterForMangoAccount ? this.mangoAccount : undefined);
            }
        });
    }
    getSpotOpenOrdersAccount(marketConfig) {
        const spotOpenOrdersAccount = this.mangoAccount.spotOpenOrdersAccounts[marketConfig.marketIndex];
        return spotOpenOrdersAccount ? spotOpenOrdersAccount.publicKey : null;
    }
    async fetchAllSpotFills() {
        const allMarketConfigs = (0, mango_client_1.getAllMarkets)(this.mangoGroupConfig);
        const allMarkets = await this.fetchAllMarkets();
        // merge
        // 1. latest fills from on-chain
        let allRecentMangoAccountSpotFills = [];
        // 2. historic from off-chain REST service
        let allButRecentMangoAccountSpotFills = [];
        for (const config of allMarketConfigs) {
            if (config.kind === "spot") {
                const openOrdersAccount = this.mangoAccount.spotOpenOrdersAccounts[config.marketIndex];
                if (openOrdersAccount === undefined) {
                    continue;
                }
                const response = await (0, node_fetch_1.default)(`https://event-history-api.herokuapp.com/trades/open_orders/${openOrdersAccount.publicKey.toBase58()}`);
                const responseJson = await response.json();
                allButRecentMangoAccountSpotFills =
                    allButRecentMangoAccountSpotFills.concat(responseJson?.data ? responseJson.data : []);
                const recentMangoAccountSpotFills = await allMarkets[config.publicKey.toBase58()]
                    .loadFills(this.connection, 10000)
                    .then((fills) => {
                    fills = fills.filter((fill) => {
                        return openOrdersAccount?.publicKey
                            ? fill.openOrders.equals(openOrdersAccount?.publicKey)
                            : false;
                    });
                    return fills.map((fill) => ({ ...fill, marketName: config.name }));
                });
                allRecentMangoAccountSpotFills = allRecentMangoAccountSpotFills.concat(recentMangoAccountSpotFills);
            }
        }
        const newMangoAccountSpotFills = allRecentMangoAccountSpotFills.filter((fill) => !allButRecentMangoAccountSpotFills.flat().find((t) => {
            if (t.orderId) {
                return t.orderId === fill.orderId?.toString();
            }
            else {
                return t.seqNum === fill.seqNum?.toString();
            }
        }));
        return [...newMangoAccountSpotFills, ...allButRecentMangoAccountSpotFills];
    }
    async fetchAllPerpFills() {
        const allMarketConfigs = (0, mango_client_1.getAllMarkets)(this.mangoGroupConfig);
        const allMarkets = await this.fetchAllMarkets();
        // merge
        // 1. latest fills from on-chain
        let allRecentMangoAccountPerpFills = [];
        // 2. historic from off-chain REST service
        const response = await (0, node_fetch_1.default)(`https://event-history-api.herokuapp.com/perp_trades/${this.mangoAccount.publicKey.toBase58()}`);
        const responseJson = await response.json();
        const allButRecentMangoAccountPerpFills = responseJson?.data || [];
        for (const config of allMarketConfigs) {
            if (config.kind === "perp") {
                const recentMangoAccountPerpFills = await allMarkets[config.publicKey.toBase58()]
                    .loadFills(this.connection)
                    .then((fills) => {
                    fills = fills.filter((fill) => fill.taker.equals(this.mangoAccount.publicKey) ||
                        fill.maker.equals(this.mangoAccount.publicKey));
                    return fills.map((fill) => ({ ...fill, marketName: config.name }));
                });
                allRecentMangoAccountPerpFills = allRecentMangoAccountPerpFills.concat(recentMangoAccountPerpFills);
            }
        }
        const newMangoAccountPerpFills = allRecentMangoAccountPerpFills.filter((fill) => !allButRecentMangoAccountPerpFills.flat().find((t) => {
            if (t.orderId) {
                return t.orderId === fill.orderId?.toString();
            }
            else {
                return t.seqNum === fill.seqNum?.toString();
            }
        }));
        return [...newMangoAccountPerpFills, ...allButRecentMangoAccountPerpFills];
    }
    async placeOrder(market, side, quantity, price, orderType = "limit", clientOrderId) {
        if (market.includes("PERP")) {
            const perpMarketConfig = (0, mango_client_1.getMarketByBaseSymbolAndKind)(this.mangoGroupConfig, market.split("-")[0], "perp");
            const perpMarket = await this.mangoGroup.loadPerpMarket(this.connection, perpMarketConfig.marketIndex, perpMarketConfig.baseDecimals, perpMarketConfig.quoteDecimals);
            // TODO: this is a workaround, mango-v3 has a assertion for price>0 for all order types
            // this will be removed soon hopefully
            price = orderType !== "market" ? price : 1;
            return await this.client.placePerpOrder(this.mangoGroup, this.mangoAccount, this.mangoGroup.mangoCache, perpMarket, this.owner, side, price, quantity, orderType, clientOrderId);
        }
        else {
            // serum doesn't really support market orders, calculate a pseudo market price
            price =
                orderType !== "market"
                    ? price
                    : await this.calculateMarketOrderPrice(market, quantity, side);
            const spotMarketConfig = (0, mango_client_1.getMarketByBaseSymbolAndKind)(this.mangoGroupConfig, market.split("/")[0], "spot");
            const spotMarket = await serum_1.Market.load(this.connection, spotMarketConfig.publicKey, undefined, this.mangoGroupConfig.serumProgramId);
            return await this.client.placeSpotOrder(this.mangoGroup, this.mangoAccount, this.mangoGroup.mangoCache, spotMarket, this.owner, side, price, quantity, orderType === "market" ? "limit" : orderType, new bn_js_1.default(clientOrderId));
        }
    }
    async calculateMarketOrderPrice(market, quantity, side) {
        const bidsAndAsks = await this.fetchAllBidsAndAsks(false, market);
        const bids = bidsAndAsks
            .flat()
            .filter((orderInfo) => orderInfo.order.side === "buy")
            .sort((b1, b2) => b2.order.price - b1.order.price);
        const asks = bidsAndAsks
            .flat()
            .filter((orderInfo) => orderInfo.order.side === "sell")
            .sort((a1, a2) => a1.order.price - a2.order.price);
        const orders = side === "buy" ? asks : bids;
        let acc = 0;
        let selectedOrder;
        for (const order of orders) {
            acc += order.order.size;
            if (acc >= quantity) {
                selectedOrder = order;
                break;
            }
        }
        if (!selectedOrder) {
            throw new Error("Orderbook empty!");
        }
        if (side === "buy") {
            return selectedOrder.order.price * 1.05;
        }
        else {
            return selectedOrder.order.price * 0.95;
        }
    }
    async cancelAllOrders() {
        const allMarkets = await this.fetchAllMarkets();
        const orders = (await this.fetchAllBidsAndAsks(true)).flat();
        const transactions = await Promise.all(orders.map((orderInfo) => this.buildCancelOrderTransaction(orderInfo, allMarkets[orderInfo.market.account.publicKey.toBase58()])));
        let i;
        const j = transactions.length;
        // assuming we can fit 10 cancel order transactions in a solana transaction
        // we could switch to computing actual transactionSize every time we add an
        // instruction and use a dynamic chunk size
        const chunk = 10;
        const transactionsToSend = [];
        for (i = 0; i < j; i += chunk) {
            const transactionsChunk = transactions.slice(i, i + chunk);
            const transactionToSend = new web3_js_1.Transaction();
            for (const transaction of transactionsChunk) {
                for (const instruction of transaction.instructions) {
                    transactionToSend.add(instruction);
                }
            }
            transactionsToSend.push(transactionToSend);
        }
        for (const transaction of transactionsToSend) {
            await this.client.sendTransaction(transaction, this.owner, []);
        }
    }
    async cancelOrder(orderInfo, market) {
        if (orderInfo.market.config.kind === "perp") {
            const perpMarketConfig = (0, mango_client_1.getMarketByBaseSymbolAndKind)(this.mangoGroupConfig, orderInfo.market.config.baseSymbol, "perp");
            if (market === undefined) {
                market = await this.mangoGroup.loadPerpMarket(this.connection, perpMarketConfig.marketIndex, perpMarketConfig.baseDecimals, perpMarketConfig.quoteDecimals);
            }
            return await this.client.cancelPerpOrder(this.mangoGroup, this.mangoAccount, this.owner, market, orderInfo.order);
        }
        else {
            const spotMarketConfig = (0, mango_client_1.getMarketByBaseSymbolAndKind)(this.mangoGroupConfig, orderInfo.market.config.baseSymbol, "spot");
            if (market === undefined) {
                market = await serum_1.Market.load(this.connection, spotMarketConfig.publicKey, undefined, this.mangoGroupConfig.serumProgramId);
            }
            return await this.client.cancelSpotOrder(this.mangoGroup, this.mangoAccount, this.owner, market, orderInfo.order);
        }
    }
    async buildCancelOrderTransaction(orderInfo, market) {
        if (orderInfo.market.config.kind === "perp") {
            const perpMarketConfig = (0, mango_client_1.getMarketByBaseSymbolAndKind)(this.mangoGroupConfig, orderInfo.market.config.baseSymbol, "perp");
            if (market === undefined) {
                market = await this.mangoGroup.loadPerpMarket(this.connection, perpMarketConfig.marketIndex, perpMarketConfig.baseDecimals, perpMarketConfig.quoteDecimals);
            }
            return this.buildCancelPerpOrderInstruction(this.mangoGroup, this.mangoAccount, this.owner, market, orderInfo.order);
        }
        else {
            const spotMarketConfig = (0, mango_client_1.getMarketByBaseSymbolAndKind)(this.mangoGroupConfig, orderInfo.market.config.baseSymbol, "spot");
            if (market === undefined) {
                market = await serum_1.Market.load(this.connection, spotMarketConfig.publicKey, undefined, this.mangoGroupConfig.serumProgramId);
            }
            return this.buildCancelSpotOrderTransaction(this.mangoGroup, this.mangoAccount, this.owner, market, orderInfo.order);
        }
    }
    async getOrderByOrderId(orderId) {
        const orders = (await this.fetchAllBidsAndAsks(true)).flat();
        const orderInfos = orders.filter((orderInfo) => orderInfo.order.orderId.toString() === orderId);
        return orderInfos;
    }
    async getOrderByClientId(clientId) {
        const orders = await (await this.fetchAllBidsAndAsks(true)).flat();
        const orderInfos = orders.filter((orderInfo) => orderInfo.order.clientId.toNumber().toString() === clientId);
        return orderInfos;
    }
    async withdraw(tokenSymbol, amount) {
        const tokenToWithdraw = (0, mango_client_1.getTokenBySymbol)(this.mangoGroupConfig, tokenSymbol);
        const tokenIndex = this.mangoGroup.getTokenIndex(tokenToWithdraw.mintKey);
        return this.client.withdraw(this.mangoGroup, this.mangoAccount, this.owner, this.mangoGroup.tokens[tokenIndex].rootBank, this.mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0]
            .publicKey, this.mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].vault, Number(amount), false);
    }
    /// private
    parseSpotOrders(market, config, accountInfos, mangoAccount) {
        const bidData = accountInfos[market["_decoded"].bids.toBase58()]?.data;
        const askData = accountInfos[market["_decoded"].asks.toBase58()]?.data;
        const bidOrderBook = market && bidData ? serum_1.Orderbook.decode(market, bidData) : [];
        const askOrderBook = market && askData ? serum_1.Orderbook.decode(market, askData) : [];
        let openOrdersForMarket = [...bidOrderBook, ...askOrderBook];
        if (mangoAccount !== undefined) {
            const openOrders = mangoAccount.spotOpenOrdersAccounts[config.marketIndex];
            if (!openOrders)
                return [];
            openOrdersForMarket = openOrdersForMarket.filter((o) => o.openOrdersAddress.equals(openOrders.address));
        }
        return openOrdersForMarket.map((order) => ({
            order,
            market: { account: market, config },
        }));
    }
    parsePerpOpenOrders(market, config, accountInfos, mangoAccount) {
        const bidData = accountInfos[market.bids.toBase58()]?.data;
        const askData = accountInfos[market.asks.toBase58()]?.data;
        const bidOrderBook = market && bidData
            ? new mango_client_1.BookSide(market.bids, market, mango_client_1.BookSideLayout.decode(bidData))
            : [];
        const askOrderBook = market && askData
            ? new mango_client_1.BookSide(market.asks, market, mango_client_1.BookSideLayout.decode(askData))
            : [];
        let openOrdersForMarket = [...bidOrderBook, ...askOrderBook];
        if (mangoAccount !== undefined) {
            openOrdersForMarket = openOrdersForMarket.filter((o) => o.owner.equals(mangoAccount.publicKey));
        }
        return openOrdersForMarket.map((order) => ({
            order,
            market: { account: market, config },
        }));
    }
    buildCancelPerpOrderInstruction(mangoGroup, mangoAccount, owner, perpMarket, order, invalidIdOk = false // Don't throw error if order is invalid
    ) {
        const instruction = (0, mango_client_1.makeCancelPerpOrderInstruction)(this.mangoGroupConfig.mangoProgramId, mangoGroup.publicKey, mangoAccount.publicKey, owner.publicKey, perpMarket.publicKey, perpMarket.bids, perpMarket.asks, order, invalidIdOk);
        const transaction = new web3_js_1.Transaction();
        transaction.add(instruction);
        return transaction;
    }
    async buildCancelSpotOrderTransaction(mangoGroup, mangoAccount, owner, spotMarket, order) {
        const transaction = new web3_js_1.Transaction();
        const instruction = (0, mango_client_1.makeCancelSpotOrderInstruction)(this.mangoGroupConfig.mangoProgramId, mangoGroup.publicKey, owner.publicKey, mangoAccount.publicKey, spotMarket.programId, spotMarket.publicKey, spotMarket["_decoded"].bids, spotMarket["_decoded"].asks, order.openOrdersAddress, mangoGroup.signerKey, spotMarket["_decoded"].eventQueue, order);
        transaction.add(instruction);
        const dexSigner = await web3_js_1.PublicKey.createProgramAddress([
            spotMarket.publicKey.toBuffer(),
            spotMarket["_decoded"].vaultSignerNonce.toArrayLike(Buffer, "le", 8),
        ], spotMarket.programId);
        const marketIndex = mangoGroup.getSpotMarketIndex(spotMarket.publicKey);
        if (!mangoGroup.rootBankAccounts.length) {
            await mangoGroup.loadRootBanks(this.connection);
        }
        const baseRootBank = mangoGroup.rootBankAccounts[marketIndex];
        const quoteRootBank = mangoGroup.rootBankAccounts[mango_client_1.QUOTE_INDEX];
        const baseNodeBank = baseRootBank?.nodeBankAccounts[0];
        const quoteNodeBank = quoteRootBank?.nodeBankAccounts[0];
        if (!baseNodeBank || !quoteNodeBank) {
            throw new Error("Invalid or missing node banks");
        }
        // todo what is a makeSettleFundsInstruction?
        const settleFundsInstruction = (0, mango_client_1.makeSettleFundsInstruction)(this.mangoGroupConfig.mangoProgramId, mangoGroup.publicKey, mangoGroup.mangoCache, owner.publicKey, mangoAccount.publicKey, spotMarket.programId, spotMarket.publicKey, mangoAccount.spotOpenOrders[marketIndex], mangoGroup.signerKey, spotMarket["_decoded"].baseVault, spotMarket["_decoded"].quoteVault, mangoGroup.tokens[marketIndex].rootBank, baseNodeBank.publicKey, mangoGroup.tokens[mango_client_1.QUOTE_INDEX].rootBank, quoteNodeBank.publicKey, baseNodeBank.vault, quoteNodeBank.vault, dexSigner);
        transaction.add(settleFundsInstruction);
        return transaction;
    }
    refresh(connection, mangoGroupConfig, mangoAccount) {
        mangoAccount.loadOpenOrders(connection, mangoGroupConfig.serumProgramId);
    }
}
exports.default = MangoSimpleClient;
//# sourceMappingURL=mango.simple.client.js.map