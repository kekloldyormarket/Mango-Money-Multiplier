<img src="https://raw.githubusercontent.com/tardis-dev/mango-bowl/master/logo.svg">

[![Version](https://img.shields.io/npm/v/mango-bowl.svg?color=7ac401)](https://www.npmjs.org/package/mango-bowl)
[![Docker version](https://img.shields.io/docker/v/tardisdev/mango-bowl/latest?label=Docker&color=7ac401)](https://hub.docker.com/r/tardisdev/mango-bowl)

# mango-bowl: real-time WS market data API for Mango DEX

<br/>

## Why?

- **familiar experience for centralized exchanges APIs users**

  - **WebSocket API with Pub/Sub flow** - subscribe to selected channels and markets and receive real-time data as easy to parse JSON messages that can be consumed from any language supporting WebSocket protocol

  - **incremental L2 order book updates** - instead of decoding Mango market `asks` and `bids` accounts for each account change in order to detect order book updates, receive [initial L2 snapshot](#l2snapshot) and [incremental updates](#l2update) as JSON messages real-time over WebSocket connection

  - **tick-by-tick trades** - instead of decoding `eventQueue` account data which is quite large and in practice it's hard to consume real-time directly from Solana RPC node due to it's size, receive individual [`trade`](#trade) messages real-time over WebSocket connection

  - **real-time L3 data** - receive the most granular updates on individual order level: [`open`](#open), [`change`](#change), [`fill`](#fill) and [`done`](#done) messages for every order that Mango DEX processes

- **decreased load and bandwidth consumption for Solana RPC nodes hosts** - by providing real-time market data API via mango-bowl server instead of RPC node directly, hosts can decrease substantially both CPU load and bandwidth requirements as only mango-bowl will be direct consumer of RPC API when it comes to market data accounts changes and will efficiently normalize and broadcast small JSON messages to all connected clients

## What about placing/cancelling orders endpoints?

mango-bowl provides real-time market data only and does not include endpoints for placing/canceling or tracking own orders as that requires handling private keys which is currently out of scope of this project.

Both [microwavedcola1/mango-v3-service](https://github.com/microwavedcola1/mango-v3-service) and [@blockworks-foundation/mango-client](https://github.com/blockworks-foundation/mango-client-v3) provide such functionality and are recommended alternatives.

<br/>
<br/>

## Getting started

Run the code snippet below in the browser Dev Tools directly or in Node.js (requires installation of `ws` lib, [see](https://runkit.com/thad/mango-bowl-node-js-sample)).

```js
// connect to hosted demo server
const ws = new WebSocket('wss://api.mango-bowl.com/v1/ws')
// if connecting to mango-bowl server running locally
// const ws = new WebSocket('ws://localhost:8010/v1/ws')

ws.onmessage = (message) => {
  console.log(JSON.parse(message.data))
}

ws.onopen = () => {
  // subscribe both to trades and level2 real-time channels
  const subscribeTrades = {
    op: 'subscribe',
    channel: 'trades',
    markets: ['MNGO-PERP', 'SOL-PERP']
  }

  const subscribeL2 = {
    op: 'subscribe',
    channel: 'level2',
    markets: ['MNGO-PERP', 'SOL-PERP']
  }

  ws.send(JSON.stringify(subscribeTrades))
  ws.send(JSON.stringify(subscribeL2))
}
```

[![Try this code live on RunKit](https://img.shields.io/badge/-Try%20this%20code%20live%20on%20RunKit-c?color=05aac5)](https://runkit.com/thad/mango-bowl-node-js-sample)

<br/>
<br/>

## Using public hosted server

Mango-bowl public hosted WebSocket server (backed by Project Serum RPC node) is available at:

<br/>

[wss://api.mango-bowl.com/v1/ws](wss://api.mango-bowl.com/v1/ws)

<br/>
<br/>

## Installation

---

# IMPORTANT NOTE

For the best mango-bowl data reliability it's advised to [set up a dedicated Solana RPC node](https://docs.solana.com/running-validator) and connect `mango-bowl` to it instead of default `https://solana-api.projectserum.com` which may rate limit or frequently restart Websocket RPC connections since it's a public node used by many.

---

<br/>
<br/>

### npx <sub>(requires Node.js >= 15 and git installed on host machine)</sub>

Installs and starts mango-bowl server running on port `8000`.

```sh
npx mango-bowl
```

If you'd like to switch to different Solana RPC node endpoint like for example local one, change port or run with debug logs enabled, just add one of the available CLI options.

```sh
npx mango-bowl --endpoint http://localhost:8090 --ws-endpoint-port 8899 --log-level debug --port 8900
```

Alternatively you can install mango-bowl globally.

```sh
npm install -g mango-bowl
mango-bowl
```

<br/>

#### CLI options

| &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; name &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | default                             | description                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `port`                                                                                                                                                                                                                                                                                                  | 8010                                | Port to bind server on                                                                                                                                                                             |
| `endpoint`                                                                                                                                                                                                                                                                                              | https://solana-api.projectserum.com | Solana RPC node endpoint that mango-bowl uses as a data source                                                                                                                                     |
| `ws-endpoint-port`                                                                                                                                                                                                                                                                                      | -                                   | Optional Solana RPC WS node endpoint port that mango-bowl uses as a data source (if different than REST endpoint port) source                                                                      |
| `log-level`                                                                                                                                                                                                                                                                                             | info                                | Log level, available options: debug, info, warn and error                                                                                                                                          |
| `minions-count`                                                                                                                                                                                                                                                                                         | 1                                   | [Minions worker threads](#architecture) count that are responsible for broadcasting normalized WS messages to connected clients                                                                    |
| `commitment`                                                                                                                                                                                                                                                                                            | confirmed                           | [Solana commitment level](https://docs.solana.com/developing/clients/jsonrpc-api#configuring-state-commitment) to use when communicating with RPC node, available options: confirmed and processed |
| `group-name`                                                                                                                                                                                                                                                                                            | mainnet.1                           | Config group name to load Mango perp markets from                                                                                                                                                  |

<br/>

Run `npx mango-bowl --help` to see all available startup options.

<br/>
<br/>

### Docker

Pulls and runs latest version of [`tardisdev/mango-bowl` Docker Image](https://hub.docker.com/r/tardisdev/mango-bowl) on port `8010`.

```sh
docker run -p 8010:8010 -d tardisdev/mango-bowl:latest
```

If you'd like to switch to different Solana RPC node endpoint, change port or run with debug logs enabled, just specify those via one of the available env variables.

```sh
docker run -p 8010:8010 -e "MB_LOG_LEVEL=debug" -d tardisdev/mango-bowl:latest
```

<br/>

#### ENV Variables

| &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; name &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | default                             | description                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MB_PORT`                                                                                                                                                                                                                                                                                               | 8010                                | Port to bind server on                                                                                                                                                                             |
| `MB_ENDPOINT`                                                                                                                                                                                                                                                                                           | https://solana-api.projectserum.com | Solana RPC node endpoint that mango-bowl uses as a data source                                                                                                                                     |
| `MB_WS_ENDPOINT_PORT`                                                                                                                                                                                                                                                                                   | -                                   | Optional Solana RPC WS node endpoint port that mango-bowl uses as a data source (if different than REST endpoint port) source                                                                      |
| `MB_LOG_LEVEL`                                                                                                                                                                                                                                                                                          | info                                | Log level, available options: debug, info, warn and error                                                                                                                                          |
| `MB_MINIONS_COUNT`                                                                                                                                                                                                                                                                                      | 1                                   | [Minions worker threads](#architecture) count that are responsible for broadcasting normalized WS messages to connected clients                                                                    |
| `MB_COMMITMENT`                                                                                                                                                                                                                                                                                         | confirmed                           | [Solana commitment level](https://docs.solana.com/developing/clients/jsonrpc-api#configuring-state-commitment) to use when communicating with RPC node, available options: confirmed and processed |
| `MB_GROUP_NAME`                                                                                                                                                                                                                                                                                         | mainnet.1                           | Config group name to load Mango perp markets from                                                                                                                                                  |

<br/>
<br/>

### SSL/TLS Support

Mango-bowl supports [SSL/TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security) but it's not enabled by default. In order to enable it you need to set `CERT_FILE_NAME` env var pointing to the certificate file and `KEY_FILE_NAME` pointing to private key of that certificate.

<br/>
<br/>

## WebSocket API

WebSocket API provides real-time market data feeds of Mango Markets DEX and uses a bidirectional protocol which encodes all messages as JSON objects.

<br/>

### Endpoint URL

- **[ws://localhost:8010/v1/ws](ws://localhost:8010/v1/ws)** - assuming mango-bowl runs locally on default port without SSL enabled

- **[wss://api.mango-bowl.com/v1/ws](wss://api.mango-bowl.com/v1/ws)** - demo mango-bowl server endpoint

<br/>

### Subscribing to data feeds

To begin receiving real-time market data feed messages, you must first send a subscribe message to the server indicating [channels](#supported-channels--corresponding-message-types) and [markets](#supported-markets) for which you want the data for.

If you want to unsubscribe from channel and markets, send an unsubscribe message. The structure is equivalent to subscribe messages except `op` field which should be set to `"op": "unsubscribe"`.

```js
const ws = new WebSocket('ws://localhost:8010/v1/ws')

ws.onopen = () => {
  const subscribeL2 = {
    op: 'subscribe',
    channel: 'trades',
    markets: ['SOL-PERP', 'MNGO-PERP']
  }

  ws.send(JSON.stringify(subscribeL2))
}
```

<br/>

#### Subscribe/unsubscribe message format

- see [supported channels & corresponding data messages types](#supported-channels--corresponding-message-types)
- see [supported markets](#supported-markets)

```ts
{
  "op": "subscribe" | "unsubscribe",
  "channel": "level3" | "level2" | "level1" | "trades",
  "markets": string[]
}
```

##### sample `subscribe` message

```json
{
  "op": "subscribe",
  "channel": "level2",
  "markets": ["SOL-PERP", "MNGO-PERP"]
}
```

<br/>

#### Subscription confirmation message format

Once a subscription (or unsubscription) request is processed by the server, it will push `subscribed` (or `unsubscribed`) confirmation message or `error` if received request message was invalid.

```ts
{
"type": "subscribed" | "unsubscribed",
"channel": "level3" | "level2" | "level1" | "trades",
"markets": string[],
"timestamp": string
}
```

##### sample `subscribed` confirmation message

```json
{
  "type": "subscribed",
  "channel": "level2",
  "markets": ["SOL-PERP"],
  "timestamp": "2021-12-14T11:06:30.010Z"
}
```

<br/>

#### Error message format

Error message is pushed for invalid subscribe/unsubscribe messages - non existing market, invalid channel name etc.

```ts
{
  "type": "error",
  "message": "string,
  "timestamp": "string
}
```

##### sample `error` message

```json
{
  "type": "error",
  "message": "Invalid channel provided: 'levels1'.",
  "timestamp": "2021-12-14T07:12:11.110Z"
}
```

<br/>
<br/>

### Supported channels & corresponding message types

When subscribed to the channel, server will push the data messages as specified below.

- `trades`

  - [`recent_trades`](#recent_trades)
  - [`trade`](#trade)

- `level1`

  - [`quote`](#quote)

- `level2`

  - [`l2snapshot`](#l2snapshot)
  - [`l2update`](#l2update)

- `level3`

  - [`l3snapshot`](#l3snapshot)
  - [`open`](#open)
  - [`fill`](#fill)
  - [`change`](#change)
  - [`done`](#done)

<br/>
<br/>

### Supported markets

Markets supported by mango-bowl server can be queried via [`GET /markets`](#get-markets) HTTP endpoint (`[].name` field).

<br/>
<br/>

### Data messages

- `type` is determining message's data type so it can be handled appropriately

- `timestamp` when message has been received from node RPC API by mango-bowl server in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format with milliseconds, for example: "2021-12-14T07:03:03.994Z"

- `slot` is a [Solana's slot](https://docs.solana.com/terminology#slot) number for which message has produced

- `version` of Mango DEX program layout

- `price` and `size` are provided as strings to preserve precision

- `eventTimestamp` is a timestamp of event provided by DEX (with seconds precision) in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601), for example: "2021-12-14T07:03:03.000Z"

<br/>

#### `recent_trades`

Up to 100 recent trades pushed immediately after successful subscription confirmation.

- every trade in `trades` array has the same format as [`trade`](#trade) message
- trades are ordered from oldest to newest

```ts
{
  "type": "recent_trades",
  "market": string,
  "trades": Trade[],
  "timestamp": string
}
```

#### sample `recent_trades` message

```json
{
  "type": "recent_trades",
  "market": "SOL-PERP",
  "timestamp": "2021-12-14T12:33:42.437Z",
  "trades": [
    {
      "type": "trade",
      "market": "SOL-PERP",
      "timestamp": "2021-12-14T12:33:02.437Z",
      "slot": 111490354,
      "version": 1,
      "id": "293690612397529782803247|296512964240807321150678",
      "side": "sell",
      "price": "160.73",
      "size": "4.53",
      "eventTimestamp": "2021-12-14T12:32:59.000Z",
      "takerAccount": "AAddgLu9reZCUWW1bNQFaXrCMAtwQpMRvmeusgk4pCM6",
      "makerAccount": "EpAdzaqV13Es3x4dukfjFoCrKVXnZ7y9Y76whgMHo5qx"
    }
  ]
}
```

<br/>

#### `trade`

Pushed real-time for each trade as it happens on a DEX (decoded from the `eventQueue` account).

- `side` describes a liquidity taker side

- `id` field is an unique id constructed by joining fill taker and fill maker order id

- `eventTimestamp` is a timestamp of trade provided by DEX (with seconds precision) in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)

- `takerAccount` and `makerAccount` fields provide info regarding maker and taker open account addresses that constitute the trade

```ts
{
  "type": "trade",
  "market": string,
  "timestamp": string,
  "slot": number,
  "version": number,
  "id": string,
  "side": "buy" | "sell",
  "price": string,
  "size": string,
  "eventTimestamp": string
  "takerAccount": string
  "makerAccount": string
}
```

#### sample `trade` message

```json
{
  "type": "trade",
  "market": "SOL-PERP",
  "timestamp": "2021-12-14T12:35:34.309Z",
  "slot": 111490613,
  "version": 1,
  "id": "296310050055996539132982|296346943544143935185875",
  "side": "sell",
  "price": "160.64",
  "size": "0.50",
  "eventTimestamp": "2021-12-14T12:35:29.000Z",
  "takerAccount": "AAddgLu9reZCUWW1bNQFaXrCMAtwQpMRvmeusgk4pCM6",
  "makerAccount": "EpAdzaqV13Es3x4dukfjFoCrKVXnZ7y9Y76whgMHo5qx"
}
```

<br/>

### `quote`

Pushed real-time for any change in best bid/ask price or size for a given market (decoded from the `bids` and `asks` accounts).

- `bestAsk` and `bestBid` are tuples where first item is a price and second is a size of the best bid/ask level

```ts
{
  "type": "quote",
  "market": string,
  "timestamp": string,
  "slot": number,
  "version": number,
  "bestAsk": [price: string, size: string] | undefined,
  "bestBid": [price: string, size: string] | undefined
}
```

#### sample `quote` message

```json
{
  "type": "quote",
  "market": "SOL-PERP",
  "timestamp": "2021-12-14T12:40:18.809Z",
  "slot": 111491086,
  "version": 1,
  "bestAsk": ["160.63", "0.50"],
  "bestBid": ["160.53", "0.50"]
}
```

<br/>

### `l2snapshot`

Entire up-to-date order book snapshot with orders aggregated by price level pushed immediately after successful subscription confirmation.

- `asks` and `bids` arrays contain tuples where first item of a tuple is a price level and second one is a size of the resting orders at that price level

- it can be pushed for an active connection as well when underlying server connection to the RPC node has been restarted, in such scenario locally maintained order book should be re-initialized with a new snapshot

- together with [`l2update`](#l2update) messages it can be used to maintain local up-to-date full order book state

```ts
{
  "type": "l2snapshot",
  "market": string,
  "timestamp": string,
  "slot": number,
  "version": number,
  "asks": [price: string, size: string][],
  "bids": [price: string, size: string][]
}
```

#### sample `l2snapshot` message

```json
{
  "type": "l2snapshot",
  "market": "SOL-PERP",
  "timestamp": "2021-12-14T12:41:38.369Z",
  "slot": 111491223,
  "version": 1,
  "asks": [
    ["160.63", "0.50"],
    ["160.68", "101.27"]
  ],
  "bids": [
    ["160.53", "0.50"],
    ["160.47", "2.00"],
    ["160.45", "1828.47"]
  ]
}
```

<br/>

### `l2update`

Pushed real-time for any change to the order book for a given market with updated price levels and sizes since the previous update (decoded from the `bids` and `asks` accounts).

- together with [`l2snapshot`](#l2snapshot), `l2update` messages can be used to maintain local up-to-date full order book state

- `asks` and `bids` arrays contain updates which are provided as a tuples where first item is an updated price level and second one is an updated size of the resting orders at that price level (absolute value, not delta)

- if size is set to `0` it means that such price level does not exist anymore and shall be removed from locally maintained order book

```ts
{
  "type": "l2update",
  "market": string,
  "timestamp": string,
  "slot": number,
  "version": number,
  "asks": [price: string, size: string][],
  "bids": [price: string, size: string][]
}
```

#### sample `l2update` message

```json
{
  "type": "l2update",
  "market": "SOL-PERP",
  "timestamp": "2021-12-14T12:43:03.993Z",
  "slot": 111491367,
  "version": 1,
  "asks": [["160.63", "0.50"]],
  "bids": []
}
```

<br/>

### `l3snapshot`

Entire up-to-date order book snapshot with **all individual orders** pushed immediately after successful subscription confirmation.

- `clientId` is an client provided order id for an order

- `account` is an open orders account address

- `accountSlot` is a an open orders account slot number

- `eventTimestamp` is a timestamp when order was added to the order book, provided by DEX (with seconds precision) in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)

- together with [`open`](#open), [`change`](#change), [`fill`](#fill) and [`done`](#done) messages it can be used to maintain local up to date Level 3 order book state

- it can be pushed for an active connection as well when underlying server connection to the RPC node has been restarted, in such scenario locally maintained L3 order book should be re-initialized with a new snapshot

```ts
{
  "type": "l3snapshot",
  "market": string,
  "timestamp": string,
  "slot": number,
  "version": number,
  "asks": {
    "price": string,
    "size": string,
    "side": "sell",
    "orderId": string,
    "clientId": string,
    "account": string,
    "accountSlot": number,
    "eventTimestamp": string
  }[],
  "bids": {
    "price": string,
    "size": string,
    "side": "buy",
    "orderId": string,
    "clientId": string,
    "account": string,
    "accountSlot": number,
    "eventTimestamp": string
  }[]
}
```

#### sample `l3snapshot` message

```json
{
  "type": "l3snapshot",
  "market": "SOL-PERP",
  "timestamp": "2021-12-14T12:46:40.670Z",
  "slot": 111491726,
  "version": 1,
  "asks": [
    {
      "orderId": "295645967269342995275767",
      "clientId": "1639485991672",
      "side": "sell",
      "price": "160.27",
      "size": "101.53",
      "account": "7xfGLkYwMBFbQ6iLTVMqmDrsU4CkaLHWuNLmdLTPmAtv",
      "accountSlot": 3,
      "eventTimestamp": "2021-12-14T12:46:34.000Z"
    },
    {
      "orderId": "295664414013416704827395",
      "clientId": "1639485996363",
      "side": "sell",
      "price": "160.28",
      "size": "0.09",
      "account": "B8CcUApFnKCWC49zy8u6YjCSFBKaATxQytegNSyQnoAn",
      "accountSlot": 11,
      "eventTimestamp": "2021-12-14T12:46:38.000Z"
    }
  ],
  "bids": [
    {
      "orderId": "295277032387868781191181",
      "clientId": "3411370557685501304",
      "side": "buy",
      "price": "160.06",
      "size": "8.06",
      "account": "DAcKCh6VB2faJ8HRXXygr6fsCNRLB6JqzjmVmCJnGkx5",
      "accountSlot": 0,
      "eventTimestamp": "2021-12-14T12:46:29.000Z"
    }
  ]
}
```

### `open`

Pushed real-time for every new order opened on the limit order book (decoded from the `bids` and `asks` accounts).

- `eventTimestamp` is a timestamp when order was added to the order book, provided by DEX (with seconds precision) in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)

- **no** `open` messages are pushed for order that are filled or canceled immediately, for example - `ImmediateOrCancel` orders

```ts
{
  "type": "open",
  "market": string,
  "timestamp": string,
  "slot": number,
  "version": number,
  "orderId": string,
  "clientId": string,
  "side": "buy" | "sell",
  "price": string,
  "size": string,
  "account": string,
  "accountSlot": number,
  "eventTimestamp": string
}
```

#### sample `open` message

```json
{
  "type": "open",
  "market": "SOL-PERP",
  "timestamp": "2021-12-14T12:48:55.039Z",
  "slot": 111491934,
  "version": 1,
  "orderId": "295147905179352837382395",
  "clientId": "1639486128126",
  "side": "sell",
  "price": "160.00",
  "size": "401.00",
  "account": "8o2itcoSF7AfmhotNo7KjHaMSfUqHitJAr3wRnh9DkpF",
  "accountSlot": 0,
  "eventTimestamp": "2021-12-14T12:48:49.000Z"
}
```

<br/>

### `change`

Pushed real-time anytime order size changes as a result of self-trade prevention (decoded from the `bids` and `asks` accounts).

- `size` field contains updated order size

```ts
{
  "type": "change",
  "market": string,
  "timestamp": string,
  "slot": number,
  "version": number,
  "orderId": string,
  "clientId": string,
  "side": "buy" | "sell",
  "price": string,
  "size": string,
  "account": string,
  "accountSlot": number
}
```

#### sample `change` message

```json
{
  "type": "change",
  "market": "SOL-PERP",
  "timestamp": "2021-12-14T12:49:00.359Z",
  "slot": 111491944,
  "version": 1,
  "orderId": "293487698212718954684144",
  "clientId": "1639486135724",
  "side": "buy",
  "price": "159.09",
  "size": "102.06",
  "account": "7xfGLkYwMBFbQ6iLTVMqmDrsU4CkaLHWuNLmdLTPmAtv",
  "accountSlot": 0
}
```

<br/>

### `fill`

Pushed real-time anytime trade happens (decoded from the `eventQueue` accounts).

- there are always two `fill` messages for a trade, one for a maker and one for a taker order

- `eventTimestamp` is a timestamp of fill provided by DEX (with seconds precision) in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)

- `feeCost` is provided in a quote currency

```ts
{
  "type": "fill",
  "market": string,
  "timestamp": string,
  "slot": number,
  "version": number,
  "orderId": string,
  "clientId": string,
  "side": "buy" | "sell",
  "price": string,
  "size": string,
  "maker" boolean,
  "feeCost" number,
  "account": string,
  "accountSlot": number,
  "eventTimestamp": string
}
```

#### sample `fill` message

```json
{
  "type": "fill",
  "market": "SOL-PERP",
  "timestamp": "2021-12-14T12:49:05.442Z",
  "slot": 111491953,
  "version": 1,
  "orderId": "294594502857141527781101",
  "clientId": "1639486138455",
  "side": "buy",
  "price": "159.69",
  "size": "0.50",
  "maker": true,
  "feeCost": -0.03193799999992557,
  "account": "FowB2BtTty6MrBbY5ecAFVqiyJ6iLWVPsB58VrLjqW1Z",
  "accountSlot": 0,
  "eventTimestamp": "2021-12-14T12:49:02.000Z"
}
```

<br/>

### `done`

Pushed real-time when the order is no longer on the order book (decoded from the `eventQueue` accounts).

- this message can result from an order being canceled or filled (`reason` field)

- there will be no more messages for this `orderId` after a `done` message

- it can be pushed for orders that were never `open` in the order book in the first place (`ImmediateOrCancel` orders for example)

- `sizeRemaining` field is available only for canceled orders (`reason="canceled"`)

```ts
{
  "type": "done",
  "market": string,
  "timestamp": string,
  "slot": number,
  "version": number,
  "orderId": string,
  "clientId": string,
  "side": "buy" | "sell",
  "reason" : "canceled" | "filled",
  "sizeRemaining": string | undefined
  "account": string,
  "accountSlot": number
}
```

### sample `done` message

```json
{
  "type": "done",
  "market": "SOL-PERP",
  "timestamp": "2021-12-14T12:49:09.928Z",
  "slot": 111491960,
  "version": 1,
  "orderId": "294760523553804936798483",
  "clientId": "1639486138456",
  "side": "sell",
  "reason": "canceled",
  "account": "FowB2BtTty6MrBbY5ecAFVqiyJ6iLWVPsB58VrLjqW1Z",
  "accountSlot": 1,
  "sizeRemaining": "0.50"
}
```

###

<br/>
<br/>

## HTTP API

### GET `/markets`

Returns Mango DEX markets list supported by mango-bowl instance.

<br/>

### Endpoint URL

- [http://localhost:8010/v1/markets](http://localhost:8000/v1/markets) - assuming mango-bowl runs locally on default port without SSL enabled

- [https://api.mango-bowl.com/v1/markets](https://api.mango-bowl.com/v1/markets) - demo mango-bowl server endpoint

<br/>

### Response format

```ts
{
  "name": string,
  "baseCurrency": string,
  "quoteCurrency": string,
  "version": number,
  "address": string,
  "programId": string,
  "tickSize": number,
  "minOrderSize": number,
  "takerFee": string,
  "makerFee": string,
  "liquidationFee": string
}[]
```

#### sample response

```json
[
  {
    "name": "SOL-PERP",
    "baseCurrency": "SOL",
    "quoteCurrency": "USDC",
    "version": 1,
    "address": "2TgaaVoHgnSeEtXvWTx13zQeTf4hYWAMEiMQdcG6EwHi",
    "programId": "mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68",
    "tickSize": 0.01,
    "minOrderSize": 0.01,
    "takerFee": "0.00050",
    "makerFee": "-0.00040",
    "liquidationFee": "0.02500"
  }
]
```

<br/>
<br/>
