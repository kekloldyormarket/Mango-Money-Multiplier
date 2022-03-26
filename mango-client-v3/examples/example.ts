import * as os from 'os';
import * as fs from 'fs';
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
async function examplePerp() {
  // setup client
  const config = new Config(configFile);
  const groupConfig = config.getGroupWithName('mainnet.1') as GroupConfig;
  //console.log(groupConfig)
  const connection = new Connection(
    config.cluster_urls[groupConfig.cluster],
    'processed' as Commitment,
  );
  const client = new MangoClient(connection, groupConfig.mangoProgramId);
  const markets = ["BTC", "SOL", "SRM", "RAY", "FTT", "ADA", "BNB", "AVAX", "LUNA"]
  // load group & market

  const mangoGroup = await client.getMangoGroup(groupConfig.publicKey);
while (true){
try{
  const owner = new Account(readKeypair());
  const mangoAccount = (
    await client.getMangoAccountsForOwner(mangoGroup, owner.publicKey)
  )[0];
  const cache = await mangoGroup.loadCache(connection)
  const accountstuff = mangoAccount.toPrettyString(groupConfig, mangoGroup, cache)
  console.log(accountstuff);
 //  ppp = (mangoAccount.computeValue(mangoGroup, cache).toNumber() * 4).toFixed(4) 
 // console.log('purchasing power @4x (breathing room 1x): ' + ppp)
  let rates = { 'arr': [], 't': 0, 'avg': 0, 'wants': {}, 'mids': {}}
  for (const m in markets){
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
  //  console.log(price, size);
    bb = price;
}
  for (const [price, size] of asks.getL2(1)) {
    console.log(price, size);
    ba = price;
  }
let mid = (bb + ba) / 2;
rates.mids[markets[m] +'-PERP'] = mid;
console.log(markets[m] + ' midprice: ' + mid.toString())

  let rate = await perpMarket.getCurrentFundingRate(
    mangoGroup,
    cache,
    perpMarketConfig.marketIndex,
    bids,
    asks
  ) * 24 * 365 * 100 * 4
  if (Math.abs(rate) > 20){
  // @ts-ignore
  rates[markets[m]] = rate;
  // @ts-ignore
  rates.arr.push(rate)
  rates.t+=Math.abs(rate);
  console.log(markets[m] + ": " + Math.abs(Math.round(rate * 100) / 100).toString() + '% APY')
  }
  else {
    rate = 0

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
    rates.wants[markets[m] + '-PERP'] = -1 * relative 
    rates.wants[markets[m] + '-SPOT'] = relative 

  }
  fs.writeFileSync('../py/lala.json', JSON.stringify(rates))
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
catch(err){

}
}
}

async function exampleSpot() {
  // setup client
  const config = new Config(configFile);
  const groupConfig = config.getGroupWithName('mainnet.1') as GroupConfig;
  const connection = new Connection(
    config.cluster_urls[groupConfig.cluster],
    'processed' as Commitment,
  );
  const client = new MangoClient(connection, groupConfig.mangoProgramId);

  // load group & market
  const spotMarketConfig = getMarketByBaseSymbolAndKind(
    groupConfig,
    'BTC',
    'spot',
  );
  const mangoGroup = await client.getMangoGroup(groupConfig.publicKey);
  const spotMarket = await Market.load(
    connection,
    spotMarketConfig.publicKey,
    undefined,
    groupConfig.serumProgramId,
  );

  // Fetch orderbooks
  let bids = await spotMarket.loadBids(connection);
  let asks = await spotMarket.loadAsks(connection);

  // L2 orderbook data
  for (const [price, size] of bids.getL2(20)) {
    console.log(price, size);
  }

  // L3 orderbook data
  for (const order of asks) {
    console.log(
      order.openOrdersAddress.toBase58(),
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
  await client.placeSpotOrder2(
    mangoGroup,
    mangoAccount,
    spotMarket,
    owner,
    'buy', // or 'sell'
    41000,
    0.0001,
    'limit',
    ZERO_BN, // client order id, set to whatever you want
    true, // use the mango MSRM vault for fee discount
  ); // or 'ioc' or 'postOnly'

  // Reload bids and asks and find your open orders
  // Possibly have a wait here so RPC node can catch up
  const openOrders = await mangoAccount.loadSpotOrdersForMarket(
    connection,
    spotMarket,
    spotMarketConfig.marketIndex,
  );

  // cancel orders
  for (const order of openOrders) {
    await client.cancelSpotOrder(
      mangoGroup,
      mangoAccount,
      owner,
      spotMarket,
      order,
    );
  }

  // Retrieve fills
  for (const fill of await spotMarket.loadFills(connection)) {
    console.log(
      fill.openOrders.toBase58(),
      fill.eventFlags.maker ? 'maker' : 'taker',
      fill.size * (fill.side === 'buy' ? 1 : -1),
      spotMarket.quoteSplSizeToNumber(
        fill.side === 'buy'
          ? fill.nativeQuantityPaid
          : fill.nativeQuantityReleased,
      ),
    );
  }

  // Settle funds
  for (const openOrders of await mangoAccount.loadOpenOrders(
    connection,
    groupConfig.serumProgramId,
  )) {
    if (!openOrders) continue;

    if (
      openOrders.baseTokenFree.gt(ZERO_BN) ||
      openOrders.quoteTokenFree.gt(ZERO_BN)
    ) {
      await client.settleFunds(mangoGroup, mangoAccount, owner, spotMarket);
    }
  }
}

examplePerp();
//exampleSpot();
