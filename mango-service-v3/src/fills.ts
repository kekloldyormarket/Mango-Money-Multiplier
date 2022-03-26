import Controller from "./controller.interface";
import { NextFunction, Request, Response, Router } from "express";
import MangoSimpleClient from "./mango.simple.client";
import { query, validationResult } from "express-validator";
import { isValidPerpMarket, logger, patchExternalMarketName } from "./utils";
import { BadRequestError, RequestErrorCustom } from "./dtos";
import fetch from "node-fetch";

export class FillsController implements Controller {
  public path = "/api/fills";
  public router = Router();

  constructor(public mangoSimpleClient: MangoSimpleClient) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // GET /fills?market={market_name}
    this.router.get(
      this.path,
      query("market").custom(isValidPerpMarket).optional(),
      query("page").isNumeric().optional(),
      this.getPerpFills
    );
  }

  private getPerpFills = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response
        .status(400)
        .json({ errors: errors.array() as BadRequestError[] });
    }

    const marketName = request.query.market
      ? patchExternalMarketName(String(request.query.market))
      : undefined;
    const page = request.query.page;

    const allMarkets = await this.mangoSimpleClient.fetchAllMarkets(marketName);
    const market = allMarkets[Object.keys(allMarkets)[0]];

    // note: flip to example while developing
    // let eventHistoryPerpTradesUrl = `https://event-history-api.herokuapp.com/perp_trades/CGp2BQS5vgySstS1LHQh46FmPVNZNv9EcgtaaJo7o1yB`;
    let eventHistoryPerpTradesUrl = `https://event-history-api.herokuapp.com/perp_trades/${this.mangoSimpleClient.mangoAccount.publicKey.toBase58()}`;
    if (page) {
      eventHistoryPerpTradesUrl = eventHistoryPerpTradesUrl + `?page=${page}`;
    }
    fetch(eventHistoryPerpTradesUrl)
      .then(async (tradesResponse) => {
        const parsedTradesResponse = (await tradesResponse.json()) as any;
        const tradesAcrossAllPerpMarkets = parsedTradesResponse["data"];
        const tradesForMarket = tradesAcrossAllPerpMarkets.filter(
          (trade: any) => trade.address === market.publicKey.toBase58()
        );
        return response.send({ success: true, result: tradesForMarket });
      })
      .catch((error) => {
        logger.error(`message - ${error.message}, ${error.stack}`);
        return response.status(500).send({
          errors: [{ msg: error.message } as RequestErrorCustom],
        });
      });
  };
}
