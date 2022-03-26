import pytest

from mango_service_v3_py.api import MangoServiceV3Client
from mango_service_v3_py.dtos import PlaceOrder

# Note: some endpoints only return useful data for mainnet, this is because the REST API service rely on
# other off chain REST services which only serve data for mainnet


@pytest.fixture
def mango_service_v3_client():
    return MangoServiceV3Client("http://localhost:3000/api", timeout=60.0)


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


@pytest.mark.parametrize("market", SPOT_AND_PERP_MARKETS)
def test_get_markets(mango_service_v3_client, market):
    markets = mango_service_v3_client.get_markets()
    assert len(markets) > 0


@pytest.mark.parametrize("market", SPOT_AND_PERP_MARKETS)
def test_get_candles(mango_service_v3_client, market):
    candles = mango_service_v3_client.get_candles(market, 60, 1625922900, 1631214960)
    print(candles)
    assert len(candles) > 0


@pytest.mark.parametrize("market", SPOT_AND_PERP_MARKETS)
def test_get_orderbook(mango_service_v3_client, market):
    ob = mango_service_v3_client.get_orderbook(market)
    assert len(ob.asks) > 0
    assert len(ob.bids) > 0


@pytest.mark.parametrize("market", SPOT_AND_PERP_MARKETS)
def test_get_trades(mango_service_v3_client, market):
    trades = mango_service_v3_client.get_trades(market)
    assert len(trades) > 0
