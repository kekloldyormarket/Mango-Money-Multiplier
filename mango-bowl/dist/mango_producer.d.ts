import { MessageType } from './consts';
import { MangoPerpMarketInfo } from './types';
export declare class MangoProducer {
    private readonly _options;
    constructor(_options: {
        nodeEndpoint: string;
        wsEndpointPort: number | undefined;
        market: MangoPerpMarketInfo;
        commitment: string;
    });
    run(onData: OnDataCallback): Promise<void>;
}
export declare type MessageEnvelope = {
    type: MessageType;
    market: string;
    publish: boolean;
    payload: string;
    timestamp: string;
};
declare type OnDataCallback = (envelopes: MessageEnvelope[]) => void;
export {};
//# sourceMappingURL=mango_producer.d.ts.map