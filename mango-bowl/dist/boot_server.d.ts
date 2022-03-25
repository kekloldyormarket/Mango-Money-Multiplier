import { MangoPerpMarketInfo } from './types';
export declare function bootServer({ port, nodeEndpoint, wsEndpointPort, minionsCount, markets, commitment }: BootOptions): Promise<void>;
export declare function stopServer(): Promise<void>;
declare type BootOptions = {
    port: number;
    nodeEndpoint: string;
    wsEndpointPort: number | undefined;
    minionsCount: number;
    commitment: string;
    markets: MangoPerpMarketInfo[];
};
export {};
//# sourceMappingURL=boot_server.d.ts.map