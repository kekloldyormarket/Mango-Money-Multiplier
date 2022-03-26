import datetime
import logging
import os
import sys
import time
from dataclasses import dataclass
from decimal import Decimal
from os.path import getmtime

from tenacity import retry, wait_fixed, stop_after_delay, stop_after_attempt

from mango_service_v3_py.api import MangoServiceV3Client
from mango_service_v3_py.dtos import Side, PlaceOrder

# based on https://github.com/BitMEX/sample-market-maker/blob/master/market_maker/market_maker.py
import random
CYCLE_INTERVAL = 1
MARKETS = ["BTC", "SOL", "SRM", "RAY", "FTT", "ADA", "BNB", "AVAX", "LUNA"]
LALA = {}

MAX_ORDERS = 1

watched_files_mtimes = [(f, getmtime(f)) for f in ["example3_market_maker.py"]]

logging.basicConfig(
    format="%(asctime)s %(levelname)-2s %(message)s",
    level=logging.INFO,
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("simple_market_maker")


@dataclass
class SimpleOrder:
    price: float
    side: Side
    size: float

import math
def toNearest(num, tickDec):
    return num# Decimal(round(num / tickDec, 0)) * tickDec
import threading

class MM:
    def __init__(self, market):
        self.mango_service_v3_client = MangoServiceV3Client()
        self.balances = {}
        self.balances2 = None
        self.balance = 0
        self.market = market
        self.MARKET = market
        self.MAX_LONG_POSITION = 0
        self.SIZE = 0
        self.MAX_SHORT_POSITION = 0
        self.start_position_buy = None
        self.start_position_sell = None
        self.positions = None
        LALA = {}
    # todo unused
    @retry(stop=(stop_after_delay(10) | stop_after_attempt(5)), wait=wait_fixed(5))
    def retry_wrapper(self, mango_service_v3_client_method, *arg):
        getattr(self.mango_service_v3_client, mango_service_v3_client_method)(arg)

    def log_recent_trades(self) -> None:
        try:
            trades = self.mango_service_v3_client.get_trades(self.MARKET)
            recent_trades = [
                trade
                for trade in trades
                if datetime.datetime.now((datetime.timezone.utc)) - trade.time
                < datetime.timedelta(seconds=CYCLE_INTERVAL)
            ]
            if recent_trades:
                # todo: should log only my recent trades
                logger.info("- recent trades")
                for trade in recent_trades:
                    logger.info(
                        f" |_ side {trade.side:4}, size {trade.size:6}, price {trade.price:8}, value {trade.price * trade.size}, time: {trade.time.strftime('%H:%M:%S')}"
                    )
                logger.info("")
        except:
            sleep(100)
    def get_ticker(self):
        try:
                self.market = self.mango_service_v3_client.get_market_by_market_name(self.MARKET)[0]
            
                self.start_position_buy = self.market.bid #- self.market.price_increment
                self.start_position_sell = self.market.ask#+ self.market.price_increment
                self.balances = self.mango_service_v3_client.get_account()['marketMarginAvailable']
                for a in self.balances:
                    if self.MARKET.replace('PERP', 'SPOT') == a['name']:
                        self.balance = (a['marginAvailable'] / 2.25)
                self.positions = [
                    position
                    for position in self.mango_service_v3_client.get_open_positions()
                    if position.future == self.MARKET
                ]
                print(1)
                self.balances2 = [
                     balance
                     for balance in self.mango_service_v3_client.get_balances()
                     if balance.coin.split('-')[0] == self.MARKET.split('-')[0]
                ]
                print(2)
                other = "SPOT"
                if 'SPOT' in self.MARKET:
                    other = 'PERP'
                if other == 'PERP':
                    otherpos = [
                        position
                        for position in self.mango_service_v3_client.get_open_positions()
                        if position.future == self.MARKET.split('-')[0] + '-' + other
                    ]
                    print(3)
                else:
                    otherpos = [
                        balance
                        for balance in self.mango_service_v3_client.get_balances()
                        if balance.coin == self.MARKET.split('-')[0] + '-' + other
                    ]
                    print(31)
                diff = 0

                if otherpos != None and self.positions != None:
                    if len(otherpos) > 0 and len(self.positions) > 0:
                        try:
                            diff = abs(otherpos[0].spot_borrow) -  abs(self.positions[0].net_size)
                        except: 
                            diff = abs(otherpos[0].net_size) -  abs(self.balances2[0].spot_borrow)
                print(4)
                mid = (self.market.bid + self.market.ask) / 2
                self.MAX_LONG_POSITION = 0
                self.MAX_SHORT_POSITION = 0
                wantsInKind = {}
                if 'PERP' in self.MARKET:

                    wantsInKind[self.MARKET] = (LALA['wants'][self.MARKET] * self.balance) / mid
                    print('1: ' + str(wantsInKind[self.MARKET]))
                else:
                    wantsInKind[self.MARKET] = (LALA['wants'][self.MARKET] * self.balance) / mid
                    print('2: ' + str(wantsInKind[self.MARKET]))

                if diff >= -1 * 5 / mid:
                    if wantsInKind[self.MARKET] > 0:
                        self.MAX_LONG_POSITION = wantsInKind[self.MARKET]
                        self.SIZE = abs(self.MAX_LONG_POSITION / 100 * 15)
                        if  self.long_position_limit_exceeded():
                            self.MAX_SHORT_POSITION = wantsInKind[self.MARKET] / 10 * -1
                    else:

                        self.MAX_SHORT_POSITION =  wantsInKind[self.MARKET]
                        self.SIZE = abs(self.MAX_SHORT_POSITION / 100 * 15)
                        if  self.short_position_limit_exceeded():
                            self.MAX_LONG_POSITION = wantsInKind[self.MARKET] / 10 * -1

                
        except:
            sleep(random.randint(10,30))   
            return self.get_ticker()     
    def get_price_offset(self, index):
        try:
            start_position = (
                self.start_position_buy if index < 0 else self.start_position_sell
            )
            index = index  if index < 0 else index# - 1
            return toNearest(
                Decimal(start_position) * Decimal(1 + self.market.price_increment) ** index,
                Decimal(str(self.market.price_increment)),
            )

        except:
            sleep(10)
    def prepare_order(self, index) -> SimpleOrder:
        try:
            size = Decimal(str(self.SIZE)) + ((abs(index) - 1) * Decimal(str(self.SIZE)))
            price = self.get_price_offset(index)
            
            return SimpleOrder(price=price, size=size, side="buy" if index < 0 else "sell")

        except:
            sleep(10)
    def converge_orders(self, buy_orders, sell_orders):
        try:
            to_create = []
            to_cancel = []
            buys_matched = 0
            sells_matched = 0
            existing_orders = self.mango_service_v3_client.get_orders_by_market_name(self.MARKET)
            
            existing_orders = sorted(existing_orders, key=lambda order_: order_.price)
            buy_orders = sorted(buy_orders, key=lambda order_: order_.price)
            sell_orders = sorted(sell_orders, key=lambda order_: order_.price)

            for order in existing_orders:
                try:
                    if order.side == "buy":
                        desired_order = buy_orders[buys_matched]
                        buys_matched += 1
                    else:
                        desired_order = sell_orders[sells_matched]
                        sells_matched += 1

                    if desired_order.size != Decimal(str(order.size)) or (
                        desired_order.price != Decimal(str(order.price))
                        and abs((desired_order.price / Decimal(str(order.price))) - 1)
                        > 0.01
                    ):
                        to_cancel.append(order)
                        to_create.append(desired_order)

                except IndexError:
                    to_cancel.append(order)

            while buys_matched < len(buy_orders):
                to_create.append(buy_orders[buys_matched])
                buys_matched += 1

            while sells_matched < len(sell_orders):
                to_create.append(sell_orders[sells_matched])
                sells_matched += 1

            if len(to_cancel) > 0:
                roll = random.randint(1,10)
                if roll >= 0:
                    logger.info(f"- cancelling {len(to_cancel)} orders...")
                    for order in sorted(to_create, key=lambda order: order.price, reverse=True):
                        logger.info(
                            f" |_ side {order.side:4}, size {order.size}, price {order.price}, value {order.price * order.size}"
                        )
                    for order in to_cancel:
                    
                        try:
                            self.mango_service_v3_client.cancel_order_by_order_id(order.id)
                        except:
                            pass
                    logger.info("")
            else:
                logger.info("- no orders to cancel")

            if len(to_create) > 0:
                logger.info(f"- creating {len(to_create)} orders...")
                for order in [
                    order
                    for order in sorted(
                        to_create, key=lambda order: order.price, reverse=True
                    )
                    if order.side == "sell"
                ]:
                    logger.info(
                        f" |_ price {order.price}, side {order.side:4}, size {order.size}, value {order.price * order.size}"
                    )
                logger.info(
                    f"    current bid -> {self.market.bid}, ask {self.market.ask} <- ask "
                )
                for order in [
                    order
                    for order in sorted(
                        to_create, key=lambda order: order.price, reverse=True
                    )
                    if order.side == "buy"
                ]:
                    logger.info(
                        f" |_ price {order.price}, side {order.side:4}, size {order.size}, value {order.price * order.size}"
                    )
                market = False 
                if len(self.positions) > 0:
                    if abs(self.MAX_LONG_POSITION) > abs(self.MAX_SHORT_POSITION):

                        if abs((self.positions[0].net_size) / self.mid) / abs(self.MAX_LONG_POSITION) > 0.5:
                            market = True 
                    else:
                        if abs((self.positions[0].net_size) / self.mid) / abs(self.MAX_SHORT_POSITION) > 0.5:
                            market = True
                #else:
                #    market = True 
                logger.info("market?")
                logger.info(str(market))
                if market == True and (order.size) > 0:
                    for order in to_create:
                        self.mango_service_v3_client.place_order(
                            PlaceOrder(
                                market=self.MARKET,
                                side=order.side,
price=order.price,
                                type="limit",
                                size=order.size,
                                reduce_only=False,
                                ioc=False,
                                post_only=False,
                                client_id=123,
                            )
                        )
                elif market == False and (order.size) > 0:
                    for order in to_create:
                        self.mango_service_v3_client.place_order(
                            PlaceOrder(
                                market=self.MARKET,
                                side=order.side,
                                price=order.price,
                                type="limit",
                                size=order.size,
                                reduce_only=False,
                                ioc=False,
                                post_only=True,
                                client_id=123,
                            )
                        )
                print('wat')
                logger.info("")
            else:
                logger.info("- no orders to create, current open orders")
                for order in sorted(
                    existing_orders, key=lambda order: order.price, reverse=True
                ):
                    logger.info(
                        f" |_ side {order.side:4}, size {order.size}, price {order.price}, value {order.price * order.size}"
                    )

        except:
            sleep(10)
    def long_position_limit_exceeded(self):
        try:
            if len(self.positions) == 0:
                return False
            return self.positions[0].net_size >= self.MAX_LONG_POSITION

        except:
            sleep(10)
    def short_position_limit_exceeded(self):
        try:
            if len(self.positions) == 0:
                return False
            return self.positions[0].net_size <= self.MAX_SHORT_POSITION

        except:
            sleep(10)
    def place_orders(self):
        try:    
            buy_orders = []
            sell_orders = []
            if not self.long_position_limit_exceeded():
                for i in reversed(range(1, 2 + 1)):
                    buy_orders.append(self.prepare_order(-i))
            else:
                logger.info(
                    f"- skipping adding to longs, current position {self.positions[0].net_size}"
                )
            if not self.short_position_limit_exceeded():
                for i in reversed(range(1, MAX_ORDERS + 1)):
                    sell_orders.append(self.prepare_order(i))
            else:
                logger.info(
                    f"- skipping adding to shorts, current position {self.positions[0].net_size}"
                )
            return self.converge_orders(buy_orders, sell_orders)

        except:
            sleep(10)
    def check_file_change(self):
        try:
            for f, mtime in watched_files_mtimes:
                if getmtime(f) > mtime:
                    self.restart()
        except:
            sleep(10)
    def restart(self):
        logger.info("------------------------------")
        logger.info("restarting the market maker...")
        os.execv(sys.executable, [sys.executable] + sys.argv)
import shutil, json

def aThread(market):
    print('starting ' + market)
    mm = MM(market)
    
    logger.info("cancelling all orders...")

    try:
        mm.mango_service_v3_client.cancel_all_orders()
    except Exception as e:
        
        logger.error(f"Exception: {e}")

    while True:
        CYCLE_INTERVAL = random.randint(1,30) * 5#mm.mango_service_v3_client.lenAccs
        

        logger.info("next cycle...")
        try:
            mm.check_file_change()
            mm.log_recent_trades()
            mm.get_ticker()
            
            mm.place_orders()
            time.sleep(CYCLE_INTERVAL)

            mm.mango_service_v3_client = MangoServiceV3Client()
            logger.info("")
        except Exception as e:
            logger.error(f"Exception: {e}")
            time.sleep(CYCLE_INTERVAL * 100)
            logger.info("")
from time import sleep
if __name__ == "__main__":
    done = False 
    while done == False:
        try:
            shutil.copy("./lala.json", "./lala2.json")
            shutil.copy("./lala.json", "../lala2.json")
            
            with open("./lala2.json", "r") as f:
                LALA = json.loads(f.read())
                done = True
        except Exception as e:
            try:
                with open("./lala.json", "r") as f:
                    LALA = json.loads(f.read())
                done = True
            except Exception as e:
                
                sleep(1)
    for market in MARKETS:
        for meh in ['-SPOT', '-PERP']:
            t = threading.Thread(target=aThread, args=(market + meh,))
            t.daemon = True 
            t.start()
    while True: 
       # print(threading.active_count())
        done = False 
        while done == False:
            try:
                shutil.copy("./lala.json", "./lala2.json")
                shutil.copy("./lala.json", "../lala2.json")
                
                with open("./lala2.json", "r") as f:
                    LALA = json.loads(f.read())
                    done = True
            except Exception as e:
                try:
                    with open("./lala.json", "r") as f:
                        LALA = json.loads(f.read())
                    done = True
                except Exception as e:
                    
                    sleep(1)
        
