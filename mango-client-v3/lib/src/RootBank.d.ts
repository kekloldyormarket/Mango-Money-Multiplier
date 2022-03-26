import { Connection, PublicKey } from '@solana/web3.js';
import { I80F48 } from './utils/fixednum';
import { NodeBank } from './layout';
import BN from 'bn.js';
import MangoGroup from './MangoGroup';
export default class RootBank {
    publicKey: PublicKey;
    optimalUtil: I80F48;
    optimalRate: I80F48;
    maxRate: I80F48;
    numNodeBanks: number;
    nodeBanks: PublicKey[];
    depositIndex: I80F48;
    borrowIndex: I80F48;
    lastUpdated: BN;
    nodeBankAccounts: NodeBank[];
    constructor(publicKey: PublicKey, decoded: any);
    loadNodeBanks(connection: Connection): Promise<NodeBank[]>;
    getNativeTotalDeposit(): I80F48;
    getNativeTotalBorrow(): I80F48;
    getUiTotalDeposit(mangoGroup: MangoGroup): I80F48;
    getUiTotalBorrow(mangoGroup: MangoGroup): I80F48;
    getBorrowRate(mangoGroup: MangoGroup): I80F48;
    getDepositRate(mangoGroup: MangoGroup): I80F48;
}
//# sourceMappingURL=RootBank.d.ts.map