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
exports.placeSpotOrder = exports.getMarket = exports.performDeposit = exports.cacheRootBanks = exports.cachePrices = exports.getNodeBank = exports.addSpotMarketsToMangoGroup = exports.addSpotMarketToMangoGroup = exports.createUserTokenAccounts = exports.createUserTokenAccount = exports.mintToTokenAccount = exports.listMarkets = exports.listMarket = exports.createMints = exports.createMint = exports.createTokenAccountInstrs = exports.createTokenAccount = exports.buildAirdropTokensIx = exports.airdropTokens = exports.createTokenAccountWithBalance = exports.createAccount = exports.createOracle = exports.airdropSol = exports.createDevnetConnection = exports._sendTransaction = exports.MAX_RATE = exports.OPTIMAL_RATE = exports.OPTIMAL_UTIL = exports.MSRMMint = exports.FeesVault = exports.USDCMint = exports.DexProgramId = exports.MangoProgramId = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const serum_1 = require("@project-serum/serum");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const layout_1 = require("../src/layout");
const utils_1 = require("../src/utils/utils");
const src_1 = require("../src");
exports.MangoProgramId = new web3_js_1.PublicKey('5fP7Z7a87ZEVsKr2tQPApdtq83GcTW4kz919R6ou5h5E');
exports.DexProgramId = new web3_js_1.PublicKey('DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY');
exports.USDCMint = new web3_js_1.PublicKey('H6hy7Ykzc43EuGivv7VVuUKNpKgUoFAfUY3wdPr4UyRX');
exports.FeesVault = new web3_js_1.PublicKey('54PcMYTAZd8uRaYyb3Cwgctcfc1LchGMaqVrmxgr3yVs');
exports.MSRMMint = src_1.msrmMints['devnet'];
const FAUCET_PROGRAM_ID = new web3_js_1.PublicKey('4bXpkKSV8swHSnwqtzuboGPaPDeEgAn4Vt8GfarV5rZt');
exports.OPTIMAL_UTIL = 0.7;
exports.OPTIMAL_RATE = 0.06;
exports.MAX_RATE = 1.5;
const getPDA = () => {
    return web3_js_1.PublicKey.findProgramAddress([Buffer.from('faucet')], FAUCET_PROGRAM_ID);
};
function _sendTransaction(connection, transaction, signers) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, utils_1.sleep)(1000);
        const signature = yield connection.sendTransaction(transaction, signers);
        try {
            yield connection.confirmTransaction(signature);
        }
        catch (e) {
            console.info('Error while confirming, trying again');
            yield connection.confirmTransaction(signature);
        }
        return signature;
    });
}
exports._sendTransaction = _sendTransaction;
function createDevnetConnection() {
    return new web3_js_1.Connection('https://solana--mainnet--rpc.datahub.figment.io/apikey/995d9d62662252c679a6e673fb31b392i', 'processed');
}
exports.createDevnetConnection = createDevnetConnection;
function airdropSol(connection, account, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const roundedSolAmount = Math.round(amount);
        console.info(`Requesting ${roundedSolAmount} SOL`);
        const generousAccount = [
            115, 98, 128, 18, 66, 112, 147, 244, 46, 244, 118, 106, 91, 202, 56, 83, 58,
            71, 89, 226, 32, 177, 177, 240, 189, 23, 209, 176, 138, 119, 130, 140, 6,
            149, 55, 70, 215, 34, 108, 133, 225, 117, 38, 141, 74, 246, 232, 76, 176,
            10, 207, 221, 68, 179, 115, 158, 106, 133, 35, 30, 4, 177, 124, 5,
        ];
        const backupAcc = new web3_js_1.Account(generousAccount);
        const tx = new web3_js_1.Transaction();
        tx.add(web3_js_1.SystemProgram.transfer({
            fromPubkey: backupAcc.publicKey,
            lamports: roundedSolAmount * 1e9,
            toPubkey: account.publicKey,
        }));
        const signers = [backupAcc];
        const signerPks = signers.map((x) => x.publicKey);
        tx.setSigners(...signerPks);
        yield _sendTransaction(connection, tx, signers);
    });
}
exports.airdropSol = airdropSol;
function createOracle(connection, programId, payer) {
    return __awaiter(this, void 0, void 0, function* () {
        const createOracleIns = yield (0, utils_1.createAccountInstruction)(connection, payer.publicKey, layout_1.StubOracleLayout.span, programId);
        const tx = new web3_js_1.Transaction();
        tx.add(createOracleIns.instruction);
        const signers = [payer, createOracleIns.account];
        const signerPks = signers.map((x) => x.publicKey);
        tx.setSigners(...signerPks);
        yield _sendTransaction(connection, tx, signers);
        return createOracleIns.account.publicKey;
    });
}
exports.createOracle = createOracle;
function createAccount(connection, solBalance = 5) {
    return __awaiter(this, void 0, void 0, function* () {
        const account = new web3_js_1.Account();
        if (solBalance >= 1) {
            yield airdropSol(connection, account, solBalance);
        }
        return account;
    });
}
exports.createAccount = createAccount;
function createTokenAccountWithBalance(connection, owner, tokenMint, tokenDecimals, faucetId, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const multiplier = Math.pow(10, tokenDecimals);
        const processedAmount = amount * multiplier;
        let ownedTokenAccountPk = null;
        ownedTokenAccountPk = yield createTokenAccount(connection, tokenMint, owner);
        if (amount > 0) {
            yield airdropTokens(connection, owner, faucetId, ownedTokenAccountPk, tokenMint, new spl_token_1.u64(processedAmount));
        }
        return ownedTokenAccountPk;
    });
}
exports.createTokenAccountWithBalance = createTokenAccountWithBalance;
function airdropTokens(connection, feePayerAccount, faucetPubkey, tokenDestinationPublicKey, mint, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const ix = yield buildAirdropTokensIx(amount, mint, tokenDestinationPublicKey, faucetPubkey);
        const tx = new web3_js_1.Transaction();
        tx.add(ix);
        const signers = [feePayerAccount];
        yield _sendTransaction(connection, tx, signers);
        return tokenDestinationPublicKey.toBase58();
    });
}
exports.airdropTokens = airdropTokens;
function buildAirdropTokensIx(amount, tokenMintPublicKey, destinationAccountPubkey, faucetPubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        const pubkeyNonce = yield getPDA();
        const keys = [
            { pubkey: pubkeyNonce[0], isSigner: false, isWritable: false },
            { pubkey: tokenMintPublicKey, isSigner: false, isWritable: true },
            { pubkey: destinationAccountPubkey, isSigner: false, isWritable: true },
            {
                pubkey: serum_1.TokenInstructions.TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
            },
            { pubkey: faucetPubkey, isSigner: false, isWritable: false },
        ];
        return new web3_js_1.TransactionInstruction({
            programId: FAUCET_PROGRAM_ID,
            data: Buffer.from([1, ...amount.toArray('le', 8)]),
            keys,
        });
    });
}
exports.buildAirdropTokensIx = buildAirdropTokensIx;
function createTokenAccount(connection, mint, owner) {
    return __awaiter(this, void 0, void 0, function* () {
        const newAccount = new web3_js_1.Account();
        const tx = new web3_js_1.Transaction();
        const signers = [owner, newAccount];
        const signerPks = signers.map((x) => x.publicKey);
        tx.add(...(yield createTokenAccountInstrs(connection, newAccount.publicKey, mint, owner.publicKey)));
        tx.setSigners(...signerPks);
        yield _sendTransaction(connection, tx, signers);
        return newAccount.publicKey;
    });
}
exports.createTokenAccount = createTokenAccount;
function createTokenAccountInstrs(connection, newAccountPubkey, mint, ownerPk, lamports) {
    return __awaiter(this, void 0, void 0, function* () {
        if (lamports === undefined)
            lamports = yield connection.getMinimumBalanceForRentExemption(165);
        return [
            web3_js_1.SystemProgram.createAccount({
                fromPubkey: ownerPk,
                newAccountPubkey,
                space: 165,
                lamports,
                programId: serum_1.TokenInstructions.TOKEN_PROGRAM_ID,
            }),
            serum_1.TokenInstructions.initializeAccount({
                account: newAccountPubkey,
                mint,
                owner: ownerPk,
            }),
        ];
    });
}
exports.createTokenAccountInstrs = createTokenAccountInstrs;
function createMint(connection, payer, decimals) {
    return __awaiter(this, void 0, void 0, function* () {
        // const mintAuthority = Keypair.generate().publicKey; If needed can use a diff mint auth
        return yield spl_token_1.Token.createMint(connection, payer, payer.publicKey, null, decimals, spl_token_1.TOKEN_PROGRAM_ID);
    });
}
exports.createMint = createMint;
function createMints(connection, payer, quantity) {
    return __awaiter(this, void 0, void 0, function* () {
        const mints = [];
        for (let i = 0; i < quantity; i++) {
            const decimals = 6;
            mints.push(yield createMint(connection, payer, decimals));
        }
        return mints;
    });
}
exports.createMints = createMints;
function listMarket(connection, payer, baseMint, quoteMint, baseLotSize, quoteLotSize, dexProgramId) {
    return __awaiter(this, void 0, void 0, function* () {
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
                const nonce = utils_1.ZERO_BN;
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
        yield _sendTransaction(connection, tx1, [payer, baseVault, quoteVault]);
        yield _sendTransaction(connection, tx2, [
            payer,
            market,
            requestQueue,
            eventQueue,
            bids,
            asks,
        ]);
        return market.publicKey;
    });
}
exports.listMarket = listMarket;
function listMarkets(connection, payer, dexProgramId, mints, quoteMintPK) {
    return __awaiter(this, void 0, void 0, function* () {
        const spotMarketPks = [];
        for (let mint of mints) {
            spotMarketPks.push(yield listMarket(connection, payer, mint.publicKey, quoteMintPK, 100, // TODO: Make this dynamic
            10, // TODO: Make this dynamic
            dexProgramId));
        }
        return spotMarketPks;
    });
}
exports.listMarkets = listMarkets;
function mintToTokenAccount(payer, mint, tokenAccountPk, balance) {
    return __awaiter(this, void 0, void 0, function* () {
        const mintInfo = yield mint.getMintInfo();
        yield mint.mintTo(tokenAccountPk, payer, [], balance * Math.pow(10, mintInfo.decimals));
    });
}
exports.mintToTokenAccount = mintToTokenAccount;
function createUserTokenAccount(payer, mint, balance) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenAccountPk = yield mint.createAssociatedTokenAccount(payer.publicKey);
        if (balance > 0) {
            yield mintToTokenAccount(payer, mint, tokenAccountPk, balance);
        }
        return tokenAccountPk;
    });
}
exports.createUserTokenAccount = createUserTokenAccount;
function createUserTokenAccounts(payer, mints, balances) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenAccountPks = [];
        if (!balances)
            balances = new Array(mints.length).fill(0);
        else if (balances.length !== mints.length)
            throw new Error("Balance and mint array lengths don't match");
        for (let i = 0; i < mints.length; i++) {
            const mint = mints[i];
            const balance = balances[i];
            tokenAccountPks.push(yield createUserTokenAccount(payer, mint, balance));
        }
        return tokenAccountPks;
    });
}
exports.createUserTokenAccounts = createUserTokenAccounts;
function addSpotMarketToMangoGroup(client, payer, mangoGroup, mint, spotMarketPk, marketIndex, initialPrice) {
    return __awaiter(this, void 0, void 0, function* () {
        const oraclePk = yield createOracle(client.connection, exports.MangoProgramId, payer);
        yield client.addOracle(mangoGroup, oraclePk, payer);
        yield client.setOracle(mangoGroup, oraclePk, payer, src_1.I80F48.fromNumber(initialPrice));
        const initLeverage = 5;
        const maintLeverage = initLeverage * 2;
        const liquidationFee = 1 / (2 * maintLeverage);
        yield client.addSpotMarket(mangoGroup, oraclePk, spotMarketPk, mint.publicKey, payer, maintLeverage, initLeverage, liquidationFee, exports.OPTIMAL_UTIL, exports.OPTIMAL_RATE, exports.MAX_RATE);
    });
}
exports.addSpotMarketToMangoGroup = addSpotMarketToMangoGroup;
function addSpotMarketsToMangoGroup(client, payer, mangoGroupPk, mints, spotMarketPks) {
    return __awaiter(this, void 0, void 0, function* () {
        let mangoGroup = yield client.getMangoGroup(mangoGroupPk);
        for (let i = 0; i < mints.length - 1; i++) {
            const mint = mints[i];
            const spotMarketPk = spotMarketPks[i];
            yield addSpotMarketToMangoGroup(client, payer, mangoGroup, mint, spotMarketPk, i, 40000);
        }
        return yield client.getMangoGroup(mangoGroupPk);
    });
}
exports.addSpotMarketsToMangoGroup = addSpotMarketsToMangoGroup;
function getNodeBank(client, mangoGroup, bankIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        let rootBanks = yield mangoGroup.loadRootBanks(client.connection);
        const rootBank = rootBanks[bankIndex];
        if (!rootBank)
            throw new Error(`no root bank at index ${bankIndex}`);
        return rootBank.nodeBankAccounts[0];
    });
}
exports.getNodeBank = getNodeBank;
function cachePrices(client, payer, mangoGroup, oracleIndices) {
    return __awaiter(this, void 0, void 0, function* () {
        const pricesToCache = [];
        for (let oracleIndex of oracleIndices) {
            pricesToCache.push(mangoGroup.oracles[oracleIndex]);
        }
        yield client.cachePrices(mangoGroup.publicKey, mangoGroup.mangoCache, pricesToCache, payer);
    });
}
exports.cachePrices = cachePrices;
function cacheRootBanks(client, payer, mangoGroup, rootBankIndices) {
    return __awaiter(this, void 0, void 0, function* () {
        const rootBanksToCache = [];
        for (let rootBankIndex of rootBankIndices) {
            rootBanksToCache.push(mangoGroup.tokens[rootBankIndex].rootBank);
        }
        yield client.cacheRootBanks(mangoGroup.publicKey, mangoGroup.mangoCache, rootBanksToCache, payer);
    });
}
exports.cacheRootBanks = cacheRootBanks;
function performDeposit(client, payer, mangoGroup, mangoAccount, nodeBank, //Todo: Can make explicit NodeBank maybe
tokenAccountPk, tokenIndex, quantity) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.deposit(mangoGroup, mangoAccount, payer, mangoGroup.tokens[tokenIndex].rootBank, nodeBank.publicKey, nodeBank.vault, tokenAccountPk, quantity);
        return yield client.getMangoAccount(mangoAccount.publicKey, mangoGroup.dexProgramId);
    });
}
exports.performDeposit = performDeposit;
function getMarket(client, mangoGroup, marketIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield serum_1.Market.load(client.connection, mangoGroup.spotMarkets[marketIndex].spotMarket, {}, mangoGroup.dexProgramId);
    });
}
exports.getMarket = getMarket;
function placeSpotOrder(client, payer, mangoGroup, mangoAccount, market) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.placeSpotOrder(mangoGroup, mangoAccount, mangoGroup.mangoCache, market, payer, 'buy', 10000, 1, 'limit');
        return yield client.getMangoAccount(mangoAccount.publicKey, mangoGroup.dexProgramId);
    });
}
exports.placeSpotOrder = placeSpotOrder;
//# sourceMappingURL=utils.js.map