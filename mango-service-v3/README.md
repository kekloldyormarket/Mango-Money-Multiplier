
A REST API server on top of mango markets v3, written in typescript + expressjs + using mango client and some other off chain REST services.

# Environment variables
All environment variables are optional.
* PRIVATE_KEY_PATH - path to private key, default is ~/.config/solana/id.json
* PORT - port on which expressjs webserver runs, default is 3000
* CLUSTER_URL - RPC node url e.g., default is scheduled rotation between  https://api.mainnet-beta.solana.com, https://lokidfxnwlabdq.main.genesysgo.net:8899/,
      https://solana-api.projectserum.com/
* MANGO_ACCOUNT - public key of mango account to explicitly choose, in case an owner has multiple mango accounts, or PRIVATE_KEY_PATH is a delegate  

# How to run while developing
* `yarn install`
* `yarn ts-node ./src/server.ts` or if you have `nodemon` installed then, `nodemon ./src/server.ts`

# How to run using docker
* `docker pull microwavedcola/mango-service-v3`
* `docker run -p 3000:3000 -v  ~/.config:/root/.config microwavedcola/mango-service-v3`, assumes private key to be present at ~/.config/solana/id.json  

# How to test
* via postman, see `service-v3.postman_collection.json`
* python client, see https://github.com/microwavedcola1/mango-v3-service/blob/master/py/README.md
