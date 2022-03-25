export declare const OPS: readonly ["subscribe", "unsubscribe"];
export declare const CHANNELS: readonly ["level3", "level2", "level1", "trades"];
declare const TRADES_MESSAGE_TYPES: readonly ["recent_trades", "trade"];
declare const LEVEL1_MESSAGE_TYPES: readonly ["quote"];
declare const LEVEL2_MESSAGE_TYPES: readonly ["l2snapshot", "l2update"];
declare const LEVEL3_MESSAGE_TYPES: readonly ["l3snapshot", "open", "fill", "change", "done"];
export declare const MESSAGE_TYPES_PER_CHANNEL: {
    [key in Channel]: readonly MessageType[];
};
export declare type Channel = typeof CHANNELS[number];
export declare type Op = typeof OPS[number];
export declare type MessageType = typeof LEVEL3_MESSAGE_TYPES[number] | typeof LEVEL2_MESSAGE_TYPES[number] | typeof LEVEL1_MESSAGE_TYPES[number] | typeof TRADES_MESSAGE_TYPES[number] | 'error' | 'subscribed' | 'unsubscribed';
export declare type L3MessageType = typeof LEVEL3_MESSAGE_TYPES[number];
export {};
//# sourceMappingURL=consts.d.ts.map