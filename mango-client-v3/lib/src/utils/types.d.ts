import { PublicKey, Transaction } from '@solana/web3.js';
/** @internal */
export declare type Modify<T, R> = Omit<T, keyof R> & R;
export interface WalletAdapter {
    publicKey: PublicKey;
    autoApprove: boolean;
    connected: boolean;
    signTransaction: (transaction: Transaction) => Promise<Transaction>;
    signAllTransactions: (transaction: Transaction[]) => Promise<Transaction[]>;
    connect: () => any;
    disconnect: () => any;
    on(event: string, fn: () => void): this;
}
export declare type PerpOrderType = 'limit' | 'ioc' | 'postOnly' | 'market' | 'postOnlySlide';
export declare type BlockhashTimes = {
    blockhash: string;
    timestamp: number;
};
//# sourceMappingURL=types.d.ts.map