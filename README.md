it's a funding arbitrage bot for mangomarkets



1. install docker and docker-compose
2. sudo docker-compose up 
3. wait
4. you need your private key as machine readable in the root as id.json
5. if you need to translate your private key to uint8, plz check the bs58 npmjs packagae.
6. it's probably easier for you to download and installs solana cli and run solana-keygen new, then copypasta your id.json from ~/.config/solana/id.json
7. this is actually designed to trade for people that delegate to you via mango, so right now all your addresses you'd want to trade are defined here. change these pubkeys.

./mango-service-v3/src/mango.simple.client.ts:let meAndTheBoys = ["5sBpMQgTi7phxqRnErfbwx29vUsbUZoy1MLgY7aXuqeo", "GvSCxCi3y2Mt4JPExhLEZXTbYVGBXv9DNXYomvwRVEak"]

8. sudo docker build . or sudo docker-compose --build
9. great, it's running?
10. cd py && curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python - && source ~/.poetry/env
11. pip install tenacity httpx pydantic 
12. python example3_market_maker.py
13. I accept both tips stacc.sol and PRs



I forgot you need to do this: mango-client-v3$ ts-node examples/example.ts  it expects your id.json in the default solana dir
