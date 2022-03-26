#!/usr/bin/env zsh

echo "show all positions"
echo "curl -s --location --request GET 'http://localhost:3000/api/positions' \
--data-raw '' | jq '.result[0]'"

curl -s --location --request GET 'http://localhost:3000/api/positions' \
--data-raw '' | jq '.result[0]'