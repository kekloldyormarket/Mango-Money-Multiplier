#!/usr/bin/env zsh

echo "show orderbook"
echo "curl -s --location --request GET 'http://localhost:3000/api/markets/BTC-PERP/orderbook?depth=30' | jq '.result.asks[0]"

curl -s --location --request GET 'http://localhost:3000/api/markets/BTC-PERP/orderbook?depth=30' | jq '.result.asks[0]