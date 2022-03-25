"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOGGABLE_SCHEMA = exports.LoggableFillEvent = exports.deserializeBorsh = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const web3_js_1 = require("@solana/web3.js");
const borsh_1 = require("borsh");
const fixednum_1 = require("../utils/fixednum");
borsh_1.BinaryReader.prototype.readPubkey = function () {
    const reader = this;
    const array = reader.readFixedArray(32);
    return new web3_js_1.PublicKey(array);
};
borsh_1.BinaryWriter.prototype.writePubkey = function (value) {
    const writer = this;
    writer.writeFixedArray(value.toBuffer());
};
borsh_1.BinaryReader.prototype.readI80F48 = function () {
    const reader = this;
    const array = reader.readFixedArray(16);
    const result = new bn_js_1.default(array, 10, 'le').fromTwos(128);
    return new fixednum_1.I80F48(result);
};
borsh_1.BinaryReader.prototype.writeI80F48 = function (value) {
    const writer = this;
    writer.writeFixedArray(value.toArray());
};
borsh_1.BinaryReader.prototype.readI64 = function () {
    const reader = this;
    const array = reader.readFixedArray(8);
    return new bn_js_1.default(array, 10, 'le').fromTwos(64);
};
borsh_1.BinaryReader.prototype.writeI64 = function (value) {
    const writer = this;
    writer.writeFixedArray(value.toBuffer('le', 8));
};
borsh_1.BinaryReader.prototype.readI128 = function () {
    const reader = this;
    const array = reader.readFixedArray(16);
    return new bn_js_1.default(array, 10, 'le').fromTwos(128);
};
borsh_1.BinaryReader.prototype.writeI128 = function (value) {
    const writer = this;
    writer.writeFixedArray(value.toBuffer('le', 16));
};
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function deserializeField(schema, fieldName, fieldType, reader) {
    try {
        console.log(fieldName, fieldType);
        if (typeof fieldType === 'string') {
            return reader[`read${capitalizeFirstLetter(fieldType)}`]();
        }
        if (fieldType instanceof Array) {
            if (typeof fieldType[0] === 'number') {
                return reader.readFixedArray(fieldType[0]);
            }
            return reader.readArray(() => deserializeField(schema, fieldName, fieldType[0], reader));
        }
        if (fieldType.kind === 'option') {
            const option = reader.readU8();
            if (option) {
                return deserializeField(schema, fieldName, fieldType.type, reader);
            }
            return undefined;
        }
        return deserializeStruct(schema, fieldType, reader);
    }
    catch (error) {
        if (error instanceof borsh_1.BorshError) {
            error.addToFieldPath(fieldName);
        }
        throw error;
    }
}
function deserializeStruct(schema, classType, reader) {
    const structSchema = schema.get(classType);
    if (!structSchema) {
        throw new borsh_1.BorshError(`Class ${classType.name} is missing in schema`);
    }
    if (structSchema.kind === 'struct') {
        const result = {};
        for (const [fieldName, fieldType] of schema.get(classType).fields) {
            result[fieldName] = deserializeField(schema, fieldName, fieldType, reader);
        }
        return new classType(result);
    }
    if (structSchema.kind === 'enum') {
        const idx = reader.readU8();
        if (idx >= structSchema.values.length) {
            throw new borsh_1.BorshError(`Enum index: ${idx} is out of range`);
        }
        const [fieldName, fieldType] = structSchema.values[idx];
        const fieldValue = deserializeField(schema, fieldName, fieldType, reader);
        return new classType({ [fieldName]: fieldValue });
    }
    throw new borsh_1.BorshError(`Unexpected schema kind: ${structSchema.kind} for ${classType.constructor.name}`);
}
/// Deserializes object from bytes using schema.
function deserializeBorsh(schema, classType, buffer) {
    const reader = new borsh_1.BinaryReader(buffer);
    return deserializeStruct(schema, classType, reader);
}
exports.deserializeBorsh = deserializeBorsh;
class LoggableFillEvent {
    constructor(decoded) {
        Object.assign(this, decoded);
    }
}
exports.LoggableFillEvent = LoggableFillEvent;
exports.LOGGABLE_SCHEMA = new Map([
    [
        LoggableFillEvent,
        {
            kind: 'struct',
            fields: [
                ['eventType', 'u8'],
                ['takerSide', 'u8'],
                ['makerSlot', 'u8'],
                ['makerOut', 'u8'],
                ['timestamp', 'u64'],
                ['seqNum', 'u64'],
                ['maker', 'pubkey'],
                ['makerOrderId', 'i128'],
                ['makerClientOrderId', 'u64'],
                ['makerFee', 'I80F48'],
                ['bestInitial', 'i64'],
                ['makerTimestamp', 'u64'],
                ['taker', 'pubkey'],
                ['takerOrderId', 'i128'],
                ['takerClientOrderId', 'u64'],
                ['takerFee', 'I80F48'],
                ['price', 'i64'],
                ['quantity', 'i64'],
            ],
        },
    ],
]);
//# sourceMappingURL=loggable.js.map