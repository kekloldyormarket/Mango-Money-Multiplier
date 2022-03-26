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
const web3_js_1 = require("@solana/web3.js");
const client_1 = require("../client");
const config_1 = require("../config");
const config = config_1.Config.ids();
const cluster = (process.env.CLUSTER || 'mainnet');
const connection = new web3_js_1.Connection(config.cluster_urls[cluster], 'processed');
const groupName = process.env.GROUP || 'mainnet.1';
const groupIds = config.getGroup(cluster, groupName);
if (!groupIds) {
    throw new Error(`Group ${groupName} not found`);
}
const mangoProgramId = groupIds.mangoProgramId;
const mangoGroupKey = groupIds.publicKey;
const client = new client_1.MangoClient(connection, mangoProgramId);
// const payer = new Account(
//   JSON.parse(
//     process.env.KEYPAIR ||
//       fs.readFileSync(os.homedir() + '/.config/solana/id.json', 'utf-8'),
//   ),
// );
function check() {
    return __awaiter(this, void 0, void 0, function* () {
        const group = yield client.getMangoGroup(mangoGroupKey);
        const mangoAccounts = yield client.getAllMangoAccounts(group, undefined, true);
        let total = 0;
        for (const mangoAccount of mangoAccounts) {
            const oos = mangoAccount.spotOpenOrdersAccounts;
            const shouldFix = oos.some((oo, i) => {
                if (oo) {
                    const freeSlotBitsStr = oo['freeSlotBits'].toString();
                    const isEmpty = oo.quoteTokenTotal.isZero() &&
                        oo.baseTokenTotal.isZero() &&
                        oo['referrerRebatesAccrued'].isZero() &&
                        freeSlotBitsStr == '340282366920938463463374607431768211455';
                    const inBasketAndEmpty = mangoAccount.inMarginBasket[i] && isEmpty;
                    const notInBasketAndNotEmpty = !mangoAccount.inMarginBasket[i] && !isEmpty;
                    if (inBasketAndEmpty || notInBasketAndNotEmpty) {
                        console.log(mangoAccount.publicKey.toString(), mangoAccount.name, inBasketAndEmpty, notInBasketAndNotEmpty, oo.quoteTokenTotal.toString(), oo.baseTokenTotal.toString(), oo['referrerRebatesAccrued'].toString(), freeSlotBitsStr);
                    }
                    return inBasketAndEmpty || notInBasketAndNotEmpty;
                }
            });
            if (shouldFix) {
                // await client.updateMarginBasket(group, mangoAccount, payer);
                total++;
            }
        }
        console.log('Total', total);
    });
}
check();
//# sourceMappingURL=checkMarginBaskets.js.map