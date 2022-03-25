import { Connection, PublicKey } from '@solana/web3.js';
export declare class TokenAccount {
    publicKey: PublicKey;
    mint: PublicKey;
    owner: PublicKey;
    amount: number;
    constructor(publicKey: PublicKey, decoded: any);
}
export declare function getTokenAccountsByOwnerWithWrappedSol(connection: Connection, owner: PublicKey): Promise<TokenAccount[]>;
export declare function findLargestTokenAccountForOwner(connection: Connection, owner: PublicKey, mint: PublicKey): Promise<TokenAccount>;
//# sourceMappingURL=token.d.ts.map