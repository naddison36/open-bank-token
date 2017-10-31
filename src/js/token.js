"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const BN = require("bn.js");
const logger = require("config-logger");
const VError = require("verror");
const utils_1 = require("./utils");
class Token {
    constructor(transactionsProvider, eventsProvider, contractOwner, keyStore, jsonInterface, contractBinary, contractAddress) {
        this.transactionsProvider = transactionsProvider;
        this.eventsProvider = eventsProvider;
        this.keyStore = keyStore;
        this.jsonInterface = jsonInterface;
        this.defaultGas = 120000;
        this.defaultGasPrice = 2000000000;
        this.transactions = {};
        this.contractOwner = contractOwner;
        this.contractBinary = contractBinary;
        this.contract = new ethers_1.Contract(contractAddress, jsonInterface, this.transactionsProvider);
    }
    // deploy a new contract
    deployContract(contractOwner, symbol, tokenName, gasLimit = 1900000, gasPrice = 4000000000) {
        const self = this;
        this.contractOwner = contractOwner;
        const description = `deploy token with symbol ${symbol}, name "${tokenName}" from sender address ${self.contractOwner}, gas limit ${gasLimit} and gas price ${gasPrice}`;
        return new Promise(async (resolve, reject) => {
            logger.debug(`About to ${description}`);
            if (!self.contractBinary) {
                const error = new VError(`Binary for smart contract has not been set so can not ${description}.`);
                logger.error(error.stack);
                return reject(error);
            }
            try {
                const deployTransactionData = ethers_1.Contract.getDeployTransaction(self.contractBinary, self.jsonInterface, symbol, tokenName);
                const wallet = new ethers_1.Wallet(await self.keyStore.getPrivateKey(contractOwner), self.transactionsProvider);
                const deployTransaction = Object.assign(deployTransactionData, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });
                // Send the transaction
                const broadcastTransaction = await wallet.sendTransaction(deployTransaction);
                logger.debug(`${broadcastTransaction.hash} is transaction hash for ${description}`);
                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);
                self.contract = new ethers_1.Contract(transactionReceipt.contractAddress, self.jsonInterface, wallet);
                resolve(transactionReceipt);
            }
            catch (err) {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }
    // transfer an amount of tokens from one address to another
    transfer(fromAddress, toAddress, amount, _gasLimit, _gasPrice) {
        const self = this;
        const gasLimit = _gasLimit || self.defaultGas;
        const gasPrice = _gasPrice || self.defaultGasPrice;
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
    async getEvents(eventName, fromBlock = 0) {
        const description = `${eventName} events from block ${fromBlock} and contract address ${this.contract.address}`;
        const options = {
            fromBlock: fromBlock
        };
        try {
            logger.debug(`About to get ${description}`);
            if (!this.contract.interface.events[eventName]) {
                throw new VError(`event name ${eventName} does not exist on the contract interface`);
            }
            const Event = this.contract.interface.events[eventName]();
            const logs = await this.eventsProvider.getLogs({
                fromBlock: fromBlock,
                toBlock: "latest",
                address: this.contract.address,
                topics: Event.topics
            });
            const events = [];
            for (const log of logs) {
                const event = Event.parse(log.topics, log.data);
                // convert any Ethers.js BigNumber types to BN
                const convertedEvent = utils_1.convertEthersBNs(event);
                events.push(convertedEvent);
            }
            logger.debug(`${events.length} events successfully returned from ${description}`);
            return events;
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            console.log(error.stack);
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
    async processTransaction(hash, description, gasLimit) {
        // wait for the transaction to be mined
        const minedTransaction = await this.transactionsProvider.waitForTransaction(hash);
        logger.debug(`${hash} mined in block number ${minedTransaction.blockNumber} for ${description}`);
        const rawTransactionReceipt = await this.transactionsProvider.getTransactionReceipt(hash);
        const transactionReceipt = utils_1.convertEthersBNs(rawTransactionReceipt);
        logger.debug(`Status ${transactionReceipt.status} and ${transactionReceipt.gasUsed} gas of ${gasLimit} used for ${description}`);
        // If a status of 0 was returned then the transaction failed. Status 1 means the transaction worked
        if (transactionReceipt.status.eq(new BN(0))) {
            throw VError(`Failed ${hash} transaction with status code ${transactionReceipt.status} and ${gasLimit} gas used.`);
        }
        return transactionReceipt;
    }
}
exports.default = Token;
//# sourceMappingURL=token.js.map