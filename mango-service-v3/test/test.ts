import * as assert from "assert";
import MangoSimpleClient from "../src/mango.simple.client";

describe("test simple client", async () => {
  it("test placing perp orders", async () => {
    const msc = await MangoSimpleClient.create();
    await msc.cancelAllOrders()
    
    await msc.placeOrder("BTC-PERP", "limit", "buy", 0.0001, 40000);
    const orders = await msc.fetchAllBidsAndAsks(true, "BTC-PERP");
    assert.equal(orders.length, 1)
  });
});
