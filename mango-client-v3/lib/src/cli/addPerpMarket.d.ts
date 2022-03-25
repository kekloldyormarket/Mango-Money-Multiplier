import { Account, Connection } from '@solana/web3.js';
import { GroupConfig } from '../config';
export default function addPerpMarket(connection: Connection, payer: Account, groupConfig: GroupConfig, symbol: string, maintLeverage: number, initLeverage: number, liquidationFee: number, makerFee: number, takerFee: number, baseLotSize: number, quoteLotSize: number, maxNumEvents: number, rate: number, maxDepthBps: number, targetPeriodLength: number, mngoPerPeriod: number, exp: number): Promise<GroupConfig>;
//# sourceMappingURL=addPerpMarket.d.ts.map