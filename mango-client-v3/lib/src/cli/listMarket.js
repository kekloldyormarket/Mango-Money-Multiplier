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
const bn_js_1 = __importDefault(require("bn.js"));
const serum_1 = require("@project-serum/serum");
const web3_js_1 = require("@solana/web3.js");
const client_1 = require("../client");
const utils_1 = require("../utils/utils");
function listMarket(connection, payer, mangoProgramId, baseMint, quoteMint, baseLotSize, quoteLotSize, dexProgramId) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new client_1.MangoClient(connection, mangoProgramId);
        const market = new web3_js_1.Account();
        const requestQueue = new web3_js_1.Account();
        const eventQueue = new web3_js_1.Account();
        const bids = new web3_js_1.Account();
        const asks = new web3_js_1.Account();
        const baseVault = new web3_js_1.Account();
        const quoteVault = new web3_js_1.Account();
        const feeRateBps = 0;
        const quoteDustThreshold = new bn_js_1.default(100);
        function getVaultOwnerAndNonce() {
            return __awaiter(this, void 0, void 0, function* () {
                const nonce = utils_1.ZERO_BN.clone();
                // eslint-disable-next-line
                while (true) {
                    try {
                        const vaultOwner = yield web3_js_1.PublicKey.createProgramAddress([market.publicKey.toBuffer(), nonce.toArrayLike(Buffer, 'le', 8)], dexProgramId);
                        return [vaultOwner, nonce];
                    }
                    catch (e) {
                        nonce.iaddn(1);
                    }
                }
            });
        }
        const [vaultOwner, vaultSignerNonce] = yield getVaultOwnerAndNonce();
        const tx1 = new web3_js_1.Transaction();
        tx1.add(web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: baseVault.publicKey,
            lamports: yield connection.getMinimumBalanceForRentExemption(165),
            space: 165,
            programId: serum_1.TokenInstructions.TOKEN_PROGRAM_ID,
        }), web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: quoteVault.publicKey,
            lamports: yield connection.getMinimumBalanceForRentExemption(165),
            space: 165,
            programId: serum_1.TokenInstructions.TOKEN_PROGRAM_ID,
        }), serum_1.TokenInstructions.initializeAccount({
            account: baseVault.publicKey,
            mint: baseMint,
            owner: vaultOwner,
        }), serum_1.TokenInstructions.initializeAccount({
            account: quoteVault.publicKey,
            mint: quoteMint,
            owner: vaultOwner,
        }));
        const tx2 = new web3_js_1.Transaction();
        tx2.add(web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: market.publicKey,
            lamports: yield connection.getMinimumBalanceForRentExemption(serum_1.Market.getLayout(dexProgramId).span),
            space: serum_1.Market.getLayout(dexProgramId).span,
            programId: dexProgramId,
        }), web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: requestQueue.publicKey,
            lamports: yield connection.getMinimumBalanceForRentExemption(5120 + 12),
            space: 5120 + 12,
            programId: dexProgramId,
        }), web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: eventQueue.publicKey,
            lamports: yield connection.getMinimumBalanceForRentExemption(262144 + 12),
            space: 262144 + 12,
            programId: dexProgramId,
        }), web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: bids.publicKey,
            lamports: yield connection.getMinimumBalanceForRentExemption(65536 + 12),
            space: 65536 + 12,
            programId: dexProgramId,
        }), web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: asks.publicKey,
            lamports: yield connection.getMinimumBalanceForRentExemption(65536 + 12),
            space: 65536 + 12,
            programId: dexProgramId,
        }), serum_1.DexInstructions.initializeMarket({
            market: market.publicKey,
            requestQueue: requestQueue.publicKey,
            eventQueue: eventQueue.publicKey,
            bids: bids.publicKey,
            asks: asks.publicKey,
            baseVault: baseVault.publicKey,
            quoteVault: quoteVault.publicKey,
            baseMint,
            quoteMint,
            baseLotSize: new bn_js_1.default(baseLotSize),
            quoteLotSize: new bn_js_1.default(quoteLotSize),
            feeRateBps,
            vaultSignerNonce,
            quoteDustThreshold,
            programId: dexProgramId,
        }));
        yield client.sendTransaction(tx1, payer, [baseVault, quoteVault]);
        yield client.sendTransaction(tx2, payer, [
            market,
            requestQueue,
            eventQueue,
            bids,
            asks,
        ]);
        return market.publicKey;
    });
}
exports.default = listMarket;
//# sourceMappingURL=listMarket.js.map