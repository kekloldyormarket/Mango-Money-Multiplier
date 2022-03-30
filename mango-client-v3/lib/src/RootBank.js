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
const fixednum_1 = require("./utils/fixednum");
const layout_1 = require("./layout");
const utils_1 = require("./utils/utils");
class RootBank {
    //mintKey: PublicKey;
    constructor(publicKey, decoded) {
        this.publicKey = publicKey;
        Object.assign(this, decoded);
        this.nodeBankAccounts = [];
        //this.mintKey = tokenMint;
    }
    loadNodeBanks(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            const filteredNodeBanks = this.nodeBanks.filter((nb) => !nb.equals(utils_1.zeroKey));
            const accounts = yield (0, utils_1.getMultipleAccounts)(connection, filteredNodeBanks);
            const nodeBankAccounts = accounts.map((acc) => {
                const decoded = layout_1.NodeBankLayout.decode(acc.accountInfo.data);
                return new layout_1.NodeBank(acc.publicKey, decoded);
            });
            this.nodeBankAccounts = nodeBankAccounts;
            return nodeBankAccounts;
        });
    }
    getNativeTotalDeposit() {
        if (!this.nodeBankAccounts.length)
            throw new Error('Node bank accounts empty');
        let totalDeposits = fixednum_1.ZERO_I80F48;
        for (let i = 0; i < this.nodeBankAccounts.length; i++) {
            totalDeposits = totalDeposits.add(this.nodeBankAccounts[i].deposits);
        }
        return this.depositIndex.mul(totalDeposits);
    }
    getNativeTotalBorrow() {
        if (!this.nodeBankAccounts.length)
            throw new Error('Node bank accounts empty');
        let totalBorrow = fixednum_1.ZERO_I80F48;
        for (let i = 0; i < this.nodeBankAccounts.length; i++) {
            totalBorrow = totalBorrow.add(this.nodeBankAccounts[i].borrows);
        }
        return this.borrowIndex.mul(totalBorrow);
    }
    getUiTotalDeposit(mangoGroup) {
        const tokenIndex = mangoGroup.getRootBankIndex(this.publicKey);
        return (0, utils_1.nativeI80F48ToUi)(this.getNativeTotalDeposit(), mangoGroup.tokens[tokenIndex].decimals);
    }
    getUiTotalBorrow(mangoGroup) {
        const tokenIndex = mangoGroup.getRootBankIndex(this.publicKey);
        return (0, utils_1.nativeI80F48ToUi)(this.getNativeTotalBorrow(), mangoGroup.tokens[tokenIndex].decimals);
    }
    getBorrowRate(mangoGroup) {
        const totalBorrows = this.getUiTotalBorrow(mangoGroup);
        const totalDeposits = this.getUiTotalDeposit(mangoGroup);
        if (totalDeposits.eq(fixednum_1.ZERO_I80F48) && totalBorrows.eq(fixednum_1.ZERO_I80F48)) {
            return fixednum_1.ZERO_I80F48;
        }
        if (totalDeposits.lte(totalBorrows)) {
            return this.maxRate;
        }
        const utilization = totalBorrows.div(totalDeposits);
        if (utilization.gt(this.optimalUtil)) {
            const extraUtil = utilization.sub(this.optimalUtil);
            const slope = this.maxRate
                .sub(this.optimalRate)
                .div(fixednum_1.I80F48.fromNumber(1).sub(this.optimalUtil));
            return this.optimalRate.add(slope.mul(extraUtil));
        }
        else {
            const slope = this.optimalRate.div(this.optimalUtil);
            return slope.mul(utilization);
        }
    }
    getDepositRate(mangoGroup) {
        const borrowRate = this.getBorrowRate(mangoGroup);
        const totalBorrows = this.getUiTotalBorrow(mangoGroup);
        const totalDeposits = this.getUiTotalDeposit(mangoGroup);
        if (totalDeposits.eq(fixednum_1.ZERO_I80F48) && totalBorrows.eq(fixednum_1.ZERO_I80F48)) {
            return fixednum_1.ZERO_I80F48;
        }
        else if (totalDeposits.eq(fixednum_1.ZERO_I80F48)) {
            return this.maxRate;
        }
        const utilization = totalBorrows.div(totalDeposits);
        return utilization.mul(borrowRate);
    }
}
exports.default = RootBank;
//# sourceMappingURL=RootBank.js.map