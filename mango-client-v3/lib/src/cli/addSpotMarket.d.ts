import { Account, Connection, PublicKey } from '@solana/web3.js';
import { GroupConfig } from '../config';
export default function addSpotMarket(connection: Connection, payer: Account, groupConfig: GroupConfig, symbol: string, spotMarket: PublicKey, baseMint: PublicKey, maintLeverage: number, initLeverage: number, liquidationFee: number, optimalUtil: number, optimalRate: number, maxRate: number): Promise<GroupConfig>;
//# sourceMappingURL=addSpotMarket.d.ts.map