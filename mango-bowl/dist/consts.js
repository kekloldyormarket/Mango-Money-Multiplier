"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_TYPES_PER_CHANNEL = exports.CHANNELS = exports.OPS = void 0;
exports.OPS = ['subscribe', 'unsubscribe'];
exports.CHANNELS = ['level3', 'level2', 'level1', 'trades'];
const TRADES_MESSAGE_TYPES = ['recent_trades', 'trade'];
const LEVEL1_MESSAGE_TYPES = ['quote'];
const LEVEL2_MESSAGE_TYPES = ['l2snapshot', 'l2update'];
const LEVEL3_MESSAGE_TYPES = ['l3snapshot', 'open', 'fill', 'change', 'done'];
exports.MESSAGE_TYPES_PER_CHANNEL = {
    trades: TRADES_MESSAGE_TYPES,
    level1: LEVEL1_MESSAGE_TYPES,
    level2: LEVEL2_MESSAGE_TYPES,
    level3: LEVEL3_MESSAGE_TYPES
};
//# sourceMappingURL=consts.js.map