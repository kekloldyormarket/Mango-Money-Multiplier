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
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLargestTokenAccountForOwner = exports.getTokenAccountsByOwnerWithWrappedSol = exports.TokenAccount = void 0;
const serum_1 = require("@project-serum/serum");
const layout_1 = require("../layout");
class TokenAccount {
    constructor(publicKey, decoded) {
        this.publicKey = publicKey;
        Object.assign(this, decoded);
    }
}
exports.TokenAccount = TokenAccount;
function parseTokenResponse(r) {
    return r.value.map(({ pubkey, account }) => new TokenAccount(pubkey, layout_1.TokenAccountLayout.decode(account.data)));
}
function getTokenAccountsByOwnerWithWrappedSol(connection, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const solReq = connection.getAccountInfo(owner);
        const tokenReq = connection.getTokenAccountsByOwner(owner, {
            programId: serum_1.TokenInstructions.TOKEN_PROGRAM_ID,
        });
        // fetch data
        const [solResp, tokenResp] = yield Promise.all([solReq, tokenReq]);
        // parse token accounts
        const tokenAccounts = parseTokenResponse(tokenResp);
        // create fake wrapped sol account to reflect sol balances in user's wallet
        const solAccount = new TokenAccount(owner, {
            mint: serum_1.TokenInstructions.WRAPPED_SOL_MINT,
            owner,
            amount: (solResp === null || solResp === void 0 ? void 0 : solResp.lamports) || 0,
        });
        // prepend SOL account to beginning of list
        return [solAccount].concat(tokenAccounts);
    });
}
exports.getTokenAccountsByOwnerWithWrappedSol = getTokenAccountsByOwnerWithWrappedSol;
function findLargestTokenAccountForOwner(connection, owner, mint) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield connection.getTokenAccountsByOwner(owner, { mint }, connection.commitment);
        let maxTokenAccount = null;
        for (const acc of parseTokenResponse(response)) {
            if (!maxTokenAccount || acc.amount > maxTokenAccount.amount) {
                maxTokenAccount = acc;
            }
        }
        if (!maxTokenAccount) {
            throw new Error('No accounts for this token');
        }
        return maxTokenAccount;
    });
}
exports.findLargestTokenAccountForOwner = findLargestTokenAccountForOwner;
//# sourceMappingURL=token.js.map