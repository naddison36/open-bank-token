"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VError = require("verror");
const logger = require("config-logger");
class KeyStore {
    getPrivateKey(fromAddress) {
        return new Promise(async (resolve, reject) => {
            const privateKey = process.env[fromAddress];
            if (privateKey) {
                resolve(privateKey);
            }
            else {
                const error = new VError(`could not find environment variable with address ${fromAddress} that has the private key`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }
}
exports.default = KeyStore;
//# sourceMappingURL=keyStore-env.js.map