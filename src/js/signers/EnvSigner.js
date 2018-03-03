"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractPrivateKeySigner_1 = require("./AbstractPrivateKeySigner");
class EnvSigner extends AbstractPrivateKeySigner_1.default {
    getPrivateKey(address) {
        return new Promise((resolve, reject) => {
            const privateKey = process.env[address];
            if (privateKey) {
                resolve(privateKey);
            }
            else {
                const error = new Error(`could not find environment variable called ${address} that has the private key`);
                reject(error);
            }
        });
    }
}
exports.default = EnvSigner;
//# sourceMappingURL=EnvSigner.js.map