/// <reference types="node" />
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { Schema } from 'borsh';
import { I80F48 } from '../utils/fixednum';
export declare function deserializeBorsh(schema: Schema, classType: any, buffer: Buffer): any;
export declare class LoggableFillEvent {
    eventType: number;
    takerSide: number;
    makerSlot: number;
    makerOut: boolean;
    timestamp: BN;
    seqNum: BN;
    maker: PublicKey;
    makerOrderId: BN;
    makerClientOrderId: BN;
    makerFee: I80F48;
    bestInitial: BN;
    makerTimestamp: BN;
    taker: PublicKey;
    takerOrderId: BN;
    takerClientOrderId: BN;
    takerFee: I80F48;
    price: BN;
    quantity: BN;
    constructor(decoded: any);
}
export declare const LOGGABLE_SCHEMA: Map<any, any>;
//# sourceMappingURL=loggable.d.ts.map