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
const utils_1 = require("../../test/utils");
const web3_js_1 = require("@solana/web3.js");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const spl_token_1 = require("@solana/spl-token");
const FIXED_IDS = [
    {
        symbol: 'USDC',
        mint: '8FRFC6MoGGkMFQwngccyu69VnYbzykGeez7ignHVAFSN',
        dexPk: null,
    },
    {
        symbol: 'MNGO',
        mint: 'Bb9bsTQa1bGEtQ5KagGkvSHyuLqDWumFUcRqFusFNJWC',
        dexPk: 'Aph31hoXRjhk1QgCmRvs7WAWGdpRoaESMoqzjoFkL5mE',
    },
    {
        symbol: 'SOL',
        mint: 'So11111111111111111111111111111111111111112',
        dexPk: 'uaajXobeb1hmTB6StRoa8Yqn6czjtWtFeVfZeJY6YFC',
    },
    {
        symbol: 'SRM',
        mint: 'AvtB6w9xboLwA145E221vhof5TddhqsChYcx7Fy3xVMH',
        dexPk: '23tRuJ3zUvXYQEnTDAcWHPDfmYvrWanpM2sJnmhL53X5',
    },
    {
        symbol: 'BTC',
        mint: '3UNBZ6o52WTWwjac2kPUb4FyodhU1vFkRJheu1Sh2TvU',
        dexPk: '9LBavtqDpEoX623j8z4sotHMDbv7PcTXUW3LQQtepKvR',
    },
    {
        symbol: 'ETH',
        mint: 'Cu84KB3tDL6SbFgToHMLYVDJJXdJjenNzSKikeAvzmkA',
        dexPk: '2n81EqJgsTE5PoPX5H8adQ4EaVe5kXnFuxwdCAYfaExH',
    },
    {
        symbol: 'RAY',
        mint: '3YFQ7UYJ7sNGpXTKBxM3bYLVxKpzVudXAe4gLExh5b3n',
        dexPk: '3e7V65UdApsyCMLuALCoQwD9pKDCkozSUrsJx4XMJAnD',
    },
    {
        symbol: 'UNI',
        mint: '7vd84gXdjxRWjtwwkcxpzv1R8W9oCsADemNvRj3Cv5u2',
        dexPk: '4e9bt9ySh9i6Fks2R3KsWTBgJcEDNX6zM4RXHCcWDF3N',
    },
    {
        symbol: 'AAVE',
        mint: '3h7gNYC8aDJ5tGgDt6YKmvLJYT5LNcFb9yiVU1qirDWg',
        dexPk: 'BMigUjf6kDNtNDMCsBvPCwegbL45oLT7rtu1y36vAD1L',
    },
    {
        symbol: 'SUSHI',
        mint: 'Edi5KNs2LnonULNmoTQqSymJ7VuMC9amTjLN5RJ1YMcq',
        dexPk: 'J9aow2hcq6YMJGw7fAprGitP68crYa36r7yJYe5huFv4',
    },
    {
        symbol: 'STEP',
        mint: '62haNTBB4C3gESJyzAvQVAadNxN9zzVt39x5ep5wmaak',
        dexPk: '8P4kZg2c8pAUC6yLv289fR83LJ2wze1ZT247Fw6MhEiC',
    },
    {
        symbol: 'COPE',
        mint: 'BxZBNjYtMgzSF57aiCwrBdLuEL5tSNcGrxQXj7Z7mZQW',
        dexPk: 'Dzc5eZEGHoYEmrYDGWspWcHQw6FG67N6t8NiLhgsLRbi',
    },
    {
        symbol: 'DOGE',
        mint: '6yr1xJP6Nfu8Bxp4L8WJQrtLqBGZrQm5n41PFm4ZmEyk',
        dexPk: 'CrMr521AhZE1FQ9dtBQZczd6SKMpthJMTeQ8WGGRooQ3',
    },
    {
        symbol: 'FIDA',
        mint: 'DRuM89e9xndaRJvjc41zcVWzEAjaytDWUHASydfEEHic',
        dexPk: 'D3P93bKtRzzrJXtBwLcNrswJ3cei1qcrXM9jK6emWZJx',
    },
    {
        symbol: 'FTT',
        mint: 'Fxh4bpZnRCnpg2vcH11ttmSTDSEeC5qWbPRZNZWnRnqY',
        dexPk: 'CiN2BzCaThxLRDALeMq3GJGR24MQhdBWmHHjitW74oST',
    },
    {
        symbol: 'MEDIA',
        mint: 'CU4LrEQChVcis3fsMRciKTgNZSV5A3bh3ftF3Gqnbe78',
        dexPk: 't6Q9ADDNsaQspD4u111fkq8qBzgy1MWoyzX8mDKVbws',
    },
    {
        symbol: 'MER',
        mint: '3QAVaXixBUtHwjponbZZgNVSRqB8YiTqY59pGSWDVS7X',
        dexPk: 'D9Rc98dPsmkfi9wv9yQLKXXu86MZut5jWZSYVCRu51ay',
    },
    {
        symbol: 'USDT',
        mint: 'DAwBSXe6w9g37wdE2tCrFbho3QHKZi4PjuBytQCULap2',
        dexPk: '4WLnnEzwG6QT6xJ9rke1sYmKR1ttEX9GMKqHZfdhkUwL',
    },
    {
        symbol: 'AAX',
        mint: 'HDY1CtDh4S5txV84yWfqrM6MuJ1rjCGa6RgV2aNkoq7T',
        dexPk: '9wursY6Ekmephdczc6dmCmhQ9e7Lh7Xbz16fTP4h6KJt',
    },
    {
        symbol: 'BBX',
        mint: '8S894Tytj7RY6gKcvHWvaR8cmrrbwwRQ3w5ufWKvGgBE',
        dexPk: 'FWEHRHn4TLZTvqZSsN8gmpAHzVuDsNcADVieH7gsqy8D',
    },
    {
        symbol: 'CCX',
        mint: 'C2a5sZB6ybhNVWmf3uwLhyszfD2NcndLcAaYTriASvWH',
        dexPk: 'HXxay4VBTXkgkpyresugRdfnnG7j6SzvbmiZvFHjcDhe',
    },
    {
        symbol: 'DDX',
        mint: 'HqWwWZ6dxWWcMXdeYXAxnWYKB37fqEj2wxLwmuQsHwmP',
        dexPk: 'HfPxSpeBJ7tyFVDh2YNMcadX1LUGqcynXiz2cDMqzHCr',
    },
    {
        symbol: 'EEX',
        mint: 'jYmra5J9RCyEnb1D1ScSSLoXLW8j8GZxSFv8kToUUHB',
        dexPk: '6JXADoVE1nWjd2UkpJqU4PLZAj1urqvuZqnrw9dLKonq',
    },
    {
        symbol: 'FFX',
        mint: 'EsUAWWkLG2sE1RkBo74Ta4a7sjaj5JvM1y4Aj1tYXpx6',
        dexPk: 'AU4zXmTdwUgzLW5yWB8qtuPaVqnvLoUXKot6KVdbidPa',
    },
    {
        symbol: 'GGX',
        mint: '6r1A4FQE58pxQubFTN3K8H5J8deNCwBwKReJFjWgV4fg',
        dexPk: 'ETh2Qqrtp53F3BhbXteemWLsjkRiabEnwjoh8TyPLF72',
    },
    {
        symbol: 'HHX',
        mint: 'HNNjUMfUaLmh7yaTqxtz8rdaL2X789jLEqnVUDtqyEgx',
        dexPk: 'BxQAZsUievWE6JyNVJcFsTLqLqahQF7LhM75qXf26Nr7',
    },
    {
        symbol: 'IIX',
        mint: 'BB4jPsmsZURcNkj7qANJcxADHH18aPEKK4J4kiubEWmx',
        dexPk: 'EDJqNqTcojU65uLCMZHb1HjxPuWAAhMahsfGju2SBqsn',
    },
    {
        symbol: 'JJX',
        mint: 'QCKeuUFC3kRhfpLR7HpyCUr5VEjJguuRhngioeaux8L',
        dexPk: 'ugv31rcerPotv8iMXrWDyEjf5TokZWegzDoSK1xL8s9',
    },
    {
        symbol: 'KKX',
        mint: '5txPKV2L86yfqtR9WqmXLtaE2ZdoUuzpUNBmvsAExbu8',
        dexPk: 'C8GiLqrKW3KNfB6y72jSF7WPYCHWkpgbkX48vsPpzxsU',
    },
    {
        symbol: 'LLX',
        mint: 'FqEQxh7VLjPAYd5Y8ea2uwC6ut2tJ4fsim5Mwwb1DPh2',
        dexPk: '4KoZwJizkVaZhAY2Ud9tt3yqUxZrJnEgPTe8dDtM399G',
    },
    {
        symbol: 'MMX',
        mint: 'ENWHT6aaCguz7FDw8v9FBfFAqS4saS4cR2gWje1vHrT9',
        dexPk: '937mGkTYcqGcHoD2UReiC2FJD4DU42rkJciQZ7tQz5H4',
    },
    {
        symbol: 'NNX',
        mint: 'GunmC8Wr9s4AN6errMFQZicdpNUMVUEvAKyTYektXxGe',
        dexPk: '4my2SByxetXARLxpkDG5iV88AVqqsJzUy88CzyjvKvp8',
    },
    {
        symbol: 'OOX',
        mint: '6PTt8kHBncHTELnhJoKXAoU6e6fyETBNi7ojvggtJDK2',
        dexPk: 'GhPwZExZ7uT72n5SdWNMxwddxQ8eG7tuEvX2iSUK4MEY',
    },
];
const connection = utils_1.createDevnetConnection();
const authorityFp = process.env.AUTHORITY || os_1.default.homedir() + '/.config/solana/id.json';
const authority = new web3_js_1.Account(JSON.parse(fs_1.default.readFileSync(authorityFp, 'utf-8')));
const wallet = process.env.WALLET
    ? new web3_js_1.PublicKey(process.env.WALLET)
    : authority.publicKey;
// TODO - move this into CLI and make it proper
function mintDevnetTokens() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('minting for wallet:', wallet.toBase58(), 'mint authority:', authority.publicKey.toBase58());
        for (let i = 0; i < FIXED_IDS.length; i++) {
            const token = new spl_token_1.Token(connection, new web3_js_1.PublicKey(FIXED_IDS[i].mint), spl_token_1.TOKEN_PROGRAM_ID, authority);
            if (FIXED_IDS[i].symbol === 'SOL') {
                console.log('not minting tokens for SOL');
                continue;
            }
            const tokenAccount = yield token.getOrCreateAssociatedAccountInfo(wallet);
            yield token.mintTo(tokenAccount.address, authority, [], 1000000000000000);
            console.log('minted', FIXED_IDS[i].symbol);
        }
    });
}
mintDevnetTokens();
//# sourceMappingURL=mintDevnet.js.map