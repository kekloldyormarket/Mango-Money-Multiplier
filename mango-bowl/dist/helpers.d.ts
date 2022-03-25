import { MangoPerpMarketInfo } from './types';
export declare const wait: (delayMS: number) => Promise<unknown>;
export declare function getDidYouMean(input: string, allowedValues: readonly string[]): string;
export declare function getAllowedValuesText(allowedValues: readonly string[]): string;
export declare function batch<T>(items: T[], batchSize: number): Generator<T[], void, unknown>;
export declare function decimalPlaces(n: number): number;
export declare class CircularBuffer<T> {
    private readonly _bufferSize;
    private _buffer;
    private _index;
    constructor(_bufferSize: number);
    append(value: T): T | undefined;
    items(): Generator<NonNullable<T>, void, unknown>;
    get count(): number;
    clear(): void;
}
export declare const minionReadyChannel: BroadcastChannel;
export declare const mangoProducerReadyChannel: BroadcastChannel;
export declare const mangoDataChannel: BroadcastChannel;
export declare const mangoMarketsChannel: BroadcastChannel;
export declare const cleanupChannel: BroadcastChannel;
export declare function executeAndRetry<T>(operation: (attempt: number) => Promise<T>, { maxRetries }: {
    maxRetries: number;
}): Promise<T>;
export declare function getPerpMarkets(groupName: string): MangoPerpMarketInfo[];
//# sourceMappingURL=helpers.d.ts.map