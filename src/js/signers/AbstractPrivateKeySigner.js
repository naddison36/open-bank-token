"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
class AbstractPrivateKeySigner {
    constructor(address, provider) {
        this.address = address;
        this.provider = provider;
    }
    getAddress() {
        return new Promise((resolve, reject) => {
            resolve(this.address);
        });
    }
    sign(transaction) {
        return new Promise(async (resolve, reject) => {
            if (!this.wallet) {
                const privateKey = await this.getPrivateKey(this.address);
                this.wallet = new ethers_1.Wallet(privateKey);
            }
            const signedTransaction = this.wallet.sign(transaction);
            resolve(signedTransaction);
        });
    }
}
exports.default = AbstractPrivateKeySigner;
//# sourceMappingURL=AbstractPrivateKeySigner.js.map