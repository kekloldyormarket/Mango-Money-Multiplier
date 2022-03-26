#!/usr/bin/env zsh

echo "show a random trade"
echo "curl -s --location --request GET 'http://localhost:3000/api/markets/BTC-PERP/trades' | jq '.result[0]'"

curl -s --location --request GET 'http://localhost:3000/api/markets/BTC-PERP/trades' | jq '.result[0]'