import BN from 'bn.js';
import { FillEvent, LiquidateEvent, OutEvent } from '.';
export default class PerpEventQueue {
    head: BN;
    count: BN;
    seqNum: BN;
    events: any[];
    constructor(decoded: any);
    getUnconsumedEvents(): {
        fill?: FillEvent;
        out?: OutEvent;
        liquidate?: LiquidateEvent;
    }[];
    /**
     * Returns events since the lastSeqNum you've seen. If you haven't seen any yet,
     * send in undefined for lastSeqNum
     */
    eventsSince(lastSeqNum?: BN): {
        fill?: FillEvent;
        out?: OutEvent;
        liquidate?: LiquidateEvent;
    }[];
}
//# sourceMappingURL=PerpEventQueue.d.ts.map