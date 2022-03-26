import pytest

from mango_service_v3_py.api import MangoServiceV3Client
from mango_service_v3_py.dtos import PlaceOrder


@pytest.fixture
def mango_service_v3_client():
    return MangoServiceV3Client("http://localhost:3001/api", timeout=60.0)


@pytest.fixture(autouse=True)
def run_around_tests(mango_service_v3_client):
    # cleanup
    mango_service_v3_client.cancel_all_orders()
    orders = mango_service_v3_client.get_orders()
    assert len(orders) == 0
    yield
    # teardown
    assert True


def place_order(mango_service_v3_client, market):
    mango_service_v3_client.place_order(
        PlaceOrder(
            market=market,
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


SPOT_AND_PERP_MARKETS = [("BTC-PERP"), ("BTC-SPOT")]
PERP_MARKET = [("BTC-PERP")]


@pytest.mark.parametrize("market", PERP_MARKET)
def test_get_positions(mango_service_v3_client, market):
    positions = mango_service_v3_client.get_open_positions()
    assert len(positions) > 0


@pytest.mark.parametrize("market", SPOT_AND_PERP_MARKETS)
def test_get_balances(mango_service_v3_client, market):
    balances = mango_service_v3_client.get_balances()
    assert len(balances) > 0


@pytest.mark.parametrize("market", SPOT_AND_PERP_MARKETS)
def test_place_order(mango_service_v3_client, market):
    mango_service_v3_client.cancel_all_orders()
    place_order(mango_service_v3_client, market)
    orders = mango_service_v3_client.get_orders()
    assert len(orders) == 1

    order = orders[0]
    print(order)
    assert order.market == market
    assert order.price == 20000
    assert order.size == 0.0001


@pytest.mark.parametrize("market", SPOT_AND_PERP_MARKETS)
def test_cancel_order_by_order_id(mango_service_v3_client, market):
    place_order(mango_service_v3_client, market)

    orders = mango_service_v3_client.get_orders()
    order = orders[0]
    mango_service_v3_client.cancel_order_by_order_id(order.id)

    orders = mango_service_v3_client.get_orders()
    assert len(orders) == 0


@pytest.mark.parametrize("market", SPOT_AND_PERP_MARKETS)
def test_cancel_order_by_client_id(mango_service_v3_client, market):
    place_order(mango_service_v3_client, market)

    orders = mango_service_v3_client.get_orders()
    order = orders[0]
    mango_service_v3_client.cancel_order_by_client_id(order.client_id)

    orders = mango_service_v3_client.get_orders()
    assert len(orders) == 0
