from mango_service_v3_py.api import MangoServiceV3Client
from mango_service_v3_py.dtos import PlaceOrder

if __name__ == "__main__":

    mango_service_v3_client = MangoServiceV3Client()

    for position in mango_service_v3_client.get_open_positions():
        print(position.json(indent=4, sort_keys=True))

    for balance in mango_service_v3_client.get_balances():
        print(balance.json(indent=4, sort_keys=True))

    for market in mango_service_v3_client.get_markets():
        print(market.json(indent=4, sort_keys=True))
    """
    print(
        mango_service_v3_client.get_market_by_market_name("BTC/USDC").json(
            indent=4, sort_keys=True
        )
    )

    for order in mango_service_v3_client.get_orderbook("BTC/USDC"):
        print(order.json(indent=4, sort_keys=True))

    for trade in mango_service_v3_client.get_trades("BTC/USDC"):
        print(trade.json(indent=4, sort_keys=True))

    for candle in mango_service_v3_client.get_candles(
        "BTC/USDC", 60, 1625922900, 1631214960
    ):
        print(candle.json(indent=4, sort_keys=True))

    for order in mango_service_v3_client.get_orders():
        print(order.json(indent=4, sort_keys=True))
    for order in mango_service_v3_client.get_orders_by_market_name("BTC/USDC"):
        print(order.json(indent=4, sort_keys=True))

    mango_service_v3_client.place_order(
        PlaceOrder(
            market="BTC/USDC",
            side="buy",
            price=20000,
            type="limit",
            size=0.0001,
            reduce_only=False,
            ioc=False,
            post_only=False,
            client_id=123,
        )
    )
    for order in mango_service_v3_client.get_orders():
        print(order.json(indent=4, sort_keys=True))

    mango_service_v3_client.cancel_order_by_client_id("123")
    for order in mango_service_v3_client.get_orders():
        print(order.json(indent=4, sort_keys=True))

    mango_service_v3_client.place_order(
        PlaceOrder(
            market="BTC/USDC",
            side="buy",
            price=2000,
            type="limit",
            size=0.0001,
            reduce_only=False,
            ioc=False,
            post_only=False,
            client_id=123,
        )
    )
    for order in mango_service_v3_client.get_orders():
        print(order.json(indent=4, sort_keys=True))

    mango_service_v3_client.cancel_order_by_client_id("123")
    for order in mango_service_v3_client.get_orders():
        print(order.json(indent=4, sort_keys=True))

    mango_service_v3_client.cancel_all_orders()
    for order in mango_service_v3_client.get_orders():
        print(order.json(indent=4, sort_keys=True))
    """