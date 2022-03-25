# Introduction
REST and WEBSOCKET API Services for mango  markets version 3, and some simple clients and examples. Aimed to follow spec as close as possible to popular exchanges like ftx, etc. Current motivation is to enable traders to bring their existing tools to mango markets. 

# Note
REST Service requires the user to run a local copy with his/her own private key. An alternative approach which is known and was not taken is to prepare solana transactions in a centrally hosted REST API Service and send them back to the client for signing using their wallet. The advantages of this would be that we could have a centrally hosted service, and would save local hosting, the disadvantages of this would be complicating the REST clients users want to use with solana specific signing code and would need us to ship and maintain clients for various programming languages. Also such a centrally hosted service would then need authorization, authentication, rate limiting, etc. to prevent abuse of the configured RPC node, which so far is not the aim of this project.

WEBSOCKET API currently streams L1, and L2 level orderbook data.

# Documentation
See https://microwavedcola1.github.io/mango-service-v3/#tag/default

Directory structure
```
.
├── README.md
├── mango-service-v3 - REST API Service for mango markets version 3
├── mango-bowl       - WEBSOCKET API Service for L1, L2 orderbook data for mango markets version 3  
└── py               - python3 client for above REST API Service
```

# How to run
* `docker-compose up` starts the REST API Service and the WEBSOCKET API Service, and a ngninx reverse proxy
* The REST API is then available e.g. `curl http://localhost/api/wallet/balances`
* the WEBSOCKET API is then available e.g.`wscat --connect ws://localhost/ws` (note by default the websocket program when run in isolation is available at `ws://localhost/v1/ws` )


# Todos
losely sorted in order of importance/priority
- rpc node related issues
  - ensure that order has been placed or definitely not placed on the server side
  - some off chain services are used, these might use other nodes, mixing data from various nodes, might be problematic, what if one node is behind?
- populate still undefined fields in various endpoints
- todos sprinkled over code
- when null vs when undefined as return field value,- doublecheck for every endpoint/dto
- serum-history might be decomissioned, seek replacement
- technical debt
  - cleanup tsconfig.json
  - add pre commit tools e.g. husky/pre-commit for code formatting and linting

# Feedback 
so far from beta tasters, from twitter, discord, etc.
- auto create mango account if none exists
- deposit collateral using cross-chain bridges
- new endpoints
  - stop loss, 
  - market orders
  - modify order
  - funding payments
- advanced order types e.g. split 
- cache various mango related things which change infrequently like e.g. spot+perp markets, placed orders for user, etc.
- identify which endpoints are still slow, comparison with ftx, can use https://ftx.com/latency-stats, 
- how often to load/reload certain mango things e.g. account, cache, rootbanks, etc.?
- integration with freqtrade and/or ccxt https://github.com/ccxt/ccxt/blob/master/js/ftx.js
- integration with tradingview or https://github.com/thibaultyou/tradingview-alerts-processor/blob/master/docs/2_Alerts.md & https://www.tradingview.com/support/solutions/43000529348-about-webhooks/
- integrate with hummingbot
