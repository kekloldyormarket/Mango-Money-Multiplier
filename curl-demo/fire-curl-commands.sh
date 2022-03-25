#!/usr/bin/env zsh

./get_balances.sh
echo "\n\n"
sleep 1

./get_candles.sh
echo "\n\n"
sleep 1

./get_coins.sh
echo "\n\n"
sleep 1

./get_markets.sh
echo "\n\n"
sleep 1

./get_orders.sh
echo "\n\n"
sleep 1

./cancel_all_orders.sh
echo "\n\n"
sleep 1

./post_order.sh
echo "\n\n"
sleep 1

./get_orders.sh
echo "\n\n"
sleep 1