"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("config-logger");
class EthSigner {
    constructor(web3) {
        this.web3 = web3;
    }
    async signTransaction(tx) {
        const privateKey = await this.getPrivateKey(tx.from);
        const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        logger.debug(`created account ${account.address} for signing from private key ${privateKey}`);
        const signedTx = await account.signTransaction(tx);
        logger.debug(`Signed transaction for ${JSON.stringify(tx)} was:\n${JSON.stringify(signedTx)}`);
        return signedTx;
    }
    getPrivateKey(fromAddress) {
        return new Promise(async (resolve, reject) => {
            resolve('0xfa643e0ded9fd96209545b6cc9230376627012d8fb01cfa8d338b8a3aa4aeaaf');
        });
    }
}
exports.default = EthSigner;
//# sourceMappingURL=ethSigner-hardcoded.js.map