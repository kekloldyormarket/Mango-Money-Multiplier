import Controller from "./controller.interface";
import { NextFunction, Request, Response, Router } from "express";
import MangoSimpleClient from "./mango.simple.client";
import { patchInternalMarketName } from "./utils";
import {
  getAllMarkets,
  MarketConfig,
  nativeI80F48ToUi,
  QUOTE_INDEX,
} from "@blockworks-foundation/mango-client";

/**
 * Houses every non-ftx style, mango specific information
 */
export class AccountController implements Controller {
  public path = "/api/mango";
  public router = Router();

  constructor(public mangoSimpleClient: MangoSimpleClient) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // GET /account
    this.router.get(`${this.path}/account`, this.fetchMangoAccount);
  }

  private fetchMangoAccount = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const accountInternalDto = await this.fetchAccountInternal();
    response.send({
      success: true,
      result: accountInternalDto,
    } as AccountDto);
  };

  private async fetchAccountInternal(): Promise<AccountInternalDto> {
    let allMarketConfigs = getAllMarkets(
      this.mangoSimpleClient.mangoGroupConfig
    );

    const marketMarginAvailableListDtos = await this.getMarketMarginAvailable(
      allMarketConfigs
    );
    const spotOpenOrdersAccountDtos =
      this.getSpotOpenOrdersAccount(allMarketConfigs);
    return {
      spotOpenOrdersAccounts: spotOpenOrdersAccountDtos,
      marketMarginAvailable: marketMarginAvailableListDtos,
    } as AccountInternalDto;
  }

  private async getMarketMarginAvailable(
    allMarketConfigs: MarketConfig[]
  ): Promise<MarketMarginAvailableListDto[]> {
    const mangoCache = await this.mangoSimpleClient.mangoGroup.loadCache(
      this.mangoSimpleClient.connection
    );
    const marketMarginAvailableDtos: MarketMarginAvailableListDto[] = [];
    for (let marketConfig of allMarketConfigs) {
      marketMarginAvailableDtos.push({
        name: patchInternalMarketName(marketConfig.name),
        marginAvailable: nativeI80F48ToUi(
          this.mangoSimpleClient.mangoAccount.getMarketMarginAvailable(
            this.mangoSimpleClient.mangoGroup,
            mangoCache,
            marketConfig.marketIndex,
            marketConfig.kind
          ),
          this.mangoSimpleClient.mangoGroup.tokens[QUOTE_INDEX].decimals
        ).toNumber(),
      } as MarketMarginAvailableListDto);
    }
    return marketMarginAvailableDtos;
  }

  private getSpotOpenOrdersAccount(allMarketConfigs: MarketConfig[]) {
    const spotOpenOrdersAccountDtos = allMarketConfigs
      .filter((marketConfig) => !marketConfig.name.includes("PERP"))
      .map((spotMarketConfig) =>
        this.getSpotOpenOrdersAccountForMarket(spotMarketConfig)
      )
      // filter markets where a spotOpenOrdersAccount exists
      .filter(
        (spotOpenOrdersAccount) => spotOpenOrdersAccount.publicKey != null
      );
    return spotOpenOrdersAccountDtos;
  }

  private getSpotOpenOrdersAccountForMarket(
    marketConfig: MarketConfig
  ): SpotOpenOrdersAccountDto {
    const spotOpenOrdersAccount =
      this.mangoSimpleClient.getSpotOpenOrdersAccount(marketConfig);

    return {
      name: patchInternalMarketName(marketConfig.name),
      publicKey: spotOpenOrdersAccount
        ? spotOpenOrdersAccount.toBase58()
        : null,
    } as SpotOpenOrdersAccountDto;
  }
}

/**
 * {
  "success": true,
  "result": {
    "spotOpenOrdersAccounts": [
      {
        "name": "MNGO-SPOT",
        "publicKey": "..."
      },
      ...
    ],
  "marketMarginAvailable": [
      {
          "name": "MNGO-SPOT",
          "marginAvailable": ...
      },
      ...
    ],
  }
}
 */
interface AccountDto {
  success: boolean;
  result: AccountInternalDto;
}

interface AccountInternalDto {
  spotOpenOrdersAccounts: SpotOpenOrdersAccountDto[];
  marketMarginAvailable: MarketMarginAvailableListDto[];
}

interface SpotOpenOrdersAccountDto {
  name: string;
  publicKey: string;
}
interface MarketMarginAvailableListDto {
  name: string;
  marginAvailable: number;
}
