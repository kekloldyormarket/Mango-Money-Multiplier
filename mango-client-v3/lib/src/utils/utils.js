"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPerpMarketParams = exports.calculateLotSizes = exports.throwUndefined = exports.getMultipleAccounts = exports.clamp = exports.getFilteredProgramAccounts = exports.createSignerKeyAndNonce = exports.createTokenAccountInstructions = exports.createAccountInstruction = exports.simulateTransaction = exports.sleep = exports.awaitTransactionSignatureConfirmation = exports.splitOpenOrders = exports.getWeights = exports.MangoError = exports.TimeoutError = exports.nativeI80F48ToUi = exports.nativeToUi = exports.uiToNative = exports.optionalBNFromString = exports.promiseNull = exports.promiseUndef = exports.zeroKey = exports.I64_MAX_BN = exports.U64_MAX_BN = exports.ONE_BN = exports.ZERO_BN = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const web3_js_1 = require("@solana/web3.js");
const serum_1 = require("@project-serum/serum");
const fixednum_1 = require("./fixednum");
/** @internal */
exports.ZERO_BN = new bn_js_1.default(0);
/** @internal */
exports.ONE_BN = new bn_js_1.default(1);
/** @internal */
exports.U64_MAX_BN = new bn_js_1.default('18446744073709551615');
/** @internal */
exports.I64_MAX_BN = new bn_js_1.default('9223372036854775807').toTwos(64);
/** @internal */
exports.zeroKey = new web3_js_1.PublicKey(new Uint8Array(32));
/** @internal */
function promiseUndef() {
    return __awaiter(this, void 0, void 0, function* () {
        return undefined;
    });
}
exports.promiseUndef = promiseUndef;
/** @internal */
function promiseNull() {
    return __awaiter(this, void 0, void 0, function* () {
        return null;
    });
}
exports.promiseNull = promiseNull;
function optionalBNFromString(x) {
    return x ? new bn_js_1.default(x) : undefined;
}
exports.optionalBNFromString = optionalBNFromString;
function uiToNative(amount, decimals) {
    return new bn_js_1.default(Math.round(amount * Math.pow(10, decimals)));
}
exports.uiToNative = uiToNative;
function nativeToUi(amount, decimals) {
    return amount / Math.pow(10, decimals);
}
exports.nativeToUi = nativeToUi;
function nativeI80F48ToUi(amount, decimals) {
    return amount.div(fixednum_1.I80F48.fromNumber(Math.pow(10, decimals)));
}
exports.nativeI80F48ToUi = nativeI80F48ToUi;
class TimeoutError extends Error {
    constructor({ txid }) {
        super();
        this.message = `Timed out awaiting confirmation. Please confirm in the explorer: `;
        this.txid = txid;
    }
}
exports.TimeoutError = TimeoutError;
class MangoError extends Error {
    constructor({ txid, message }) {
        super();
        this.message = message;
        this.txid = txid;
    }
}
exports.MangoError = MangoError;
/**
 * Return weights corresponding to health type;
 * Weights are all 1 if no healthType provided
 */
function getWeights(mangoGroup, marketIndex, healthType) {
    if (healthType === 'Maint') {
        return {
            spotAssetWeight: mangoGroup.spotMarkets[marketIndex].maintAssetWeight,
            spotLiabWeight: mangoGroup.spotMarkets[marketIndex].maintLiabWeight,
            perpAssetWeight: mangoGroup.perpMarkets[marketIndex].maintAssetWeight,
            perpLiabWeight: mangoGroup.perpMarkets[marketIndex].maintLiabWeight,
        };
    }
    else if (healthType === 'Init') {
        return {
            spotAssetWeight: mangoGroup.spotMarkets[marketIndex].initAssetWeight,
            spotLiabWeight: mangoGroup.spotMarkets[marketIndex].initLiabWeight,
            perpAssetWeight: mangoGroup.perpMarkets[marketIndex].initAssetWeight,
            perpLiabWeight: mangoGroup.perpMarkets[marketIndex].initLiabWeight,
        };
    }
    else {
        return {
            spotAssetWeight: fixednum_1.ONE_I80F48,
            spotLiabWeight: fixednum_1.ONE_I80F48,
            perpAssetWeight: fixednum_1.ONE_I80F48,
            perpLiabWeight: fixednum_1.ONE_I80F48,
        };
    }
}
exports.getWeights = getWeights;
function splitOpenOrders(openOrders) {
    const quoteFree = fixednum_1.I80F48.fromU64(openOrders.quoteTokenFree.add(openOrders['referrerRebatesAccrued']));
    const quoteLocked = fixednum_1.I80F48.fromU64(openOrders.quoteTokenTotal.sub(openOrders.quoteTokenFree));
    const baseFree = fixednum_1.I80F48.fromU64(openOrders.baseTokenFree);
    const baseLocked = fixednum_1.I80F48.fromU64(openOrders.baseTokenTotal.sub(openOrders.baseTokenFree));
    return { quoteFree, quoteLocked, baseFree, baseLocked };
}
exports.splitOpenOrders = splitOpenOrders;
function awaitTransactionSignatureConfirmation(txid, timeout, connection, confirmLevel) {
    return __awaiter(this, void 0, void 0, function* () {
        let done = false;
        const confirmLevels = [
            'finalized',
        ];
        if (confirmLevel === 'confirmed') {
            confirmLevels.push('confirmed');
        }
        else if (confirmLevel === 'processed') {
            confirmLevels.push('confirmed');
            confirmLevels.push('processed');
        }
        const result = yield new Promise((resolve, reject) => {
            (() => __awaiter(this, void 0, void 0, function* () {
                setTimeout(() => {
                    if (done) {
                        return;
                    }
                    done = true;
                    console.log('Timed out for txid', txid);
                    reject({ timeout: true });
                }, timeout);
                try {
                    connection.onSignature(txid, (result) => {
                        // console.log('WS confirmed', txid, result);
                        done = true;
                        if (result.err) {
                            reject(result.err);
                        }
                        else {
                            resolve(result);
                        }
                    }, 'processed');
                    // console.log('Set up WS connection', txid);
                }
                catch (e) {
                    done = true;
                    console.log('WS error in setup', txid, e);
                }
                while (!done) {
                    // eslint-disable-next-line no-loop-func
                    (() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            const signatureStatuses = yield connection.getSignatureStatuses([
                                txid,
                            ]);
                            const result = signatureStatuses && signatureStatuses.value[0];
                            if (!done) {
                                if (!result) {
                                    // console.log('REST null result for', txid, result);
                                }
                                else if (result.err) {
                                    console.log('REST error for', txid, result);
                                    done = true;
                                    reject(result.err);
                                }
                                else if (!(result.confirmations ||
                                    confirmLevels.includes(result.confirmationStatus))) {
                                    console.log('REST not confirmed', txid, result);
                                }
                                else {
                                    console.log('REST confirmed', txid, result);
                                    done = true;
                                    resolve(result);
                                }
                            }
                        }
                        catch (e) {
                            if (!done) {
                                console.log('REST connection error: txid', txid, e);
                            }
                        }
                    }))();
                    yield sleep(300);
                }
            }))();
        });
        done = true;
        return result;
    });
}
exports.awaitTransactionSignatureConfirmation = awaitTransactionSignatureConfirmation;
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
exports.sleep = sleep;
function simulateTransaction(connection, transaction, commitment) {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        transaction.recentBlockhash = yield connection._recentBlockhash(
        // @ts-ignore
        connection._disableBlockhashCaching);
        const signData = transaction.serializeMessage();
        // @ts-ignore
        const wireTransaction = transaction._serialize(signData);
        const encodedTransaction = wireTransaction.toString('base64');
        const config = { encoding: 'base64', commitment };
        const args = [encodedTransaction, config];
        // @ts-ignore
        const res = yield connection._rpcRequest('simulateTransaction', args);
        if (res.error) {
            throw new Error('failed to simulate transaction: ' + res.error.message);
        }
        return res.result;
    });
}
exports.simulateTransaction = simulateTransaction;
function createAccountInstruction(connection, payer, space, owner, lamports) {
    return __awaiter(this, void 0, void 0, function* () {
        const account = new web3_js_1.Account();
        const instruction = web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: account.publicKey,
            lamports: lamports
                ? lamports
                : yield connection.getMinimumBalanceForRentExemption(space),
            space,
            programId: owner,
        });
        return { account, instruction };
    });
}
exports.createAccountInstruction = createAccountInstruction;
function createTokenAccountInstructions(connection, payer, account, mint, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        return [
            web3_js_1.SystemProgram.createAccount({
                fromPubkey: payer,
                newAccountPubkey: account,
                lamports: yield connection.getMinimumBalanceForRentExemption(165),
                space: 165,
                programId: serum_1.TokenInstructions.TOKEN_PROGRAM_ID,
            }),
            serum_1.TokenInstructions.initializeAccount({
                account: account,
                mint,
                owner,
            }),
        ];
    });
}
exports.createTokenAccountInstructions = createTokenAccountInstructions;
function createSignerKeyAndNonce(programId, accountKey) {
    return __awaiter(this, void 0, void 0, function* () {
        // let res = await PublicKey.findProgramAddress([accountKey.toBuffer()], programId);
        // console.log(res);
        // return {
        //   signerKey: res[0],
        //   signerNonce: res[1]
        // };
        for (let nonce = 0; nonce <= Number.MAX_SAFE_INTEGER; nonce++) {
            try {
                const nonceBuffer = Buffer.alloc(8);
                nonceBuffer.writeUInt32LE(nonce, 0);
                const seeds = [accountKey.toBuffer(), nonceBuffer];
                const key = yield web3_js_1.PublicKey.createProgramAddress(seeds, programId);
                return {
                    signerKey: key,
                    signerNonce: nonce,
                };
            }
            catch (e) {
                continue;
            }
        }
        throw new Error('Could not generate signer key');
    });
}
exports.createSignerKeyAndNonce = createSignerKeyAndNonce;
function getFilteredProgramAccounts(connection, programId, filters) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        const resp = yield connection._rpcRequest('getProgramAccounts', [
            programId.toBase58(),
            {
                commitment: connection.commitment,
                filters,
                encoding: 'base64',
            },
        ]);
        if (resp.error) {
            throw new Error(resp.error.message);
        }
        if (resp.result) {
            const nullResults = resp.result.filter((r) => (r === null || r === void 0 ? void 0 : r.account) === null);
            if (nullResults.length > 0)
                throw new Error(`gpa returned ${nullResults.length} null results. ex: ${(_a = nullResults[0]) === null || _a === void 0 ? void 0 : _a.pubkey.toString()}`);
        }
        return resp.result.map(({ pubkey, account: { data, executable, owner, lamports } }) => ({
            publicKey: new web3_js_1.PublicKey(pubkey),
            accountInfo: {
                data: Buffer.from(data[0], 'base64'),
                executable,
                owner: new web3_js_1.PublicKey(owner),
                lamports,
            },
        }));
    });
}
exports.getFilteredProgramAccounts = getFilteredProgramAccounts;
// Clamp number between two values
function clamp(x, min, max) {
    if (x < min) {
        return min;
    }
    else if (x > max) {
        return max;
    }
    else {
        return x;
    }
}
exports.clamp = clamp;
function getMultipleAccounts(connection, publicKeys, commitment) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const len = publicKeys.length;
        if (len === 0) {
            return [];
        }
        if (len > 100) {
            const mid = Math.floor(publicKeys.length / 2);
            return Promise.all([
                getMultipleAccounts(connection, publicKeys.slice(0, mid), commitment),
                getMultipleAccounts(connection, publicKeys.slice(mid, len), commitment),
            ]).then((a) => a[0].concat(a[1]));
        }
        const publicKeyStrs = publicKeys.map((pk) => pk.toBase58());
        // load connection commitment as a default
        commitment || (commitment = connection.commitment);
        const args = commitment ? [publicKeyStrs, { commitment }] : [publicKeyStrs];
        // @ts-ignore
        const resp = yield connection._rpcRequest('getMultipleAccounts', args);
        if (resp.error) {
            throw new Error(resp.error.message);
        }
        if (resp.result) {
            const nullResults = resp.result.value.filter((r) => (r === null || r === void 0 ? void 0 : r.account) === null);
            if (nullResults.length > 0)
                throw new Error(`gma returned ${nullResults.length} null results. ex: ${(_a = nullResults[0]) === null || _a === void 0 ? void 0 : _a.pubkey.toString()}`);
        }
        return resp.result.value.map(({ data, executable, lamports, owner }, i) => ({
            publicKey: publicKeys[i],
            context: resp.result.context,
            accountInfo: {
                data: Buffer.from(data[0], 'base64'),
                executable,
                owner: new web3_js_1.PublicKey(owner),
                lamports,
            },
        }));
    });
}
exports.getMultipleAccounts = getMultipleAccounts;
/**
 * Throw if undefined; return value otherwise
 * @internal
 */
function throwUndefined(x) {
    if (x === undefined) {
        throw new Error('Undefined');
    }
    return x;
}
exports.throwUndefined = throwUndefined;
/**
 * Calculate the base lot size and quote lot size given a desired min tick and min size in the UI
 */
function calculateLotSizes(baseDecimals, quoteDecimals, minTick, minSize) {
    const baseLotSize = minSize * Math.pow(10, baseDecimals);
    const quoteLotSize = (minTick * baseLotSize) / Math.pow(10, baseDecimals - quoteDecimals);
    return {
        baseLotSize: new bn_js_1.default(baseLotSize),
        quoteLotSize: new bn_js_1.default(quoteLotSize),
    };
}
exports.calculateLotSizes = calculateLotSizes;
/**
 * Return some standard params for a new perp market
 * oraclePrice is the current oracle price for the perp market being added
 * Assumes a rate 1000 MNGO per hour for 500k liquidity rewarded
 * `nativeBaseDecimals` are the decimals for the asset on the native chain
 */
function findPerpMarketParams(nativeBaseDecimals, quoteDecimals, oraclePrice, leverage, mngoPerHour) {
    // wormhole wrapped tokens on solana will have a max of 8 decimals
    const baseDecimals = Math.min(nativeBaseDecimals, 8);
    // min tick targets around 1 basis point or 0.01% of price
    const minTick = Math.pow(10, Math.round(Math.log10(oraclePrice)) - 4);
    // minSize is targeted to be between 0.1 - 1 assuming USDC quote currency
    const minSize = Math.pow(10, -Math.round(Math.log10(oraclePrice)));
    const LIQUIDITY_PER_MNGO = 500; // implies 1000 MNGO per $500k top of book
    const contractVal = minSize * oraclePrice;
    const maxDepthBps = Math.floor((mngoPerHour * LIQUIDITY_PER_MNGO) / contractVal);
    const lmSizeShift = Math.floor(Math.log2(maxDepthBps) - 3);
    const { baseLotSize, quoteLotSize } = calculateLotSizes(baseDecimals, quoteDecimals, minTick, minSize);
    return {
        maintLeverage: leverage * 2,
        initLeverage: leverage,
        liquidationFee: 1 / (leverage * 4),
        makerFee: -0.0004,
        takerFee: 0.0005,
        baseLotSize: baseLotSize.toNumber(),
        quoteLotSize: quoteLotSize.toNumber(),
        rate: 0.03,
        maxDepthBps,
        exp: 2,
        maxNumEvents: 256,
        targetPeriodLength: 3600,
        mngoPerPeriod: mngoPerHour,
        version: 1,
        lmSizeShift,
        decimals: baseDecimals,
        minTick,
        minSize,
        baseDecimals,
    };
}
exports.findPerpMarketParams = findPerpMarketParams;
//# sourceMappingURL=utils.js.map