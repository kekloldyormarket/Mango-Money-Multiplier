#!/usr/bin/env zsh

echo "show candles for a BTC-PERP"
echo "curl -s --location --request GET 'http://localhost:3000/api/markets/BTC-PERP/candles?resolution=60&start_time=1625922900&end_time=1631214960' | jq '.result[8]'"

curl -s --location --request GET 'http://localhost:3000/api/markets/BTC-PERP/candles?resolution=60&start_time=1625922900&end_time=1631214960' | jq '.result[8]'