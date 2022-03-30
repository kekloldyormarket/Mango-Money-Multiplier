import * as os from 'os';
import * as fs from 'fs';
import { NextFunction, Request, Response, Router } from "express";

interface Controller {
  path: string;
  router: Router;
}

 
import {
  Config,
  getMarketByBaseSymbolAndKind,
  getUnixTs,
  GroupConfig,
  MangoClient,
  MangoCache,
  ZERO_BN,
} from '../src';
import {MangoAccount} from '../src';
import { Account, Commitment, Connection } from '@solana/web3.js';
import configFile from '../src/ids.json';
import { Market } from '@project-serum/serum';

function readKeypair() {
  return JSON.parse(
    process.env.KEYPAIR ||
      fs.readFileSync(os.homedir() + '/.config/solana/id.json', 'utf-8'),
  );
}
let ppp

export default class FundingController implements Controller {
  public path = "/lala/";
  public router = Router();
  public doing = false;
  public rates = { 'arr': [], 't': 0, 'avg': 0, 'wants': {}, 'mids': {}}
  constructor() {
    this.initializeRoutes();
  }
  public async checkRates (){
    if (!this.doing){
      this.doing = true;
    // setup client
  const config = new Config(configFile);
  const groupConfig = config.getGroupWithName('mainnet.1') as GroupConfig;
  ////console.log(groupConfig)
  //console.log(config.cluster_urls[groupConfig.cluster])
  const connection = new Connection(
    config.cluster_urls[groupConfig.cluster],
    'processed' as Commitment,
  );
  const client = new MangoClient(connection, groupConfig.mangoProgramId);
  const markets = ["BTC", "SOL", "SRM", "RAY", "FTT", "ADA", "BNB", "AVAX", "LUNA"]
  // load group & market

  const mangoGroup = await client.getMangoGroup(groupConfig.publicKey);
if (true){
try{
  const cache = await mangoGroup.loadCache(connection)
  
 //  ppp = (mangoAccount.computeValue(mangoGroup, cache).toNumber() * 4).toFixed(4) 
 // //console.log('purchasing power @4x (breathing room 1x): ' + ppp)
  let rates = { 'arr': [], 't': 0, 'avg': 0, 'wants': {}, 'mids': {}}
  for (const m in markets){
    try{
  const perpMarketConfig = getMarketByBaseSymbolAndKind(
    groupConfig,
    markets[m],
    'perp',
  );
  const perpMarket = await mangoGroup.loadPerpMarket(
    connection,
    perpMarketConfig.marketIndex,
    perpMarketConfig.baseDecimals,
    perpMarketConfig.quoteDecimals,
  );

  // Fetch orderbooks
  const bids = await perpMarket.loadBids(connection);
  const asks = await perpMarket.loadAsks(connection);
  let bb, ba;
  for (const [price, size] of bids.getL2(1)) {
  //  //console.log(price, size);
    bb = price;
}
  for (const [price, size] of asks.getL2(1)) {
    //console.log(price, size);
    ba = price;
  }
let mid = (bb + ba) / 2;
if (isNaN(mid)){
  mid = 0
}
rates.mids[markets[m] +'-PERP'] = mid;
//console.log(markets[m] + ' midprice: ' + mid.toString())

  let rate = await perpMarket.getCurrentFundingRate(
    mangoGroup,
    cache,
    perpMarketConfig.marketIndex,
    bids,
    asks
  ) * 24 * 365 * 100 * 2
  if (!isNaN(rate)){//Math.abs(rate) >= 0){
  // @ts-ignore
  rates[markets[m]] = rate;
  // @ts-ignore
  rates.arr.push(rate)
  rates.t+=Math.abs(rate);
  //console.log(markets[m] + ": " + Math.abs(Math.round(rate * 100) / 100).toString() + '% APY')
  }
  else {
    rate = 0

  // @ts-ignore
  rates[markets[m]] = rate;
  // @ts-ignore
  rates.arr.push(rate)
  rates.t+=Math.abs(rate);
  }
} catch(err){
 let rate = 0

  // @ts-ignore
  rates[markets[m]] = rate;
  // @ts-ignore
  rates.arr.push(rate)
  rates.t+=Math.abs(rate);
}
  }

  rates.avg = rates.t / rates.arr.length;
  let temp = 0;
  for (var m in markets){
    let relative = (rates[markets[m]]) / rates.t
    if (!isNaN(relative)){
    rates.wants[markets[m] + '-PERP'] = -1 * relative 
    rates.wants[markets[m] + '-SPOT'] = relative 
    }
    else {
      
    rates.wants[markets[m] + '-PERP'] = 0
    rates.wants[markets[m] + '-SPOT'] = 0
    }
  }
  this.rates = rates;
  this.doing = false;
  }
  catch (err){
    console.log(err)
    this.doing = false;
  }
}
    }
  }
  private async initializeRoutes() {
    // GET /coins
    this.router.get(this.path, this.examplePerp);
    
  }


private examplePerp =  async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  if (true){
    try {
    
  response.send({ success: true, result: this.rates } );
  /*
  // L2 orderbook data
  for (const [price, size] of bids.getL2(20)) {
    //console.log(price, size);
  }

  // L3 orderbook data
  for (const order of asks) {
    //console.log(
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
    //console.log(
      fill.maker.toBase58(),
      fill.taker.toBase58(),
      fill.price,
      fill.quantity,
    );
  }
  */
}
catch(err){
console.log(err)
response.send({ success: false, result: {} } )}
}
}
}