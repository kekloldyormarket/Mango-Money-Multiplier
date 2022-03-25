/// <reference types="node" />
import BN from 'bn.js';
import Big from 'big.js';
export declare class I80F48 {
    /**
    This is represented by a 128 bit signed integer underneath
    The first 80 bits are treated as an integer and last 48 bits are treated as fractional part after binary point
    It's possible to think of an I80F48 as an i128 divided by 2 ^ 40
  
    Read up on how fixed point math works: https://inst.eecs.berkeley.edu/~cs61c/sp06/handout/fixedpt.html
    Read up on how 2s complement works: https://en.wikipedia.org/wiki/Two%27s_complement
     */
    static MAX_SIZE: number;
    static FRACTIONS: number;
    static MULTIPLIER_BIG: Big;
    static MULTIPLIER_BN: BN;
    static MULTIPLIER_NUMBER: number;
    static MAX_BN: BN;
    static MIN_BN: BN;
    data: BN;
    constructor(data: BN);
    static fromNumber(x: number): I80F48;
    static fromNumberOrUndef(x?: number): I80F48 | undefined;
    static fromOptionalString(x?: string): I80F48 | undefined;
    static fromString(x: string): I80F48;
    static fromI64(x: BN): I80F48;
    static fromU64(x: BN): I80F48;
    toTwos(): BN;
    toString(): string;
    /**
     * The number will be rounded first for UI sensibilities, then toFixed
     */
    toFixed(decimals?: number): string;
    toLocaleString(locales?: string | string[], options?: Intl.NumberFormatOptions): string;
    toBig(): Big;
    static fromBig(x: Big): I80F48;
    toNumber(): number;
    static fromArray(src: Uint8Array): I80F48;
    toArray(): Uint8Array;
    toArrayLike(ArrayType: typeof Buffer, endian?: BN.Endianness, length?: number): Buffer;
    getData(): BN;
    getBinaryLayout(): string;
    add(x: I80F48): I80F48;
    sub(x: I80F48): I80F48;
    iadd(x: I80F48): I80F48;
    isub(x: I80F48): I80F48;
    floor(): I80F48;
    ceil(): I80F48;
    frac(): I80F48;
    /**
     * Multiply the two and shift
     */
    mul(x: I80F48): I80F48;
    imul(x: I80F48): I80F48;
    div(x: I80F48): I80F48;
    idiv(x: I80F48): I80F48;
    gt(x: I80F48): boolean;
    lt(x: I80F48): boolean;
    gte(x: I80F48): boolean;
    lte(x: I80F48): boolean;
    eq(x: I80F48): boolean;
    cmp(x: I80F48): -1 | 0 | 1;
    neg(): I80F48;
    isPos(): boolean;
    isNeg(): boolean;
    isZero(): boolean;
    min(x: I80F48): I80F48;
    max(x: I80F48): I80F48;
    abs(): I80F48;
}
/** @internal */
export declare const ONE_I80F48: I80F48;
/** @internal */
export declare const ZERO_I80F48: I80F48;
/** @internal */
export declare const NEG_ONE_I80F48: I80F48;
//# sourceMappingURL=fixednum.d.ts.map