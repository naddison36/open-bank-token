"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const VError = require("verror");
const logger = require("config-logger");
const fs_1 = require("fs");
class BaseContract {
    constructor(transactionsProvider, eventsProvider, keyStore, jsonInterface, contractBinary, contractAddress, defaultSendOptions = {
            gasPrice: 1000000000,
            gasLimit: 120000
        }) {
        this.transactionsProvider = transactionsProvider;
        this.eventsProvider = eventsProvider;
        this.keyStore = keyStore;
        this.jsonInterface = jsonInterface;
        this.contractBinary = contractBinary;
        this.defaultSendOptions = defaultSendOptions;
        this.contract = new ethers_1.Contract(contractAddress, jsonInterface, this.transactionsProvider);
    }
    // deploy a new contract
    deployContract(contractOwner, gasLimit, gasPrice, ...contractConstructorParams) {
        const self = this;
        const description = `deploy contract from sender address ${contractOwner} with params ${contractConstructorParams.toString()}, gas limit ${gasLimit} and gas price ${gasPrice}.`;
        return new Promise(async (resolve, reject) => {
            logger.debug(`About to ${description}`);
            if (!self.contractBinary) {
                const error = new VError(`Binary for smart contract has not been set so can not ${description}.`);
                logger.error(error.stack);
                return reject(error);
            }
            try {
                const deployTransactionData = ethers_1.Contract.getDeployTransaction(self.contractBinary, self.jsonInterface, ...contractConstructorParams);
                const privateKey = await self.keyStore.getPrivateKey(contractOwner);
                const wallet = new ethers_1.Wallet(privateKey, self.transactionsProvider);
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
    async call(functionName, ...callParams) {
        const description = `Call function ${functionName} with params ${callParams.toString()} on contract with address ${this.contract.address}`;
        try {
            const result = await this.contract[functionName](...callParams);
            logger.info(`Got ${result[0]} ${description}`);
            return result[0];
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
    async send(functionName, overrideSendOptions, ...callParams) {
        const self = this;
        let sendOptions = this.defaultSendOptions;
        if (overrideSendOptions) {
            sendOptions = {
                gasPrice: overrideSendOptions.gasPrice || this.defaultSendOptions.gasPrice,
                gasLimit: overrideSendOptions.gasLimit || this.defaultSendOptions.gasLimit
            };
        }
        const description = `send transaction to function ${functionName} with parameters ${callParams}, gas limit ${sendOptions.gasLimit} and gas price ${sendOptions.gasPrice} on contract with address ${this.contract.address}`;
        return new Promise(async (resolve, reject) => {
            try {
                let contract = self.contract;
                if (overrideSendOptions && overrideSendOptions.txSignerAddress) {
                    const privateKey = await self.keyStore.getPrivateKey(overrideSendOptions.txSignerAddress);
                    const wallet = new ethers_1.Wallet(privateKey, self.transactionsProvider);
                    contract = new ethers_1.Contract(self.contract.address, self.jsonInterface, wallet);
                }
                // send the transaction
                const broadcastTransaction = await contract[functionName](...callParams, sendOptions);
                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);
                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, sendOptions.gasLimit);
                resolve(transactionReceipt);
            }
            catch (err) {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }
    async processTransaction(hash, description, gasLimit) {
        // wait for the transaction to be mined
        const minedTransaction = await this.transactionsProvider.waitForTransaction(hash);
        logger.debug(`${hash} mined in block number ${minedTransaction.blockNumber} for ${description}`);
        const rawTransactionReceipt = await this.transactionsProvider.getTransactionReceipt(hash);
        const transactionReceipt = BaseContract.convertEthersBNs(rawTransactionReceipt);
        logger.debug(`Status ${transactionReceipt.status} and ${transactionReceipt.gasUsed} gas of ${gasLimit} used for ${description}`);
        // If a status of 0 was returned then the transaction failed. Status 1 means the transaction worked
        if (transactionReceipt.status == 0) {
            throw VError(`Failed ${hash} transaction with status code ${transactionReceipt.status}. ${transactionReceipt.gasUsed} gas used of ${gasLimit} gas limit.`);
        }
        return transactionReceipt;
    }
    static convertEthersBNs(object) {
        const result = {};
        for (let key of Object.keys(object)) {
            const value = object[key];
            if (typeof (value) == 'object' && value != null && value.hasOwnProperty("_bn")) {
                result[key] = value._bn;
            }
            else {
                result[key] = value;
            }
        }
        return result;
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
                const convertedEvent = BaseContract.convertEthersBNs(event);
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
    static loadJsonInterfaceFromFile(filename) {
        const jsonInterfaceStr = fs_1.readFileSync(filename, 'utf8');
        return JSON.parse(jsonInterfaceStr);
    }
    static loadBinaryFromFile(filename) {
        return '0x' + fs_1.readFileSync(filename, 'utf8');
    }
}
exports.default = BaseContract;
//# sourceMappingURL=BaseContract.js.map