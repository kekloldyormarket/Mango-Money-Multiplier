"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerpEventQueueLayout = exports.PerpEventQueueHeaderLayout = exports.PerpEventLayout = exports.PerpMarketLayout = exports.liquidityMiningInfoLayout = exports.LiquidityMiningInfoLayout = exports.StubOracleLayout = exports.NodeBankLayout = exports.RootBankLayout = exports.MangoAccountLayout = exports.MangoGroupLayout = exports.perpAccountLayout = exports.PerpAccountLayout = exports.perpMarketInfoLayout = exports.PerpMarketInfoLayout = exports.PerpMarketInfo = exports.spotMarketInfoLayout = exports.SpotMarketInfoLayout = exports.SpotMarketInfo = exports.tokenInfoLayout = exports.TokenInfoLayout = exports.TokenInfo = exports.metaDataLayout = exports.MetaDataLayout = exports.MetaData = exports.DataType = exports.publicKeyLayout = exports.PublicKeyLayout = exports.encodeMangoInstruction = exports.MangoInstructionLayout = exports.advancedOrderTypeLayout = exports.triggerConditionLayout = exports.selfTradeBehaviorLayout = exports.orderTypeLayout = exports.sideLayout = exports.bool = exports.i128 = exports.u128 = exports.i64 = exports.u64 = exports.I80F48Layout = exports.CENTIBPS_PER_UNIT = exports.FREE_ORDER_SLOT = exports.MAX_PERP_OPEN_ORDERS = exports.MAX_NUM_IN_MARGIN_BASKET = exports.QUOTE_INDEX = exports.INFO_LEN = exports.MAX_NODE_BANKS = exports.MAX_PAIRS = exports.MAX_TOKENS = void 0;
exports.ReferrerIdRecordLayout = exports.ReferrerIdRecord = exports.ReferrerMemoryLayout = exports.ReferrerMemory = exports.AdvancedOrdersLayout = exports.TokenAccountLayout = exports.NodeBank = exports.MangoCache = exports.MangoCacheLayout = exports.perpMarketCacheLayout = exports.PerpMarketCacheLayout = exports.PerpMarketCache = exports.rootBankCacheLayout = exports.RootBankCacheLayout = exports.RootBankCache = exports.priceCacheLayout = exports.PriceCacheLayout = exports.PriceCache = exports.BookSideLayout = void 0;
const buffer_layout_1 = require("buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const fixednum_1 = require("./utils/fixednum");
const bn_js_1 = __importDefault(require("bn.js"));
const utils_1 = require("./utils/utils");
const PerpAccount_1 = __importDefault(require("./PerpAccount"));
exports.MAX_TOKENS = 16;
exports.MAX_PAIRS = exports.MAX_TOKENS - 1;
exports.MAX_NODE_BANKS = 8;
exports.INFO_LEN = 32;
exports.QUOTE_INDEX = exports.MAX_TOKENS - 1;
exports.MAX_NUM_IN_MARGIN_BASKET = 9;
exports.MAX_PERP_OPEN_ORDERS = 64;
exports.FREE_ORDER_SLOT = 255; // u8::MAX
exports.CENTIBPS_PER_UNIT = 1000000;
const MAX_BOOK_NODES = 1024;
class _I80F48Layout extends buffer_layout_1.Blob {
    constructor(property) {
        super(16, property);
    }
    decode(b, offset) {
        let result = new bn_js_1.default(super.decode(b, offset), 10, 'le');
        result = result.fromTwos(8 * this['length']);
        return new fixednum_1.I80F48(result);
    }
    encode(src, b, offset) {
        src = src.toTwos(8 * this['length']);
        return super.encode(src.toArrayLike(Buffer, 'le', this['span']), b, offset);
    }
}
/** @internal */
function I80F48Layout(property = '') {
    return new _I80F48Layout(property);
}
exports.I80F48Layout = I80F48Layout;
class BNLayout extends buffer_layout_1.Blob {
    constructor(number, property, signed = false) {
        super(number, property);
        this.signed = signed;
        // restore prototype chain
        Object.setPrototypeOf(this, new.target.prototype);
    }
    decode(b, offset) {
        let result = new bn_js_1.default(super.decode(b, offset), 10, 'le');
        if (this.signed)
            result = result.fromTwos(8 * this['length']);
        return result;
    }
    encode(src, b, offset) {
        if (this.signed)
            src = src.toTwos(8 * this['length']);
        return super.encode(src.toArrayLike(Buffer, 'le', this['span']), b, offset);
    }
}
/** @internal */
function u64(property = '') {
    return new BNLayout(8, property);
}
exports.u64 = u64;
/** @internal */
function i64(property = '') {
    return new BNLayout(8, property, true);
}
exports.i64 = i64;
/** @internal */
function u128(property) {
    return new BNLayout(16, property);
}
exports.u128 = u128;
/** @internal */
function i128(property) {
    return new BNLayout(16, property, true);
}
exports.i128 = i128;
class WrappedLayout extends buffer_layout_1.Layout {
    constructor(layout, decoder, encoder, property) {
        super(layout.span, property);
        this.layout = layout;
        this.decoder = decoder;
        this.encoder = encoder;
    }
    decode(b, offset) {
        return this.decoder(this.layout.decode(b, offset));
    }
    encode(src, b, offset) {
        return this.layout.encode(this.encoder(src), b, offset);
    }
    getSpan(b, offset) {
        return this.layout.getSpan(b, offset);
    }
}
/** @internal */
function bool(property) {
    return new WrappedLayout(buffer_layout_1.u8(), decodeBool, encodeBool, property);
}
exports.bool = bool;
function decodeBool(value) {
    // TODO - use commented lines after deprecating mainnet.1
    return value !== 0;
    // if (value === 0) {
    //   return false;
    // } else if (value === 1) {
    //   return true;
    // }
    // throw new Error('Invalid bool: ' + value);
}
function encodeBool(value) {
    return value ? 1 : 0;
}
class EnumLayout extends buffer_layout_1.UInt {
    constructor(values, span, property) {
        super(span, property);
        this.values = values;
    }
    encode(src, b, offset) {
        if (this.values[src] !== undefined) {
            return super.encode(this.values[src], b, offset);
        }
        throw new Error('Invalid ' + this['property']);
    }
    decode(b, offset) {
        const decodedValue = super.decode(b, offset);
        const entry = Object.entries(this.values).find(([, value]) => value === decodedValue);
        if (entry) {
            return entry[0];
        }
        throw new Error('Invalid ' + this['property']);
    }
}
/** @internal */
function sideLayout(span, property) {
    return new EnumLayout({ buy: 0, sell: 1 }, span, property);
}
exports.sideLayout = sideLayout;
/** @internal */
function orderTypeLayout(property, span) {
    return new EnumLayout({ limit: 0, ioc: 1, postOnly: 2, market: 3, postOnlySlide: 4 }, span, property);
}
exports.orderTypeLayout = orderTypeLayout;
/** @internal */
function selfTradeBehaviorLayout(property, span) {
    return new EnumLayout({ decrementTake: 0, cancelProvide: 1, abortTransaction: 2 }, span, property);
}
exports.selfTradeBehaviorLayout = selfTradeBehaviorLayout;
function triggerConditionLayout(property, span) {
    return new EnumLayout({ above: 0, below: 1 }, span, property);
}
exports.triggerConditionLayout = triggerConditionLayout;
function advancedOrderTypeLayout(property, span) {
    return new EnumLayout({ perpTrigger: 0, spotTrigger: 1 }, span, property);
}
exports.advancedOrderTypeLayout = advancedOrderTypeLayout;
/**
 * Makes custom modifications to the instruction layouts because valid instructions can be many sizes
 */
/** @internal */
class MangoInstructionsUnion extends buffer_layout_1.Union {
    constructor(discr, defaultLayout, property) {
        super(discr, defaultLayout, property);
    }
    decode(b, offset) {
        if (undefined === offset) {
            offset = 0;
        }
        const discr = this['discriminator'].decode(b, offset);
        // Adjust for old instructions that don't have optional bytes added to end
        if ((discr === 11 && b.length === 144) ||
            (discr === 12 && b.length === 30)) {
            b = Buffer.concat([b, Buffer.from([0])]);
        }
        else if (discr === 37 && b.length === 141) {
            b = Buffer.concat([b, Buffer.from([0, 0])]);
        }
        return super.decode(b, offset);
    }
    addVariant(variant, layout, property) {
        return super.addVariant(variant, layout, property);
    }
}
exports.MangoInstructionLayout = new MangoInstructionsUnion(buffer_layout_1.u32('instruction'));
exports.MangoInstructionLayout.addVariant(0, buffer_layout_1.struct([
    u64('signerNonce'),
    u64('validInterval'),
    I80F48Layout('quoteOptimalUtil'),
    I80F48Layout('quoteOptimalRate'),
    I80F48Layout('quoteMaxRate'),
]), 'InitMangoGroup');
exports.MangoInstructionLayout.addVariant(1, buffer_layout_1.struct([]), 'InitMangoAccount');
exports.MangoInstructionLayout.addVariant(2, buffer_layout_1.struct([u64('quantity')]), 'Deposit');
exports.MangoInstructionLayout.addVariant(3, buffer_layout_1.struct([u64('quantity'), buffer_layout_1.u8('allowBorrow')]), 'Withdraw');
exports.MangoInstructionLayout.addVariant(4, buffer_layout_1.struct([
    I80F48Layout('maintLeverage'),
    I80F48Layout('initLeverage'),
    I80F48Layout('liquidationFee'),
    I80F48Layout('optimalUtil'),
    I80F48Layout('optimalRate'),
    I80F48Layout('maxRate'),
]), 'AddSpotMarket');
exports.MangoInstructionLayout.addVariant(5, buffer_layout_1.struct([u64('marketIndex')]), 'AddToBasket');
exports.MangoInstructionLayout.addVariant(6, buffer_layout_1.struct([u64('quantity')]), 'Borrow');
exports.MangoInstructionLayout.addVariant(7, buffer_layout_1.struct([]), 'CachePrices');
exports.MangoInstructionLayout.addVariant(8, buffer_layout_1.struct([]), 'CacheRootBanks');
exports.MangoInstructionLayout.addVariant(9, buffer_layout_1.struct([
    sideLayout(4, 'side'),
    u64('limitPrice'),
    u64('maxBaseQuantity'),
    u64('maxQuoteQuantity'),
    selfTradeBehaviorLayout('selfTradeBehavior', 4),
    orderTypeLayout('orderType', 4),
    u64('clientId'),
    buffer_layout_1.u16('limit'),
]), 'PlaceSpotOrder');
exports.MangoInstructionLayout.addVariant(10, buffer_layout_1.struct([]), 'AddOracle');
exports.MangoInstructionLayout.addVariant(11, buffer_layout_1.struct([
    I80F48Layout('maintLeverage'),
    I80F48Layout('initLeverage'),
    I80F48Layout('liquidationFee'),
    I80F48Layout('makerFee'),
    I80F48Layout('takerFee'),
    i64('baseLotSize'),
    i64('quoteLotSize'),
    I80F48Layout('rate'),
    I80F48Layout('maxDepthBps'),
    u64('targetPeriodLength'),
    u64('mngoPerPeriod'),
    buffer_layout_1.u8('exp'),
]), 'AddPerpMarket');
exports.MangoInstructionLayout.addVariant(12, buffer_layout_1.struct([
    i64('price'),
    i64('quantity'),
    u64('clientOrderId'),
    sideLayout(1, 'side'),
    orderTypeLayout('orderType', 1),
    bool('reduceOnly'),
]), 'PlacePerpOrder');
exports.MangoInstructionLayout.addVariant(13, buffer_layout_1.struct([u64('clientOrderId'), bool('invalidIdOk')]), 'CancelPerpOrderByClientId');
exports.MangoInstructionLayout.addVariant(14, buffer_layout_1.struct([i128('orderId'), bool('invalidIdOk')]), 'CancelPerpOrder');
exports.MangoInstructionLayout.addVariant(15, buffer_layout_1.struct([u64('limit')]), 'ConsumeEvents');
exports.MangoInstructionLayout.addVariant(16, buffer_layout_1.struct([]), 'CachePerpMarkets');
exports.MangoInstructionLayout.addVariant(17, buffer_layout_1.struct([]), 'UpdateFunding');
exports.MangoInstructionLayout.addVariant(18, buffer_layout_1.struct([I80F48Layout('price')]), 'SetOracle');
exports.MangoInstructionLayout.addVariant(19, buffer_layout_1.struct([]), 'SettleFunds');
exports.MangoInstructionLayout.addVariant(20, buffer_layout_1.struct([sideLayout(4, 'side'), u128('orderId')]), 'CancelSpotOrder');
exports.MangoInstructionLayout.addVariant(21, buffer_layout_1.struct([]), 'UpdateRootBank');
exports.MangoInstructionLayout.addVariant(22, buffer_layout_1.struct([u64('marketIndex')]), 'SettlePnl');
exports.MangoInstructionLayout.addVariant(23, buffer_layout_1.struct([u64('tokenIndex'), u64('quantity')]), 'SettleBorrow');
exports.MangoInstructionLayout.addVariant(24, buffer_layout_1.struct([buffer_layout_1.u8('limit')]), 'ForceCancelSpotOrders');
exports.MangoInstructionLayout.addVariant(25, buffer_layout_1.struct([buffer_layout_1.u8('limit')]), 'ForceCancelPerpOrders');
exports.MangoInstructionLayout.addVariant(26, buffer_layout_1.struct([I80F48Layout('maxLiabTransfer')]), 'LiquidateTokenAndToken');
exports.MangoInstructionLayout.addVariant(27, buffer_layout_1.struct([
    buffer_layout_1.u8('assetType'),
    u64('assetIndex'),
    buffer_layout_1.u8('liabType'),
    u64('liabIndex'),
    I80F48Layout('maxLiabTransfer'),
]), 'LiquidateTokenAndPerp');
exports.MangoInstructionLayout.addVariant(28, buffer_layout_1.struct([i64('baseTransferRequest')]), 'LiquidatePerpMarket');
exports.MangoInstructionLayout.addVariant(29, buffer_layout_1.struct([]), 'SettleFees');
exports.MangoInstructionLayout.addVariant(30, buffer_layout_1.struct([u64('liabIndex'), I80F48Layout('maxLiabTransfer')]), 'ResolvePerpBankruptcy');
exports.MangoInstructionLayout.addVariant(31, buffer_layout_1.struct([I80F48Layout('maxLiabTransfer')]), 'ResolveTokenBankruptcy');
exports.MangoInstructionLayout.addVariant(32, buffer_layout_1.struct([]), 'InitSpotOpenOrders');
exports.MangoInstructionLayout.addVariant(33, buffer_layout_1.struct([]), 'RedeemMngo');
exports.MangoInstructionLayout.addVariant(34, buffer_layout_1.struct([buffer_layout_1.seq(buffer_layout_1.u8(), exports.INFO_LEN, 'info')]), 'AddMangoAccountInfo');
exports.MangoInstructionLayout.addVariant(35, buffer_layout_1.struct([u64('quantity')]), 'DepositMsrm');
exports.MangoInstructionLayout.addVariant(36, buffer_layout_1.struct([u64('quantity')]), 'WithdrawMsrm');
exports.MangoInstructionLayout.addVariant(37, buffer_layout_1.struct([
    bool('maintLeverageOption'),
    I80F48Layout('maintLeverage'),
    bool('initLeverageOption'),
    I80F48Layout('initLeverage'),
    bool('liquidationFeeOption'),
    I80F48Layout('liquidationFee'),
    bool('makerFeeOption'),
    I80F48Layout('makerFee'),
    bool('takerFeeOption'),
    I80F48Layout('takerFee'),
    bool('rateOption'),
    I80F48Layout('rate'),
    bool('maxDepthBpsOption'),
    I80F48Layout('maxDepthBps'),
    bool('targetPeriodLengthOption'),
    u64('targetPeriodLength'),
    bool('mngoPerPeriodOption'),
    u64('mngoPerPeriod'),
    bool('expOption'),
    buffer_layout_1.u8('exp'),
]), 'ChangePerpMarketParams');
exports.MangoInstructionLayout.addVariant(38, buffer_layout_1.struct([]), 'SetGroupAdmin');
exports.MangoInstructionLayout.addVariant(39, buffer_layout_1.struct([buffer_layout_1.u8('limit')]), 'CancelAllPerpOrders');
exports.MangoInstructionLayout.addVariant(41, buffer_layout_1.struct([
    sideLayout(4, 'side'),
    u64('limitPrice'),
    u64('maxBaseQuantity'),
    u64('maxQuoteQuantity'),
    selfTradeBehaviorLayout('selfTradeBehavior', 4),
    orderTypeLayout('orderType', 4),
    u64('clientOrderId'),
    buffer_layout_1.u16('limit'),
]), 'PlaceSpotOrder2');
exports.MangoInstructionLayout.addVariant(42, buffer_layout_1.struct([]), 'InitAdvancedOrders');
exports.MangoInstructionLayout.addVariant(43, buffer_layout_1.struct([
    orderTypeLayout('orderType', 1),
    sideLayout(1, 'side'),
    triggerConditionLayout('triggerCondition', 1),
    bool('reduceOnly'),
    u64('clientOrderId'),
    i64('price'),
    i64('quantity'),
    I80F48Layout('triggerPrice'),
]), 'AddPerpTriggerOrder');
exports.MangoInstructionLayout.addVariant(44, buffer_layout_1.struct([buffer_layout_1.u8('orderIndex')]), 'RemoveAdvancedOrder');
exports.MangoInstructionLayout.addVariant(45, buffer_layout_1.struct([buffer_layout_1.u8('orderIndex')]), 'ExecutePerpTriggerOrder');
exports.MangoInstructionLayout.addVariant(46, buffer_layout_1.struct([
    I80F48Layout('maintLeverage'),
    I80F48Layout('initLeverage'),
    I80F48Layout('liquidationFee'),
    I80F48Layout('makerFee'),
    I80F48Layout('takerFee'),
    i64('baseLotSize'),
    i64('quoteLotSize'),
    I80F48Layout('rate'),
    I80F48Layout('maxDepthBps'),
    u64('targetPeriodLength'),
    u64('mngoPerPeriod'),
    buffer_layout_1.u8('exp'),
    buffer_layout_1.u8('version'),
    buffer_layout_1.u8('lmSizeShift'),
    buffer_layout_1.u8('baseDecimals'),
]), 'CreatePerpMarket');
exports.MangoInstructionLayout.addVariant(47, buffer_layout_1.struct([
    bool('maintLeverageOption'),
    I80F48Layout('maintLeverage'),
    bool('initLeverageOption'),
    I80F48Layout('initLeverage'),
    bool('liquidationFeeOption'),
    I80F48Layout('liquidationFee'),
    bool('makerFeeOption'),
    I80F48Layout('makerFee'),
    bool('takerFeeOption'),
    I80F48Layout('takerFee'),
    bool('rateOption'),
    I80F48Layout('rate'),
    bool('maxDepthBpsOption'),
    I80F48Layout('maxDepthBps'),
    bool('targetPeriodLengthOption'),
    u64('targetPeriodLength'),
    bool('mngoPerPeriodOption'),
    u64('mngoPerPeriod'),
    bool('expOption'),
    buffer_layout_1.u8('exp'),
    bool('versionOption'),
    buffer_layout_1.u8('version'),
    bool('lmSizeShiftOption'),
    buffer_layout_1.u8('lmSizeShift'),
]), 'ChangePerpMarketParams2');
exports.MangoInstructionLayout.addVariant(48, buffer_layout_1.struct([]), 'UpdateMarginBasket');
exports.MangoInstructionLayout.addVariant(49, buffer_layout_1.struct([buffer_layout_1.u32('maxMangoAccounts')]), 'ChangeMaxMangoAccounts');
exports.MangoInstructionLayout.addVariant(50, buffer_layout_1.struct([]), 'CloseMangoAccount');
exports.MangoInstructionLayout.addVariant(51, buffer_layout_1.struct([]), 'CloseSpotOpenOrders');
exports.MangoInstructionLayout.addVariant(52, buffer_layout_1.struct([]), 'CloseAdvancedOrders');
exports.MangoInstructionLayout.addVariant(53, buffer_layout_1.struct([]), 'CreateDustAccount');
exports.MangoInstructionLayout.addVariant(54, buffer_layout_1.struct([]), 'ResolveDust');
exports.MangoInstructionLayout.addVariant(55, buffer_layout_1.struct([u64('accountNum')]), 'CreateMangoAccount');
exports.MangoInstructionLayout.addVariant(56, buffer_layout_1.struct([]), 'UpgradeMangoAccountV0V1');
exports.MangoInstructionLayout.addVariant(57, buffer_layout_1.struct([sideLayout(1, 'side'), buffer_layout_1.u8('limit')]), 'CancelPerpOrdersSide');
exports.MangoInstructionLayout.addVariant(58, buffer_layout_1.struct([]), 'SetDelegate');
exports.MangoInstructionLayout.addVariant(59, buffer_layout_1.struct([
    bool('maintLeverageOption'),
    I80F48Layout('maintLeverage'),
    bool('initLeverageOption'),
    I80F48Layout('initLeverage'),
    bool('liquidationFeeOption'),
    I80F48Layout('liquidationFee'),
    bool('optimalUtilOption'),
    I80F48Layout('optimalUtil'),
    bool('optimalRateOption'),
    I80F48Layout('optimalRate'),
    bool('maxRateOption'),
    I80F48Layout('maxRate'),
    bool('versionOption'),
    buffer_layout_1.u8('version'),
]), 'ChangeSpotMarketParams');
exports.MangoInstructionLayout.addVariant(60, buffer_layout_1.struct([]), 'CreateSpotOpenOrders');
exports.MangoInstructionLayout.addVariant(61, buffer_layout_1.struct([
    buffer_layout_1.u32('refSurchargeCentibps'),
    buffer_layout_1.u32('refShareCentibps'),
    u64('refMngoRequired'),
]), 'ChangeReferralFeeParams');
exports.MangoInstructionLayout.addVariant(62, buffer_layout_1.struct([]), 'SetReferrerMemory');
exports.MangoInstructionLayout.addVariant(63, buffer_layout_1.struct([buffer_layout_1.seq(buffer_layout_1.u8(), exports.INFO_LEN, 'referrerId')]), 'RegisterReferrerId');
exports.MangoInstructionLayout.addVariant(64, buffer_layout_1.struct([
    i64('price'),
    i64('maxBaseQuantity'),
    i64('maxQuoteQuantity'),
    u64('clientOrderId'),
    u64('expiryTimestamp'),
    sideLayout(1, 'side'),
    orderTypeLayout('orderType', 1),
    bool('reduceOnly'),
    buffer_layout_1.u8('limit'),
]), 'PlacePerpOrder2');
const instructionMaxSpan = Math.max(
// @ts-ignore
...Object.values(exports.MangoInstructionLayout.registry).map((r) => r.span));
/** @internal */
function encodeMangoInstruction(data) {
    const b = Buffer.alloc(instructionMaxSpan);
    // @ts-ignore
    const span = exports.MangoInstructionLayout.encode(data, b);
    return b.slice(0, span);
}
exports.encodeMangoInstruction = encodeMangoInstruction;
/** @internal */
class PublicKeyLayout extends buffer_layout_1.Blob {
    constructor(property) {
        super(32, property);
    }
    decode(b, offset) {
        return new web3_js_1.PublicKey(super.decode(b, offset));
    }
    encode(src, b, offset) {
        return super.encode(src.toBuffer(), b, offset);
    }
}
exports.PublicKeyLayout = PublicKeyLayout;
/** @internal */
function publicKeyLayout(property = '') {
    return new PublicKeyLayout(property);
}
exports.publicKeyLayout = publicKeyLayout;
/** @internal */
exports.DataType = {
    MangoGroup: 0,
    MangoAccount: 1,
    RootBank: 2,
    NodeBank: 3,
    PerpMarket: 4,
    Bids: 5,
    Asks: 6,
    MangoCache: 7,
    EventQueue: 8,
    AdvancedOrders: 9,
    ReferrerMemory: 10,
    ReferrerIdRecord: 11,
};
class MetaData {
    constructor(decoded) {
        Object.assign(this, decoded);
    }
}
exports.MetaData = MetaData;
/** @internal */
class MetaDataLayout extends buffer_layout_1.Structure {
    constructor(property) {
        super([
            buffer_layout_1.u8('dataType'),
            buffer_layout_1.u8('version'),
            buffer_layout_1.u8('isInitialized'),
            buffer_layout_1.seq(buffer_layout_1.u8(), 5, 'extraInfo'),
        ], property);
    }
    decode(b, offset) {
        return new MetaData(super.decode(b, offset));
    }
    encode(src, b, offset) {
        return super.encode(src.toBuffer(), b, offset);
    }
}
exports.MetaDataLayout = MetaDataLayout;
/** @internal */
function metaDataLayout(property = '') {
    return new MetaDataLayout(property);
}
exports.metaDataLayout = metaDataLayout;
/** @internal */
class TokenInfo {
    constructor(decoded) {
        Object.assign(this, decoded);
    }
    isEmpty() {
        return this.mint.equals(utils_1.zeroKey);
    }
}
exports.TokenInfo = TokenInfo;
/** @internal */
class TokenInfoLayout extends buffer_layout_1.Structure {
    constructor(property) {
        super([
            publicKeyLayout('mint'),
            publicKeyLayout('rootBank'),
            buffer_layout_1.u8('decimals'),
            buffer_layout_1.seq(buffer_layout_1.u8(), 7, 'padding'),
        ], property);
    }
    decode(b, offset) {
        return new TokenInfo(super.decode(b, offset));
    }
    encode(src, b, offset) {
        return super.encode(src.toBuffer(), b, offset);
    }
}
exports.TokenInfoLayout = TokenInfoLayout;
/** @internal */
function tokenInfoLayout(property = '') {
    return new TokenInfoLayout(property);
}
exports.tokenInfoLayout = tokenInfoLayout;
class SpotMarketInfo {
    constructor(decoded) {
        Object.assign(this, decoded);
    }
    isEmpty() {
        return this.spotMarket.equals(utils_1.zeroKey);
    }
}
exports.SpotMarketInfo = SpotMarketInfo;
/** @internal */
class SpotMarketInfoLayout extends buffer_layout_1.Structure {
    constructor(property) {
        super([
            publicKeyLayout('spotMarket'),
            I80F48Layout('maintAssetWeight'),
            I80F48Layout('initAssetWeight'),
            I80F48Layout('maintLiabWeight'),
            I80F48Layout('initLiabWeight'),
            I80F48Layout('liquidationFee'),
        ], property);
    }
    decode(b, offset) {
        return new SpotMarketInfo(super.decode(b, offset));
    }
    encode(src, b, offset) {
        return super.encode(src.toBuffer(), b, offset);
    }
}
exports.SpotMarketInfoLayout = SpotMarketInfoLayout;
/** @internal */
function spotMarketInfoLayout(property = '') {
    return new SpotMarketInfoLayout(property);
}
exports.spotMarketInfoLayout = spotMarketInfoLayout;
class PerpMarketInfo {
    constructor(decoded) {
        Object.assign(this, decoded);
    }
    isEmpty() {
        return this.perpMarket.equals(utils_1.zeroKey);
    }
}
exports.PerpMarketInfo = PerpMarketInfo;
/** @internal */
class PerpMarketInfoLayout extends buffer_layout_1.Structure {
    constructor(property) {
        super([
            publicKeyLayout('perpMarket'),
            I80F48Layout('maintAssetWeight'),
            I80F48Layout('initAssetWeight'),
            I80F48Layout('maintLiabWeight'),
            I80F48Layout('initLiabWeight'),
            I80F48Layout('liquidationFee'),
            I80F48Layout('makerFee'),
            I80F48Layout('takerFee'),
            i64('baseLotSize'),
            i64('quoteLotSize'),
        ], property);
    }
    decode(b, offset) {
        return new PerpMarketInfo(super.decode(b, offset));
    }
    encode(src, b, offset) {
        return super.encode(src.toBuffer(), b, offset);
    }
}
exports.PerpMarketInfoLayout = PerpMarketInfoLayout;
/** @internal */
function perpMarketInfoLayout(property = '') {
    return new PerpMarketInfoLayout(property);
}
exports.perpMarketInfoLayout = perpMarketInfoLayout;
/** @internal */
class PerpAccountLayout extends buffer_layout_1.Structure {
    constructor(property) {
        super([
            i64('basePosition'),
            I80F48Layout('quotePosition'),
            I80F48Layout('longSettledFunding'),
            I80F48Layout('shortSettledFunding'),
            i64('bidsQuantity'),
            i64('asksQuantity'),
            i64('takerBase'),
            i64('takerQuote'),
            u64('mngoAccrued'),
        ], property);
    }
    decode(b, offset) {
        return new PerpAccount_1.default(super.decode(b, offset));
    }
    encode(src, b, offset) {
        return super.encode(src.toBuffer(), b, offset);
    }
}
exports.PerpAccountLayout = PerpAccountLayout;
/** @internal */
function perpAccountLayout(property = '') {
    return new PerpAccountLayout(property);
}
exports.perpAccountLayout = perpAccountLayout;
/** @internal */
exports.MangoGroupLayout = buffer_layout_1.struct([
    metaDataLayout('metaData'),
    u64('numOracles'),
    buffer_layout_1.seq(tokenInfoLayout(), exports.MAX_TOKENS, 'tokens'),
    buffer_layout_1.seq(spotMarketInfoLayout(), exports.MAX_PAIRS, 'spotMarkets'),
    buffer_layout_1.seq(perpMarketInfoLayout(), exports.MAX_PAIRS, 'perpMarkets'),
    buffer_layout_1.seq(publicKeyLayout(), exports.MAX_PAIRS, 'oracles'),
    u64('signerNonce'),
    publicKeyLayout('signerKey'),
    publicKeyLayout('admin'),
    publicKeyLayout('dexProgramId'),
    publicKeyLayout('mangoCache'),
    u64('validInterval'),
    publicKeyLayout('insuranceVault'),
    publicKeyLayout('srmVault'),
    publicKeyLayout('msrmVault'),
    publicKeyLayout('feesVault'),
    buffer_layout_1.u32('maxMangoAccounts'),
    buffer_layout_1.u32('numMangoAccounts'),
    buffer_layout_1.u32('refSurchargeCentibps'),
    buffer_layout_1.u32('refShareCentibps'),
    u64('refMngoRequired'),
    buffer_layout_1.seq(buffer_layout_1.u8(), 8, 'padding'),
]);
/** @internal */
exports.MangoAccountLayout = buffer_layout_1.struct([
    metaDataLayout('metaData'),
    publicKeyLayout('mangoGroup'),
    publicKeyLayout('owner'),
    buffer_layout_1.seq(bool(), exports.MAX_PAIRS, 'inMarginBasket'),
    buffer_layout_1.u8('numInMarginBasket'),
    buffer_layout_1.seq(I80F48Layout(), exports.MAX_TOKENS, 'deposits'),
    buffer_layout_1.seq(I80F48Layout(), exports.MAX_TOKENS, 'borrows'),
    buffer_layout_1.seq(publicKeyLayout(), exports.MAX_PAIRS, 'spotOpenOrders'),
    buffer_layout_1.seq(perpAccountLayout(), exports.MAX_PAIRS, 'perpAccounts'),
    buffer_layout_1.seq(buffer_layout_1.u8(), exports.MAX_PERP_OPEN_ORDERS, 'orderMarket'),
    buffer_layout_1.seq(sideLayout(1), exports.MAX_PERP_OPEN_ORDERS, 'orderSide'),
    buffer_layout_1.seq(i128(), exports.MAX_PERP_OPEN_ORDERS, 'orders'),
    buffer_layout_1.seq(u64(), exports.MAX_PERP_OPEN_ORDERS, 'clientOrderIds'),
    u64('msrmAmount'),
    bool('beingLiquidated'),
    bool('isBankrupt'),
    buffer_layout_1.seq(buffer_layout_1.u8(), exports.INFO_LEN, 'info'),
    publicKeyLayout('advancedOrdersKey'),
    bool('notUpgradable'),
    publicKeyLayout('delegate'),
    buffer_layout_1.seq(buffer_layout_1.u8(), 5, 'padding'),
]);
/** @internal */
exports.RootBankLayout = buffer_layout_1.struct([
    metaDataLayout('metaData'),
    I80F48Layout('optimalUtil'),
    I80F48Layout('optimalRate'),
    I80F48Layout('maxRate'),
    u64('numNodeBanks'),
    buffer_layout_1.seq(publicKeyLayout(), exports.MAX_NODE_BANKS, 'nodeBanks'),
    I80F48Layout('depositIndex'),
    I80F48Layout('borrowIndex'),
    u64('lastUpdated'),
    buffer_layout_1.seq(buffer_layout_1.u8(), 64, 'padding'),
]);
/** @internal */
exports.NodeBankLayout = buffer_layout_1.struct([
    metaDataLayout('metaData'),
    I80F48Layout('deposits'),
    I80F48Layout('borrows'),
    publicKeyLayout('vault'),
]);
/** @internal */
exports.StubOracleLayout = buffer_layout_1.struct([
    buffer_layout_1.seq(buffer_layout_1.u8(), 8),
    I80F48Layout('price'),
    u64('lastUpdate'),
]);
/** @internal */
class LiquidityMiningInfoLayout extends buffer_layout_1.Structure {
    constructor(property) {
        super([
            I80F48Layout('rate'),
            I80F48Layout('maxDepthBps'),
            u64('periodStart'),
            u64('targetPeriodLength'),
            u64('mngoLeft'),
            u64('mngoPerPeriod'),
        ], property);
    }
    decode(b, offset) {
        return new MetaData(super.decode(b, offset));
    }
    encode(src, b, offset) {
        return super.encode(src.toBuffer(), b, offset);
    }
}
exports.LiquidityMiningInfoLayout = LiquidityMiningInfoLayout;
/** @internal */
function liquidityMiningInfoLayout(property = '') {
    return new LiquidityMiningInfoLayout(property);
}
exports.liquidityMiningInfoLayout = liquidityMiningInfoLayout;
/** @internal */
exports.PerpMarketLayout = buffer_layout_1.struct([
    metaDataLayout('metaData'),
    publicKeyLayout('mangoGroup'),
    publicKeyLayout('bids'),
    publicKeyLayout('asks'),
    publicKeyLayout('eventQueue'),
    i64('quoteLotSize'),
    i64('baseLotSize'),
    I80F48Layout('longFunding'),
    I80F48Layout('shortFunding'),
    i64('openInterest'),
    u64('lastUpdated'),
    u64('seqNum'),
    I80F48Layout('feesAccrued'),
    liquidityMiningInfoLayout('liquidityMiningInfo'),
    publicKeyLayout('mngoVault'),
]);
const EVENT_SIZE = 200;
/** @internal */
exports.PerpEventLayout = buffer_layout_1.union(buffer_layout_1.u8('eventType'), buffer_layout_1.blob(EVENT_SIZE - 1), 'event');
exports.PerpEventLayout.addVariant(0, buffer_layout_1.struct([
    sideLayout(1, 'takerSide'),
    buffer_layout_1.u8('makerSlot'),
    bool('makerOut'),
    buffer_layout_1.u8('version'),
    buffer_layout_1.seq(buffer_layout_1.u8(), 3),
    u64('timestamp'),
    u64('seqNum'),
    publicKeyLayout('maker'),
    i128('makerOrderId'),
    u64('makerClientOrderId'),
    I80F48Layout('makerFee'),
    i64('bestInitial'),
    u64('makerTimestamp'),
    publicKeyLayout('taker'),
    i128('takerOrderId'),
    u64('takerClientOrderId'),
    I80F48Layout('takerFee'),
    i64('price'),
    i64('quantity'),
]), 'fill');
exports.PerpEventLayout.addVariant(1, buffer_layout_1.struct([
    sideLayout(1, 'side'),
    buffer_layout_1.u8('slot'),
    buffer_layout_1.seq(buffer_layout_1.u8(), 5),
    u64('timestamp'),
    u64('seqNum'),
    publicKeyLayout('owner'),
    i64('quantity'),
    buffer_layout_1.seq(buffer_layout_1.u8(), EVENT_SIZE - 64, 'padding'),
]), 'out');
exports.PerpEventLayout.addVariant(2, buffer_layout_1.struct([
    buffer_layout_1.seq(buffer_layout_1.u8(), 7),
    u64('timestamp'),
    u64('seqNum'),
    publicKeyLayout('liqee'),
    publicKeyLayout('liqor'),
    I80F48Layout('price'),
    i64('quantity'),
    I80F48Layout('liquidationFee'),
    buffer_layout_1.seq(buffer_layout_1.u8(), EVENT_SIZE - 128, 'padding'),
]), 'liquidate');
/** @internal */
exports.PerpEventQueueHeaderLayout = buffer_layout_1.struct([
    metaDataLayout('metaData'),
    u64('head'),
    u64('count'),
    u64('seqNum'),
]);
/** @internal */
exports.PerpEventQueueLayout = buffer_layout_1.struct([
    metaDataLayout('metaData'),
    u64('head'),
    u64('count'),
    u64('seqNum'),
    buffer_layout_1.seq(exports.PerpEventLayout, buffer_layout_1.greedy(exports.PerpEventLayout.span), 'events'),
]);
const BOOK_NODE_SIZE = 88;
const BOOK_NODE_LAYOUT = buffer_layout_1.union(buffer_layout_1.u32('tag'), buffer_layout_1.blob(BOOK_NODE_SIZE - 4), 'node');
BOOK_NODE_LAYOUT.addVariant(0, buffer_layout_1.struct([]), 'uninitialized');
BOOK_NODE_LAYOUT.addVariant(1, buffer_layout_1.struct([
    // Only the first prefixLen high-order bits of key are meaningful
    buffer_layout_1.u32('prefixLen'),
    u128('key'),
    buffer_layout_1.seq(buffer_layout_1.u32(), 2, 'children'),
]), 'innerNode');
BOOK_NODE_LAYOUT.addVariant(2, buffer_layout_1.struct([
    buffer_layout_1.u8('ownerSlot'),
    orderTypeLayout('orderType', 1),
    buffer_layout_1.u8('version'),
    buffer_layout_1.u8('timeInForce'),
    u128('key'),
    publicKeyLayout('owner'),
    u64('quantity'),
    u64('clientOrderId'),
    u64('bestInitial'),
    u64('timestamp'),
]), 'leafNode');
BOOK_NODE_LAYOUT.addVariant(3, buffer_layout_1.struct([buffer_layout_1.u32('next')]), 'freeNode');
BOOK_NODE_LAYOUT.addVariant(4, buffer_layout_1.struct([]), 'lastFreeNode');
/** @internal */
exports.BookSideLayout = buffer_layout_1.struct([
    metaDataLayout('metaData'),
    buffer_layout_1.nu64('bumpIndex'),
    buffer_layout_1.nu64('freeListLen'),
    buffer_layout_1.u32('freeListHead'),
    buffer_layout_1.u32('rootNode'),
    buffer_layout_1.nu64('leafCount'),
    buffer_layout_1.seq(BOOK_NODE_LAYOUT, MAX_BOOK_NODES, 'nodes'),
]);
class PriceCache {
    constructor(decoded) {
        Object.assign(this, decoded);
    }
}
exports.PriceCache = PriceCache;
/** @internal */
class PriceCacheLayout extends buffer_layout_1.Structure {
    constructor(property) {
        super([I80F48Layout('price'), u64('lastUpdate')], property);
    }
    decode(b, offset) {
        return new PriceCache(super.decode(b, offset));
    }
    encode(src, b, offset) {
        return super.encode(src.toBuffer(), b, offset);
    }
}
exports.PriceCacheLayout = PriceCacheLayout;
/** @internal */
function priceCacheLayout(property = '') {
    return new PriceCacheLayout(property);
}
exports.priceCacheLayout = priceCacheLayout;
class RootBankCache {
    constructor(decoded) {
        Object.assign(this, decoded);
    }
}
exports.RootBankCache = RootBankCache;
/** @internal */
class RootBankCacheLayout extends buffer_layout_1.Structure {
    constructor(property) {
        super([
            I80F48Layout('depositIndex'),
            I80F48Layout('borrowIndex'),
            u64('lastUpdate'),
        ], property);
    }
    decode(b, offset) {
        return new RootBankCache(super.decode(b, offset));
    }
    encode(src, b, offset) {
        return super.encode(src.toBuffer(), b, offset);
    }
}
exports.RootBankCacheLayout = RootBankCacheLayout;
/** @internal */
function rootBankCacheLayout(property = '') {
    return new RootBankCacheLayout(property);
}
exports.rootBankCacheLayout = rootBankCacheLayout;
class PerpMarketCache {
    constructor(decoded) {
        Object.assign(this, decoded);
    }
}
exports.PerpMarketCache = PerpMarketCache;
/** @internal */
class PerpMarketCacheLayout extends buffer_layout_1.Structure {
    constructor(property) {
        super([
            I80F48Layout('longFunding'),
            I80F48Layout('shortFunding'),
            u64('lastUpdate'),
        ], property);
    }
    decode(b, offset) {
        return new PerpMarketCache(super.decode(b, offset));
    }
    encode(src, b, offset) {
        return super.encode(src.toBuffer(), b, offset);
    }
}
exports.PerpMarketCacheLayout = PerpMarketCacheLayout;
/** @internal */
function perpMarketCacheLayout(property = '') {
    return new PerpMarketCacheLayout(property);
}
exports.perpMarketCacheLayout = perpMarketCacheLayout;
/** @internal */
exports.MangoCacheLayout = buffer_layout_1.struct([
    metaDataLayout('metaData'),
    buffer_layout_1.seq(priceCacheLayout(), exports.MAX_PAIRS, 'priceCache'),
    buffer_layout_1.seq(rootBankCacheLayout(), exports.MAX_TOKENS, 'rootBankCache'),
    buffer_layout_1.seq(perpMarketCacheLayout(), exports.MAX_PAIRS, 'perpMarketCache'),
]);
class MangoCache {
    constructor(publicKey, decoded) {
        this.publicKey = publicKey;
        Object.assign(this, decoded);
    }
    getPrice(tokenIndex) {
        return tokenIndex === exports.QUOTE_INDEX
            ? fixednum_1.ONE_I80F48
            : this.priceCache[tokenIndex].price;
    }
}
exports.MangoCache = MangoCache;
class NodeBank {
    constructor(publicKey, decoded) {
        this.publicKey = publicKey;
        Object.assign(this, decoded);
    }
}
exports.NodeBank = NodeBank;
/** @internal */
exports.TokenAccountLayout = buffer_layout_1.struct([
    publicKeyLayout('mint'),
    publicKeyLayout('owner'),
    buffer_layout_1.nu64('amount'),
    buffer_layout_1.blob(93),
]);
const ADVANCED_ORDER_SIZE = 80;
const ADVANCED_ORDER_LAYOUT = buffer_layout_1.union(buffer_layout_1.u8('advancedOrderType'), buffer_layout_1.blob(ADVANCED_ORDER_SIZE - 1), 'advancedOrder');
ADVANCED_ORDER_LAYOUT.addVariant(0, buffer_layout_1.struct([
    bool('isActive'),
    buffer_layout_1.u8('marketIndex'),
    orderTypeLayout('orderType', 1),
    sideLayout(1, 'side'),
    triggerConditionLayout('triggerCondition', 1),
    bool('reduceOnly'),
    buffer_layout_1.seq(buffer_layout_1.u8(), 1, 'padding0'),
    u64('clientOrderId'),
    i64('price'),
    i64('quantity'),
    I80F48Layout('triggerPrice'),
    buffer_layout_1.seq(buffer_layout_1.u8(), 32, 'padding1'),
]), 'perpTrigger');
const MAX_ADVANCED_ORDERS = 32;
exports.AdvancedOrdersLayout = buffer_layout_1.struct([
    metaDataLayout('metaData'),
    buffer_layout_1.seq(ADVANCED_ORDER_LAYOUT, MAX_ADVANCED_ORDERS, 'orders'),
]);
/** @internal */
class ReferrerMemory {
    constructor(decoded) {
        Object.assign(this, decoded);
    }
}
exports.ReferrerMemory = ReferrerMemory;
/** @internal */
exports.ReferrerMemoryLayout = buffer_layout_1.struct([
    metaDataLayout('metaData'),
    publicKeyLayout('referrerMangoAccount'),
]);
/** @internal */
class ReferrerIdRecord {
    constructor(decoded) {
        Object.assign(this, decoded);
    }
    get referrerId() {
        return this.id
            ? String.fromCharCode(...this.id).replace(new RegExp(String.fromCharCode(0), 'g'), '')
            : '';
    }
}
exports.ReferrerIdRecord = ReferrerIdRecord;
/** @internal */
exports.ReferrerIdRecordLayout = buffer_layout_1.struct([
    metaDataLayout('metaData'),
    publicKeyLayout('referrerMangoAccount'),
    buffer_layout_1.seq(buffer_layout_1.u8(), exports.INFO_LEN, 'id'),
]);
//# sourceMappingURL=layout.js.map