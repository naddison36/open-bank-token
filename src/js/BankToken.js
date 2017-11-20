"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const VError = require("verror");
const logger = require("config-logger");
const token_1 = require("./token");
class BankToken extends token_1.default {
    constructor(transactionsProvider, eventsProvider, keyStore, jsonInterface, contractBinary, contractAddress, defaultGasPrice = 1000000000, defaultGasLimit = 120000) {
        super(transactionsProvider, eventsProvider, keyStore, jsonInterface, contractBinary, contractAddress, defaultGasPrice, defaultGasLimit);
        this.transactionsProvider = transactionsProvider;
        this.eventsProvider = eventsProvider;
        this.keyStore = keyStore;
        this.defaultGasPrice = defaultGasPrice;
        this.defaultGasLimit = defaultGasLimit;
    }
    // deploy a new web3Contract
    deployContract(contractOwner, gasLimit = 1900000, gasPrice = 4000000000, symbol = "DAD", tokenName = "Digital Australian Dollar") {
        return super.deployContract(contractOwner, gasLimit, gasPrice, symbol, tokenName);
    }
    // deposit an amount of tokens to an address
    deposit(toAddress, amount, externalId, bankTransactionId, gasLimit = this.defaultGasLimit, gasPrice = this.defaultGasPrice) {
        const self = this;
        const description = `deposit ${amount} tokens to address ${toAddress}, from sender address ${self.contractOwner}, contract ${this.contract.address}, external id ${externalId}, bank transaction id ${bankTransactionId}, gas limit ${gasLimit} (0x${gasLimit.toString(16)}) and gas price ${gasPrice} (0x${gasPrice.toString(16)})`;
        return new Promise(async (resolve, reject) => {
            try {
                // send the transaction
                const broadcastTransaction = await self.contract.deposit(toAddress, amount, externalId, bankTransactionId, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });
                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);
                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);
                resolve(transactionReceipt);
            }
            catch (err) {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }
    // a token holder requests the token issuer to send a bank payment for their redeemed tokens
    requestWithdrawal(tokenHolderAddress, amount, gasLimit = this.defaultGasLimit, gasPrice = this.defaultGasPrice) {
        const self = this;
        const description = `request withdraw of ${amount} tokens from contract ${this.contract.address} and token holder ${tokenHolderAddress}`;
        return new Promise(async (resolve, reject) => {
            try {
                const privateKey = await self.keyStore.getPrivateKey(tokenHolderAddress);
                const wallet = new ethers_1.Wallet(privateKey, self.transactionsProvider);
                const contract = new ethers_1.Contract(self.contract.address, self.jsonInterface, wallet);
                // send the transaction
                const broadcastTransaction = await contract.requestWithdrawal(amount, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });
                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);
                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);
                resolve(transactionReceipt);
            }
            catch (err) {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }
    confirmWithdrawal(withdrawalNumber, gasLimit = this.defaultGasLimit, gasPrice = this.defaultGasPrice) {
        const self = this;
        const description = `confirm withdrawal number ${withdrawalNumber} against contract ${this.contract.address} using contract owner ${self.contractOwner}`;
        return new Promise(async (resolve, reject) => {
            try {
                // send the transaction
                const broadcastTransaction = await self.contract.confirmWithdrawal(withdrawalNumber, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });
                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);
                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);
                resolve(transactionReceipt);
            }
            catch (err) {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }
    rejectWithdrawal(withdrawalNumber, gasLimit = this.defaultGasLimit, gasPrice = this.defaultGasPrice) {
        const self = this;
        const description = `reject withdrawal number ${withdrawalNumber} against contract ${this.contract.address} using contract owner ${self.contractOwner}`;
        return new Promise(async (resolve, reject) => {
            try {
                // send the transaction
                const broadcastTransaction = await self.contract.rejectWithdrawal(withdrawalNumber, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });
                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);
                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);
                resolve(transactionReceipt);
            }
            catch (err) {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }
    async hasConfirmedWithdrawal(withdrawalNumber) {
        const description = `has withdrawal number ${withdrawalNumber.toString()} already been confirmed in contract address ${this.contract.address}`;
        try {
            const result = await this.contract.hasConfirmedWithdrawal(withdrawalNumber);
            logger.info(`Got ${result[0]} result for ${description}`);
            return result[0];
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
    async getWithdrawalCounter() {
        const description = `get withdrawal counter at address ${this.contract.address}`;
        try {
            const result = await this.contract.getWithdrawalCounter();
            logger.info(`Got ${result[0]} result for ${description}`);
            return result[0];
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
    async isTokenHolder(address) {
        const description = `is address ${address} a token holder in contract at address ${this.contract.address}`;
        try {
            const result = await this.contract.isTokenHolder(address);
            logger.info(`Got ${result[0]} result for ${description}`);
            return result[0];
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
    async hasBankTransactionId(bankTransactionId) {
        const description = `has bank transaction id ${bankTransactionId} been used in contract at address ${this.contract.address}`;
        try {
            const result = await this.contract.hasBankTransactionId(bankTransactionId);
            logger.info(`Got ${result[0]} result for ${description}`);
            return result[0];
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