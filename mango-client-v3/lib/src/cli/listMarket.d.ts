import { Account, Connection, PublicKey } from '@solana/web3.js';
export default function listMarket(connection: Connection, payer: Account, mangoProgramId: PublicKey, baseMint: PublicKey, quoteMint: PublicKey, baseLotSize: number, quoteLotSize: number, dexProgramId: PublicKey): Promise<PublicKey>;
//# sourceMappingURL=listMarket.d.ts.map