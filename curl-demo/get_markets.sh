#!/usr/bin/env zsh

echo "show BTC-PERP market"
echo "curl -s --location --request GET 'http://localhost:3000/api/markets/BTC-PERP' | jq '.result'"

curl -s --location --request GET 'http://localhost:3000/api/markets/BTC-PERP' | jq '.result'