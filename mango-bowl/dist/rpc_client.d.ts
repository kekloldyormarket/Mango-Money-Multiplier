/// <reference types="node" />
import { PerpMarket } from '@blockworks-foundation/mango-client';
import { AccountInfo, Commitment, PublicKey } from '@solana/web3.js';
export declare class RPCClient {
    private readonly _options;
    constructor(_options: {
        readonly nodeEndpoint: string;
        readonly wsEndpointPort: number | undefined;
        readonly commitment: string;
    });
    streamAccountsNotification(market: PerpMarket, marketName: string): AsyncIterable<AccountsNotification>;
    getAccountInfo(publicKey: PublicKey, commitment?: Commitment): Promise<AccountInfo<Buffer> | null>;
    private _getAccountInfoRPCResponseRaw;
}
export declare type AccountsNotification = AccountsNotificationPayload;
export declare type AccountsNotificationPayload = {
    readonly accountsData: AccountsData;
    readonly slot: number;
};
export declare type AccountName = 'bids' | 'asks' | 'eventQueue';
export declare type AccountsData = {
    [key in AccountName]?: Buffer;
};
//# sourceMappingURL=rpc_client.d.ts.map