#!/usr/bin/env zsh

echo "place order"
cat << EOF
curl -s --location --request POST 'http://localhost:3000/api/orders' \
--header 'Content-Type: application/json' \
--data-raw '{
  "market": "BTC-PERP",
  "side": "buy",
  "price": 20000,
  "type": "limit",
  "size": 0.0001,
  "reduceOnly": false,
  "ioc": false,
  "postOnly": false,
  "clientId": "870"
}
' | jq .
EOF

curl -s --location --request POST 'http://localhost:3000/api/orders' \
--header 'Content-Type: application/json' \
--data-raw '{
  "market": "BTC-PERP",
  "side": "buy",
  "price": 20000,
  "type": "limit",
  "size": 0.0001,
  "reduceOnly": false,
  "ioc": false,
  "postOnly": false,
  "clientId": "870"
}
'