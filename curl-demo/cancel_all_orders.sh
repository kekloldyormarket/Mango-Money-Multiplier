#!/usr/bin/env zsh

echo "cancel all orders"
echo "curl --location --request DELETE 'http://localhost:3000/api/orders'"

curl --location --request DELETE 'http://localhost:3000/api/orders'