"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const express_1 = require("express");
const src_1 = require("../src");
const web3_js_1 = require("@solana/web3.js");
const ids_json_1 = __importDefault(require("../src/ids.json"));
function readKeypair() {
    return JSON.parse(process.env.KEYPAIR ||
        fs.readFileSync(os.homedir() + '/.config/solana/id.json', 'utf-8'));
}
let ppp;
class FundingController {
    constructor() {
        this.path = "/";
        this.router = (0, express_1.Router)();
        this.doing = false;
        this.rates = { 'arr': [], 't': 0, 'avg': 0, 'wants': {}, 'mids': {} };
        this.examplePerp = (request, response, next) => __awaiter(this, void 0, void 0, function* () {
            if (true) {
                try {
                    response.send({ success: true, result: this.rates });
                    /*
                    // L2 orderbook data
                    for (const [price, size] of bids.getL2(20)) {
                      console.log(price, size);
                    }
                  
                    // L3 orderbook data
                    for (const order of asks) {
                      console.log(
                        order.owner.toBase58(),
                        order.orderId.toString('hex'),
                        order.price,
                        order.size,
                        order.side, // 'buy' or 'sell'
                      );
                    }
                  
                    // Place order
                    const owner = new Account(readKeypair());
                    const mangoAccount = (
                      await client.getMangoAccountsForOwner(mangoGroup, owner.publicKey)
                    )[0];
                    
                    // Place an order that is guaranteed to go on the book and let it auto expire in 5 seconds
                    await client.placePerpOrder2(
                      mangoGroup,
                      mangoAccount,
                      perpMarket,
                      owner,
                      'buy', // or 'sell'
                      39000,
                      0.0001,
                      { orderType: 'postOnlySlide',   : getUnixTs() + 5 },
                    ); // or 'ioc' or 'postOnly'
                  
                    // retrieve open orders for account
                    const openOrders = await perpMarket.loadOrdersForAccount(
                      connection,
                      mangoAccount,
                    );
                  
                    // cancel orders
                    for (const order of openOrders) {
                      await client.cancelPerpOrder(
                        mangoGroup,
                        mangoAccount,
                        owner,
                        perpMarket,
                        order,
                      );
                    }
                  
                    // Retrieve fills
                    for (const fill of await perpMarket.loadFills(connection)) {
                      console.log(
                        fill.maker.toBase58(),
                        fill.taker.toBase58(),
                        fill.price,
                        fill.quantity,
                      );
                    }
                    */
                }
                catch (err) {
                    console.log(err);
                    response.send({ success: false, result: {} });
                }
            }
        });
        this.initializeRoutes();
    }
    checkRates() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.doing) {
                this.doing = true;
                // setup client
                const config = new src_1.Config(ids_json_1.default);
                const groupConfig = config.getGroupWithName('mainnet.1');
                //console.log(groupConfig)
                console.log(config.cluster_urls[groupConfig.cluster]);
                const connection = new web3_js_1.Connection(config.cluster_urls[groupConfig.cluster], 'processed');
                const client = new src_1.MangoClient(connection, groupConfig.mangoProgramId);
                const markets = ["BTC", "SOL", "SRM", "RAY", "FTT", "ADA", "BNB", "AVAX", "LUNA"];
                // load group & market
                const mangoGroup = yield client.getMangoGroup(groupConfig.publicKey);
                if (true) {
                    try {
                        const cache = yield mangoGroup.loadCache(connection);
                        //  ppp = (mangoAccount.computeValue(mangoGroup, cache).toNumber() * 4).toFixed(4) 
                        // console.log('purchasing power @4x (breathing room 1x): ' + ppp)
                        let rates = { 'arr': [], 't': 0, 'avg': 0, 'wants': {}, 'mids': {} };
                        for (const m in markets) {
                            try {
                                const perpMarketConfig = (0, src_1.getMarketByBaseSymbolAndKind)(groupConfig, markets[m], 'perp');
                                const perpMarket = yield mangoGroup.loadPerpMarket(connection, perpMarketConfig.marketIndex, perpMarketConfig.baseDecimals, perpMarketConfig.quoteDecimals);
                                // Fetch orderbooks
                                const bids = yield perpMarket.loadBids(connection);
                                const asks = yield perpMarket.loadAsks(connection);
                                let bb, ba;
                                for (const [price, size] of bids.getL2(1)) {
                                    //  console.log(price, size);
                                    bb = price;
                                }
                                for (const [price, size] of asks.getL2(1)) {
                                    console.log(price, size);
                                    ba = price;
                                }
                                let mid = (bb + ba) / 2;
                                if (isNaN(mid)) {
                                    mid = 0;
                                }
                                rates.mids[markets[m] + '-PERP'] = mid;
                                console.log(markets[m] + ' midprice: ' + mid.toString());
                                let rate = (yield perpMarket.getCurrentFundingRate(mangoGroup, cache, perpMarketConfig.marketIndex, bids, asks)) * 24 * 365 * 100 * 2;
                                if (!isNaN(rate)) { //Math.abs(rate) >= 0){
                                    // @ts-ignore
                                    rates[markets[m]] = rate;
                                    // @ts-ignore
                                    rates.arr.push(rate);
                                    rates.t += Math.abs(rate);
                                    console.log(markets[m] + ": " + Math.abs(Math.round(rate * 100) / 100).toString() + '% APY');
                                }
                                else {
                                    rate = 0;
                                    // @ts-ignore
                                    rates[markets[m]] = rate;
                                    // @ts-ignore
                                    rates.arr.push(rate);
                                    rates.t += Math.abs(rate);
                                }
                            }
                            catch (err) {
                                let rate = 0;
                                // @ts-ignore
                                rates[markets[m]] = rate;
                                // @ts-ignore
                                rates.arr.push(rate);
                                rates.t += Math.abs(rate);
                            }
                        }
                        rates.avg = rates.t / rates.arr.length;
                        let temp = 0;
                        for (var m in markets) {
                            let relative = (rates[markets[m]]) / rates.t;
                            if (!isNaN(relative)) {
                                rates.wants[markets[m] + '-PERP'] = -1 * relative;
                                rates.wants[markets[m] + '-SPOT'] = relative;
                            }
                            else {
                                rates.wants[markets[m] + '-PERP'] = 0;
                                rates.wants[markets[m] + '-SPOT'] = 0;
                            }
                        }
                        this.rates = rates;
                        this.doing = false;
                    }
                    catch (err) {
                        console.log(err);
                        this.doing = false;
                    }
                }
            }
        });
    }
    initializeRoutes() {
        return __awaiter(this, void 0, void 0, function* () {
            // GET /coins
            this.router.get(this.path, this.examplePerp);
        });
    }
}
exports.default = FundingController;
//# sourceMappingURL=example.js.map