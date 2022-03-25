#!/usr/bin/env zsh

echo "show USDC balance for user"
echo "curl -s --location --request GET 'http://localhost:3000/api/wallet/balances' \
--data-raw '' | jq '.result[8]'"

curl -s --location --request GET 'http://localhost:3000/api/wallet/balances' \
--data-raw '' | jq '.result[8]'