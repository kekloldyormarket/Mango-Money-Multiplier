import time

from mango_service_v3_py.api import MangoServiceV3Client
from mango_service_v3_py.dtos import PlaceOrder

MARKET = "BTC-PERP"


def fibonacci_of(n):
    if n in {0, 1}:
        return n
    return fibonacci_of(n - 1) + fibonacci_of(n - 2)


if __name__ == "__main__":
    mango_service_v3_client = MangoServiceV3Client()

    market = mango_service_v3_client.get_market_by_market_name("BTC-PERP")[0]
    print(f"latest btc-perp price is {market.last}")

    mango_service_v3_client.cancel_all_orders()

    balances = mango_service_v3_client.get_balances()
    total_usd_balance = sum([balance.usd_value for balance in balances])

    market = mango_service_v3_client.get_market_by_market_name(MARKET)[0]

    lowest = 25
    fibs = [fib for fib in [fibonacci_of(n) for n in range(10)] if fib < lowest][1:]
    fibs_sum = sum(fibs)

    for i, fib in enumerate(fibs):
        price = market.last * ((100 - fibs[-1] + fib) / 100)
        price = mango_service_v3_client.to_nearest(price, market.price_increment)

        size = (total_usd_balance / market.price) * (fibs[len(fibs) - 1 - i] / fibs_sum)
        size = mango_service_v3_client.to_nearest(size, market.size_increment)
        if size < market.size_increment:
            continue
        print(f"setting order, price: {price}, size: {size}, value: {price * size}")
        mango_service_v3_client.place_order(
            PlaceOrder(
                market=MARKET,
                side="buy",
                price=price,
                type="limit",
                size=size,
                reduce_only=False,
                ioc=False,
                post_only=False,
                client_id=int(time.time()),
            )
        )
    for order in mango_service_v3_client.get_orders():
        print(f"set order at, price: {order.price}, size: {order.size}")
