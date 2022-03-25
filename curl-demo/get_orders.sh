#!/usr/bin/env zsh

echo "show all orders"
echo "curl -s --location --request GET 'http://localhost:3000/api/orders' \
--data-raw '' | jq '.result'"

curl -s --location --request GET 'http://localhost:3000/api/orders' \
--data-raw '' | jq '.result'