"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VError = require("verror");
const logger = require("config-logger");
const token_1 = require("./token");
class BankToken extends token_1.default {
    constructor(url, contractOwner, jsonInterface, contractBinary, contractAddress) {
        super(url, contractOwner, jsonInterface, contractBinary, contractAddress);
        this.url = url;
    }
    // deploy a new contract
    deployContract(contractOwner, symbol = "DAD", tokenName = "Digital Australian Dollar", gas = 1900000, gasPrice = 4000000000) {
        return super.deployContract(contractOwner, symbol, tokenName, gas, gasPrice);
    }
    // deposit an amount of tokens to an address
    deposit(toAddress, amount, externalId, bankTransactionId, _gas, _gasPrice) {
        const self = this;
        const gas = _gas || self.defaultGas;
        const gasPrice = _gasPrice || self.defaultGasPrice;
        const description = `deposit ${amount} tokens to address ${toAddress}, from sender address ${self.contractOwner}, contract ${this.contract._address}, external id ${externalId}, bank transaction id ${bankTransactionId}, gas limit ${gas} and gas price ${gasPrice}`;
        return new Promise(async (resolve, reject) => {
            const signedTx = await self.ethSigner.signTransaction({
                nonce: await self.web3.eth.getTransactionCount(self.contractOwner),
                from: self.contractOwner,
                to: self.contract.options.address,
                gas: gas,
                gasPrice: gasPrice,
                data: self.contract.methods.deposit(toAddress, amount, externalId, bankTransactionId).encodeABI()
            });
            self.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                .on('transactionHash', (hash) => {
                logger.debug(`transaction hash ${hash} returned for ${description}`);
                self.transactions[hash] = 0;
            })
                .on('receipt', (receipt) => {
                if (receipt.status == '0x0') {
                    const error = new VError(`Exception thrown for ${description}`);
                    logger.error(error.stack);
                    return reject(error);
                }
                logger.debug(`${receipt.gasUsed} gas used of a ${gas} gas limit for ${description}`);
                resolve(receipt.transactionHash);
            })
                .on('confirmation', (confirmationNumber, receipt) => {
                logger.trace(`${confirmationNumber} confirmations for ${description} with transaction hash ${receipt.transactionHash}`);
                self.transactions[receipt.transactionHash] = confirmationNumber;
            })
                .on('error', (err) => {
                const error = new VError(err, `Could not ${description}`);
                logger.error(error.stack);
                reject(error);
            });
        });
    }
    // a token holder requests the token issuer to send a bank payment for their redeemed tokens
    requestWithdrawal(tokenHolderAddress, amount, _gas, _gasPrice) {
        const self = this;
        const gas = _gas || self.defaultGas;
        const gasPrice = _gasPrice || self.defaultGasPrice;
        const description = `request withdraw of ${amount} tokens from contract ${this.contract._address} and token holder ${tokenHolderAddress}`;
        return new Promise((resolve, reject) => {
            self.contract.methods.requestWithdrawal(amount).send({
                from: tokenHolderAddress
            })
                .on('transactionHash', (hash) => {
                logger.info(`${description} returned transaction hash ${hash}`);
                self.transactions[hash] = 0;
            })
                .on('receipt', (receipt) => {
                if (receipt.status == '0x0') {
                    const error = new VError(`Exception thrown for ${description}`);
                    logger.error(error.stack);
                    return reject(error);
                }
                logger.debug(`${receipt.gasUsed} gas used of a ${gas} gas limit for ${description}`);
                resolve(receipt.transactionHash);
            })
                .on('confirmation', (confirmationNumber, receipt) => {
                logger.trace(`${confirmationNumber} confirmations for ${description} with transaction hash ${receipt.transactionHash}`);
                self.transactions[receipt.transactionHash] = confirmationNumber;
            })
                .on('error', (err) => {
                const error = new VError(err, `Could not ${description}`);
                logger.error(error.stack);
                reject(error);
            });
        });
    }
    confirmWithdraw(withdrawalNumber, _gas, _gasPrice) {
        const self = this;
        const gas = _gas || self.defaultGas;
        const gasPrice = _gasPrice || self.defaultGasPrice;
        const description = `confirm withdrawal number ${withdrawalNumber} against contract ${this.contract._address} using contract owner ${self.contractOwner}`;
        return new Promise((resolve, reject) => {
            self.contract.methods.confirmWithdraw(withdrawalNumber).send({
                from: self.contractOwner
            })
                .on('transactionHash', (hash) => {
                logger.info(`${description} returned transaction hash ${hash}`);
                self.transactions[hash] = 0;
            })
                .on('receipt', (receipt) => {
                if (receipt.status == '0x0') {
                    const error = new VError(`Exception thrown for ${description}`);
                    logger.error(error.stack);
                    return reject(error);
                }
                logger.debug(`${receipt.gasUsed} gas used of a ${gas} gas limit for ${description}`);
                resolve(receipt.transactionHash);
            })
                .on('confirmation', (confirmationNumber, receipt) => {
                logger.trace(`${confirmationNumber} confirmations for ${description} with transaction hash ${receipt.transactionHash}`);
                self.transactions[receipt.transactionHash] = confirmationNumber;
            })
                .on('error', (err) => {
                const error = new VError(err, `Could not ${description}`);
                logger.error(error.stack);
                reject(error);
            });
        });
    }
    async isTokenHolder(address) {
        const description = `is address ${address} a token holder in contract at address ${this.contract._address}`;
        try {
            const result = await this.contract.methods.isTokenHolder(address).call();
            logger.info(`Got ${result} result for ${description}`);
            return result;
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
    async hasBankTransactionId(bankTransactionId) {
        const description = `has bank transaction id ${bankTransactionId} been used in contract at address ${this.contract._address}`;
        try {
            const result = await this.contract.methods.hasBankTransactionId(bankTransactionId).call();
            logger.info(`Got ${result} result for ${description}`);
            return result;
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
}
exports.default = BankToken;
//# sourceMappingURL=BankToken.js.map