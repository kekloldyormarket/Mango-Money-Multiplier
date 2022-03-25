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
const ids_json_1 = __importDefault(require("../ids.json"));
const web3_js_1 = require("@solana/web3.js");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const client_1 = require("../client");
const index_1 = require("../index");
const bn_js_1 = require("bn.js");
const interval = parseInt(process.env.INTERVAL || '10000');
const control = { isRunning: true, interval: interval };
function mm() {
    return __awaiter(this, void 0, void 0, function* () {
        // load mango group and clients
        const config = new config_1.Config(ids_json_1.default);
        const groupName = process.env.GROUP || 'mainnet.1';
        const mangoAccountName = process.env.MANGO_ACCOUNT_NAME;
        const groupIds = config.getGroupWithName(groupName);
        if (!groupIds) {
            throw new Error(`Group ${groupName} not found`);
        }
        const cluster = groupIds.cluster;
        const mangoProgramId = groupIds.mangoProgramId;
        const mangoGroupKey = groupIds.publicKey;
        const payer = new web3_js_1.Account(JSON.parse(fs_1.default.readFileSync(process.env.KEYPAIR || os_1.default.homedir() + '/.config/solana/id.json', 'utf-8')));
        console.log(`Payer: ${payer.publicKey.toBase58()}`);
        const connection = new web3_js_1.Connection(process.env.ENDPOINT_URL || config.cluster_urls[cluster], 'processed');
        const client = new client_1.MangoClient(connection, mangoProgramId);
        const mangoGroup = yield client.getMangoGroup(mangoGroupKey);
        const ownerAccounts = yield client.getMangoAccountsForOwner(mangoGroup, payer.publicKey, true);
        let mangoAccountPk;
        if (mangoAccountName) {
            for (const ownerAccount of ownerAccounts) {
                if (mangoAccountName === ownerAccount.name) {
                    mangoAccountPk = ownerAccount.publicKey;
                    break;
                }
            }
            if (!mangoAccountPk) {
                throw new Error('MANGO_ACCOUNT_NAME not found');
            }
        }
        else {
            const mangoAccountPkStr = process.env.MANGO_ACCOUNT_PUBKEY;
            if (!mangoAccountPkStr) {
                throw new Error('Please add env variable MANGO_ACCOUNT_PUBKEY or MANGO_ACCOUNT_NAME');
            }
            else {
                mangoAccountPk = new web3_js_1.PublicKey(mangoAccountPkStr);
            }
        }
        // TODO make it be able to quote all markets
        const marketName = process.env.MARKET;
        if (!marketName) {
            throw new Error('Please add env variable MARKET');
        }
        const perpMarketConfig = config_1.getPerpMarketByBaseSymbol(groupIds, marketName.toUpperCase());
        const marketIndex = perpMarketConfig.marketIndex;
        const perpMarket = yield client.getPerpMarket(perpMarketConfig.publicKey, perpMarketConfig.baseDecimals, perpMarketConfig.quoteDecimals);
        const sizePerc = parseFloat(process.env.SIZE_PERC || '0.1');
        const charge = parseFloat(process.env.CHARGE || '0.0010');
        const leanCoeff = parseFloat(process.env.LEAN_COEFF || '0.0005');
        const bias = parseFloat(process.env.BIAS || '0.0');
        const requoteThresh = parseFloat(process.env.REQUOTE_THRESH || '0.0');
        const takeSpammers = process.env.TAKE_SPAMMERS === 'true';
        const spammerCharge = parseFloat(process.env.SPAMMER_CHARGE || '2'); // multiplier on charge
        process.on('SIGINT', function () {
            console.log('Caught keyboard interrupt. Canceling orders');
            control.isRunning = false;
            onExit(client, payer, mangoProgramId, mangoGroup, perpMarket, mangoAccountPk);
        });
        while (control.isRunning) {
            try {
                // get fresh data
                // get orderbooks, get perp markets, caches
                // TODO load pyth oracle itself for most accurate prices
                const [bids, asks, mangoCache, mangoAccount] = yield Promise.all([
                    perpMarket.loadBids(connection),
                    perpMarket.loadAsks(connection),
                    mangoGroup.loadCache(connection),
                    client.getMangoAccount(mangoAccountPk, mangoGroup.dexProgramId),
                ]);
                // TODO store the prices in an array to calculate volatility
                // Model logic
                const fairValue = mangoGroup.getPrice(marketIndex, mangoCache).toNumber();
                const equity = mangoAccount
                    .computeValue(mangoGroup, mangoCache)
                    .toNumber();
                const perpAccount = mangoAccount.perpAccounts[marketIndex];
                // TODO look at event queue as well for unprocessed fills
                const basePos = perpAccount.getBasePositionUi(perpMarket);
                // TODO volatility adjustment
                const size = (equity * sizePerc) / fairValue;
                const lean = (-leanCoeff * basePos) / size;
                const bidPrice = fairValue * (1 - charge + lean + bias);
                const askPrice = fairValue * (1 + charge + lean + bias);
                const [modelBidPrice, nativeBidSize] = perpMarket.uiToNativePriceQuantity(bidPrice, size);
                const [modelAskPrice, nativeAskSize] = perpMarket.uiToNativePriceQuantity(askPrice, size);
                const bestBid = bids.getBest();
                const bestAsk = asks.getBest();
                const bookAdjBid = bestAsk !== undefined
                    ? bn_js_1.BN.min(bestAsk.priceLots.sub(index_1.ONE_BN), modelBidPrice)
                    : modelBidPrice;
                const bookAdjAsk = bestBid !== undefined
                    ? bn_js_1.BN.max(bestBid.priceLots.add(index_1.ONE_BN), modelAskPrice)
                    : modelAskPrice;
                // TODO use order book to requote if size has changed
                const openOrders = mangoAccount
                    .getPerpOpenOrders()
                    .filter((o) => o.marketIndex === marketIndex);
                let moveOrders = openOrders.length === 0 || openOrders.length > 2;
                for (const o of openOrders) {
                    console.log(`${o.side} ${o.price.toString()} -> ${o.side === 'buy' ? bookAdjBid.toString() : bookAdjAsk.toString()}`);
                    if (o.side === 'buy') {
                        if (Math.abs(o.price.toNumber() / bookAdjBid.toNumber() - 1) >
                            requoteThresh) {
                            moveOrders = true;
                        }
                    }
                    else {
                        if (Math.abs(o.price.toNumber() / bookAdjAsk.toNumber() - 1) >
                            requoteThresh) {
                            moveOrders = true;
                        }
                    }
                }
                // Start building the transaction
                const tx = new web3_js_1.Transaction();
                /*
                Clear 1 lot size orders at the top of book that bad people use to manipulate the price
                 */
                if (takeSpammers &&
                    bestBid !== undefined &&
                    bestBid.sizeLots.eq(index_1.ONE_BN) &&
                    bestBid.priceLots.toNumber() / modelAskPrice.toNumber() - 1 >
                        spammerCharge * charge + 0.0005) {
                    console.log(`${marketName}-PERP taking best bid spammer`);
                    const takerSell = index_1.makePlacePerpOrderInstruction(mangoProgramId, mangoGroup.publicKey, mangoAccount.publicKey, payer.publicKey, mangoCache.publicKey, perpMarket.publicKey, perpMarket.bids, perpMarket.asks, perpMarket.eventQueue, mangoAccount.getOpenOrdersKeysInBasket(), bestBid.priceLots, index_1.ONE_BN, new bn_js_1.BN(Date.now()), 'sell', 'ioc');
                    tx.add(takerSell);
                }
                else if (takeSpammers &&
                    bestAsk !== undefined &&
                    bestAsk.sizeLots.eq(index_1.ONE_BN) &&
                    modelBidPrice.toNumber() / bestAsk.priceLots.toNumber() - 1 >
                        spammerCharge * charge + 0.0005) {
                    console.log(`${marketName}-PERP taking best ask spammer`);
                    const takerBuy = index_1.makePlacePerpOrderInstruction(mangoProgramId, mangoGroup.publicKey, mangoAccount.publicKey, payer.publicKey, mangoCache.publicKey, perpMarket.publicKey, perpMarket.bids, perpMarket.asks, perpMarket.eventQueue, mangoAccount.getOpenOrdersKeysInBasket(), bestAsk.priceLots, index_1.ONE_BN, new bn_js_1.BN(Date.now()), 'buy', 'ioc');
                    tx.add(takerBuy);
                }
                if (moveOrders) {
                    // cancel all, requote
                    const cancelAllInstr = index_1.makeCancelAllPerpOrdersInstruction(mangoProgramId, mangoGroup.publicKey, mangoAccount.publicKey, payer.publicKey, perpMarket.publicKey, perpMarket.bids, perpMarket.asks, new bn_js_1.BN(20));
                    const placeBidInstr = index_1.makePlacePerpOrderInstruction(mangoProgramId, mangoGroup.publicKey, mangoAccount.publicKey, payer.publicKey, mangoCache.publicKey, perpMarket.publicKey, perpMarket.bids, perpMarket.asks, perpMarket.eventQueue, mangoAccount.getOpenOrdersKeysInBasket(), bookAdjBid, nativeBidSize, new bn_js_1.BN(Date.now()), 'buy', 'postOnlySlide');
                    const placeAskInstr = index_1.makePlacePerpOrderInstruction(mangoProgramId, mangoGroup.publicKey, mangoAccount.publicKey, payer.publicKey, mangoCache.publicKey, perpMarket.publicKey, perpMarket.bids, perpMarket.asks, perpMarket.eventQueue, mangoAccount.getOpenOrdersKeysInBasket(), bookAdjAsk, nativeAskSize, new bn_js_1.BN(Date.now()), 'sell', 'postOnlySlide');
                    tx.add(cancelAllInstr);
                    tx.add(placeBidInstr);
                    tx.add(placeAskInstr);
                }
                else {
                    console.log(`${marketName}-PERP Not requoting. No need to move orders`);
                }
                if (tx.instructions.length > 0) {
                    const txid = yield client.sendTransaction(tx, payer, []);
                    console.log(`${marketName}-PERP adjustment success: ${txid.toString()}`);
                }
            }
            catch (e) {
                // sleep for some time and retry
                console.log(e);
            }
            finally {
                console.log(`sleeping for ${interval / 1000}s`);
                yield index_1.sleep(interval);
            }
        }
    });
}
function onExit(client, payer, mangoProgramId, mangoGroup, perpMarket, mangoAccountPk) {
    return __awaiter(this, void 0, void 0, function* () {
        yield index_1.sleep(control.interval);
        const mangoAccount = yield client.getMangoAccount(mangoAccountPk, mangoGroup.dexProgramId);
        const cancelAllInstr = index_1.makeCancelAllPerpOrdersInstruction(mangoProgramId, mangoGroup.publicKey, mangoAccount.publicKey, payer.publicKey, perpMarket.publicKey, perpMarket.bids, perpMarket.asks, new bn_js_1.BN(20));
        const tx = new web3_js_1.Transaction();
        tx.add(cancelAllInstr);
        const txid = yield client.sendTransaction(tx, payer, []);
        console.log(`cancel successful: ${txid.toString()}`);
        process.exit();
    });
}
function startMarketMaker() {
    if (control.isRunning) {
        mm().finally(startMarketMaker);
    }
}
process.on('unhandledRejection', function (err, promise) {
    console.error('Unhandled rejection (promise: ', promise, ', reason: ', err, ').');
});
startMarketMaker();
//# sourceMappingURL=mm.js.map