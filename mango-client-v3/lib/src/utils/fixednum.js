"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEG_ONE_I80F48 = exports.ZERO_I80F48 = exports.ONE_I80F48 = exports.I80F48 = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const big_js_1 = __importDefault(require("big.js"));
// TODO - this whole class is inefficient; consider optimizing
class I80F48 {
    constructor(data) {
        if (data.lt(I80F48.MIN_BN) || data.gt(I80F48.MAX_BN)) {
            throw new Error('Number out of range');
        }
        this.data = data;
    }
    static fromNumber(x) {
        let int_part = Math.trunc(x);
        let v = new bn_js_1.default(int_part).iushln(48);
        v.iadd(new bn_js_1.default((x - int_part) * I80F48.MULTIPLIER_NUMBER));
        return new I80F48(v);
    }
    static fromNumberOrUndef(x) {
        return x === undefined ? undefined : I80F48.fromNumber(x);
    }
    static fromOptionalString(x) {
        return x ? I80F48.fromString(x) : undefined;
    }
    static fromString(x) {
        const initialValue = new big_js_1.default(x).times(I80F48.MULTIPLIER_BIG);
        const fixedPointValue = new bn_js_1.default(initialValue.round().toFixed());
        return new I80F48(fixedPointValue);
    }
    static fromI64(x) {
        return new I80F48(x.ushln(48));
    }
    static fromU64(x) {
        return new I80F48(x.ushln(48));
    }
    toTwos() {
        return this.data.toTwos(I80F48.MAX_SIZE);
    }
    toString() {
        return this.toBig().toFixed();
    }
    /**
     * The number will be rounded first for UI sensibilities, then toFixed
     */
    toFixed(decimals) {
        return this.toBig().round(14).toFixed(decimals);
    }
    toLocaleString(locales, options) {
        return this.toNumber().toLocaleString(locales, options);
    }
    toBig() {
        return new big_js_1.default(this.data.toString()).div(I80F48.MULTIPLIER_BIG);
    }
    static fromBig(x) {
        return new I80F48(new bn_js_1.default(x.mul(I80F48.MULTIPLIER_BIG).round().toFixed()));
    }
    toNumber() {
        return this.toBig().toNumber();
    }
    static fromArray(src) {
        if (src.length !== 16) {
            throw new Error('Uint8Array must be of length 16');
        }
        return new I80F48(new bn_js_1.default(src, 'le').fromTwos(I80F48.MAX_SIZE));
    }
    toArray() {
        return new Uint8Array(this.data.toTwos(I80F48.MAX_SIZE).toArray('le', 16));
    }
    toArrayLike(ArrayType, endian, length) {
        return this.data
            .toTwos(I80F48.MAX_SIZE)
            .toArrayLike(ArrayType, endian, length);
    }
    getData() {
        return this.data;
    }
    getBinaryLayout() {
        return this.data
            .toTwos(I80F48.MAX_SIZE)
            .toString(2, I80F48.MAX_SIZE)
            .replace(/-/g, '');
    }
    add(x) {
        return new I80F48(this.data.add(x.getData()));
    }
    sub(x) {
        return new I80F48(this.data.sub(x.getData()));
    }
    iadd(x) {
        this.data.iadd(x.getData());
        return this;
    }
    isub(x) {
        this.data.isub(x.getData());
        return this;
    }
    floor() {
        // Low IQ method
        return I80F48.fromBig(this.toBig().round(undefined, 0));
        // return new I80F48(this.data.shrn(I80F48.FRACTIONS).shln(I80F48.FRACTIONS));
    }
    ceil() {
        // Low IQ method, 3 -> round up
        return I80F48.fromBig(this.toBig().round(undefined, 3));
        // const frac = this.data.maskn(I80F48.FRACTIONS);
        // if (frac.eq(ZERO_BN)) {
        //   return this;
        // } else {
        //   return this.floor().add(ONE_I80F48);
        // }
    }
    frac() {
        // TODO verify this works for negative numbers
        return new I80F48(this.data.maskn(I80F48.FRACTIONS));
    }
    /**
     * Multiply the two and shift
     */
    mul(x) {
        return new I80F48(this.data.mul(x.data).iushrn(I80F48.FRACTIONS));
    }
    imul(x) {
        this.data.imul(x.getData()).iushrn(I80F48.FRACTIONS);
        return this;
    }
    div(x) {
        return new I80F48(this.data.ushln(I80F48.FRACTIONS).div(x.data));
    }
    idiv(x) {
        this.data = this.data.iushln(I80F48.FRACTIONS).div(x.data);
        return this;
    }
    gt(x) {
        return this.data.gt(x.getData());
    }
    lt(x) {
        return this.data.lt(x.getData());
    }
    gte(x) {
        return this.data.gte(x.getData());
    }
    lte(x) {
        return this.data.lte(x.getData());
    }
    eq(x) {
        // TODO make sure this works when they're diff signs or 0
        return this.data.eq(x.getData());
    }
    cmp(x) {
        // TODO make sure this works when they're diff signs or 0
        return this.data.cmp(x.getData());
    }
    neg() {
        return this.mul(exports.NEG_ONE_I80F48);
    }
    isPos() {
        return this.gt(exports.ZERO_I80F48);
    }
    isNeg() {
        return this.data.isNeg();
    }
    isZero() {
        return this.eq(exports.ZERO_I80F48);
    }
    min(x) {
        return this.lte(x) ? this : x;
    }
    max(x) {
        return this.gte(x) ? this : x;
    }
    abs() {
        if (this.isNeg()) {
            return this.neg();
        }
        else {
            return this;
        }
    }
}
exports.I80F48 = I80F48;
/**
This is represented by a 128 bit signed integer underneath
The first 80 bits are treated as an integer and last 48 bits are treated as fractional part after binary point
It's possible to think of an I80F48 as an i128 divided by 2 ^ 40

Read up on how fixed point math works: https://inst.eecs.berkeley.edu/~cs61c/sp06/handout/fixedpt.html
Read up on how 2s complement works: https://en.wikipedia.org/wiki/Two%27s_complement
 */
I80F48.MAX_SIZE = 128;
I80F48.FRACTIONS = 48;
I80F48.MULTIPLIER_BIG = new big_js_1.default(2).pow(I80F48.FRACTIONS);
I80F48.MULTIPLIER_BN = new bn_js_1.default(2).pow(new bn_js_1.default(I80F48.FRACTIONS));
I80F48.MULTIPLIER_NUMBER = Math.pow(2, I80F48.FRACTIONS);
I80F48.MAX_BN = new bn_js_1.default(2)
    .pow(new bn_js_1.default(I80F48.MAX_SIZE))
    .div(new bn_js_1.default(2))
    .sub(new bn_js_1.default(1));
I80F48.MIN_BN = new bn_js_1.default(2)
    .pow(new bn_js_1.default(I80F48.MAX_SIZE))
    .div(new bn_js_1.default(2))
    .neg();
/** @internal */
exports.ONE_I80F48 = I80F48.fromString('1');
/** @internal */
exports.ZERO_I80F48 = I80F48.fromString('0');
/** @internal */
exports.NEG_ONE_I80F48 = I80F48.fromString('-1');
//# sourceMappingURL=fixednum.js.map