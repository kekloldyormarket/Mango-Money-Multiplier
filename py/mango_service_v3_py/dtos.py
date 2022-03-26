from datetime import datetime
from typing import List
from typing import Optional
from typing import Union

from pydantic import BaseModel
from typing_extensions import Literal

Side = Union[Literal["buy"], Literal["sell"]]


def to_camel_case(snake_str):
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


class CamelCaseModel(BaseModel):
    class Config:
        alias_generator = to_camel_case
        allow_population_by_field_name = True


class Balance(CamelCaseModel):
    coin: str
    free: float
    spot_borrow: float
    total: float
    usd_value: float
    available_without_borrow: float


class Market(CamelCaseModel):
    name: str
    base_currency: str
    quote_currency: str
    quote_volume24_h: Optional[float]
    change1_h: Optional[float]
    change24_h: Optional[float]
    change_bod: Optional[float]
    high_leverage_fee_exempt: Optional[bool]
    min_provide_size: Optional[float]
    type: str
    underlying: Optional[str]
    enabled: Optional[bool]
    ask: Optional[int]  # optional for devnet
    bid: Optional[int]  # optional for devnet
    last: Optional[float]  # optional for devnet
    post_only: Optional[bool]
    price: Optional[float]  # optional for devnet
    price_increment: float
    size_increment: float
    restricted: Optional[bool]
    volume_usd24_h: Optional[float]


class Orderbook(CamelCaseModel):
    asks: List[List[float]]
    bids: List[List[float]]


class Trade(CamelCaseModel):
    id: str
    liquidation: Optional[bool]
    price: float
    side: str
    size: float
    time: datetime


class Candle(CamelCaseModel):
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float


class Position(CamelCaseModel):
    cost: float
    cumulative_buy_size: Optional[float]
    cumulative_sell_size: Optional[float]
    entry_price: float
    estimated_liquidation_price: Optional[float]
    future: str
    initial_margin_requirement: Optional[float]
    long_order_size: Optional[float]
    maintenance_margin_requirement: Optional[float]
    net_size: Optional[float]
    open_size: Optional[float]
    realized_pnl: Optional[float]
    recent_average_open_price: Optional[float]
    recent_break_even_price: Optional[float]
    recent_pnl: Optional[float]
    short_order_size: Optional[float]
    side: str
    size: float
    unrealized_pnl: Optional[float]
    collateral_used: Optional[float]


class Order(CamelCaseModel):
    created_at: Optional[datetime]  # optional for spot
    filled_size: Optional[int]
    future: str
    id: int
    market: str
    price: float
    avg_fill_price: Optional[float]
    remaining_size: Optional[int]
    side: Side
    size: float
    status: Optional[str]
    type: Optional[str]
    reduce_only: Optional[bool]
    ioc: Optional[bool]
    post_only: Optional[bool]
    client_id: Optional[str]


class PlaceOrder(CamelCaseModel):
    market: str
    side: Side
    price: int
    type: str
    size: float
    reduce_only: bool
    ioc: bool
    post_only: bool
    client_id: int


class BadRequestError(CamelCaseModel):
    msg: str
