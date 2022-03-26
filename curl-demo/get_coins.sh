#!/usr/bin/env zsh

echo "show a random coin availbale to trade"
echo "curl -s --location --request GET 'http://localhost:3000/api/coins' \
--data-raw '' | jq '.result[8]'"

curl -s --location --request GET 'http://localhost:3000/api/coins' \
--data-raw '' | jq '.result[8]'