"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const logger = require("config-logger");
const VError = require("verror");
const BaseContract_1 = require("./BaseContract");
class Token extends BaseContract_1.default {
    constructor(transactionsProvider, eventsProvider, keyStore, jsonInterface, contractBinary, contractAddress, defaultSendOptions = {
            gasPrice: 1000000000,
            gasLimit: 120000
        }) {
        super(transactionsProvider, eventsProvider, keyStore, jsonInterface, contractBinary, contractAddress, defaultSendOptions);
        this.transactionsProvider = transactionsProvider;
        this.eventsProvider = eventsProvider;
        this.keyStore = keyStore;
        this.jsonInterface = jsonInterface;
        this.contractBinary = contractBinary;
        this.defaultSendOptions = defaultSendOptions;
        this.transactions = {};
        if (contractAddress) {
            this.contract = new ethers_1.Contract(contractAddress, jsonInterface, this.transactionsProvider);
        }
    }
    // deploy a new contract
    deployContract(contractOwner, gasLimit = 1900000, gasPrice = 2000000000, symbol, tokenName) {
        return super.deployContract(contractOwner, gasLimit, gasPrice, symbol, tokenName);
    }
    // transfer an amount of tokens from one address to another
    transfer(fromAddress, toAddress, amount, gasLimit = this.defaultGasLimit, gasPrice = this.defaultGasPrice) {
        const self = this;
        const description = `transfer ${amount} tokens from address ${fromAddress}, to address ${toAddress}, contract ${this.contract.address}, gas limit ${gasLimit} and gas price ${gasPrice}`;
        return new Promise(async (resolve, reject) => {
            try {
                const privateKey = await self.keyStore.getPrivateKey(fromAddress);
                const wallet = new ethers_1.Wallet(privateKey, self.transactionsProvider);
                const contract = new ethers_1.Contract(self.contract.address, self.jsonInterface, wallet);
                // send the transaction
                const broadcastTransaction = await contract.transfer(toAddress, amount, {
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
    async getSymbol() {
        const description = `symbol of contract at address ${this.contract.address}`;
        try {
            const result = await this.contract.symbol();
            const symbol = result[0];
            logger.info(`Got ${symbol} ${description}`);
            return symbol;
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
    async getName() {
        const description = `name of contract at address ${this.contract.address}`;
        try {
            const result = await this.contract.name();
            const name = result[0];
            logger.info(`Got "${name}" ${description}`);
            return name;
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
    async getDecimals() {
        const description = `number of decimals for contract at address ${this.contract.address}`;
        try {
            const result = await this.contract.decimals();
            const decimals = result[0];
            logger.info(`Got ${decimals} ${description}`);
            return decimals;
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
    async getTotalSupply() {
        const description = `total supply of contract at address ${this.contract.address}`;
        try {
            const result = await this.contract.totalSupply();
            const totalSupply = result[0]._bn;
            logger.info(`Got ${totalSupply.toString()} ${description}`);
            return totalSupply;
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
    async getBalanceOf(address) {
        const description = `balance of address ${address} in contract at address ${this.contract.address}`;
        try {
            const result = await this.contract.balanceOf(address);
            const balance = result[0]._bn;
            logger.info(`Got ${balance} ${description}`);
            return balance;
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
    async getHolderBalances() {
        const description = `all token holder balances from contract address ${this.contract.address}`;
        try {
            const transferEvents = await this.getEvents("Transfer");
            const holderBalances = {};
            transferEvents.forEach(event => {
                const fromAddress = event.fromAddress, toAddress = event.toAddress, amount = Number(event.amount);
                // if deposit
                if (fromAddress == '0x0000000000000000000000000000000000000000') {
                    holderBalances[toAddress] = (holderBalances[toAddress]) ?
                        holderBalances[toAddress] += amount :
                        holderBalances[toAddress] = amount;
                }
                else if (toAddress == '0x0000000000000000000000000000000000000000') {
                    holderBalances[fromAddress] = (holderBalances[fromAddress]) ?
                        holderBalances[fromAddress] -= amount :
                        holderBalances[fromAddress] = -amount;
                }
                else {
                    holderBalances[fromAddress] = (holderBalances[fromAddress]) ?
                        holderBalances[fromAddress] -= amount :
                        holderBalances[fromAddress] = -amount;
                    holderBalances[toAddress] = (holderBalances[toAddress]) ?
                        holderBalances[toAddress] += amount :
                        holderBalances[toAddress] = amount;
                }
            });
            return holderBalances;
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            console.log(error.stack);
            throw error;
        }
    }
}
exports.default = Token;
//# sourceMappingURL=Token.js.map