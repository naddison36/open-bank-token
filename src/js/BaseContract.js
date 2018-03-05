"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const VError = require("verror");
const logger = require("config-logger");
const fs_1 = require("fs");
class BaseContract {
    constructor(transactionsProvider, eventsProvider, Signer, jsonInterface, contractBinary, contractAddress, defaultSendOptions = {
        gasPrice: 1000000000,
        gasLimit: 1200000
    }) {
        this.transactionsProvider = transactionsProvider;
        this.eventsProvider = eventsProvider;
        this.Signer = Signer;
        this.jsonInterface = jsonInterface;
        this.contractBinary = contractBinary;
        this.defaultSendOptions = defaultSendOptions;
        if (contractAddress) {
            this.contract = new ethers_1.Contract(contractAddress, jsonInterface, transactionsProvider);
        }
    }
    // deploy a new contract
    deployContract(contractOwner, overrideSendOptions, ...contractConstructorParams) {
        // override the default send options
        const sendOptions = Object.assign({}, this.defaultSendOptions, overrideSendOptions);
        const description = `deploy contract with params ${contractConstructorParams.toString()}, from sender address ${contractOwner}, gas limit ${sendOptions.gasLimit} and gas price ${sendOptions.gasPrice}.`;
        return new Promise(async (resolve, reject) => {
            logger.debug(`About to ${description}`);
            if (!this.contractBinary) {
                const error = new VError(`Binary for smart contract has not been set so can not ${description}.`);
                logger.error(error.stack);
                return reject(error);
            }
            try {
                this.contractOwner = contractOwner;
                const deployTransactionData = ethers_1.Contract.getDeployTransaction(this.contractBinary, this.jsonInterface, ...contractConstructorParams);
                const signer = new this.Signer(contractOwner, this.transactionsProvider);
                const deployTransaction = Object.assign(deployTransactionData, sendOptions, {
                    nonce: await this.transactionsProvider.getTransactionCount(contractOwner)
                });
                const signedTransaction = await signer.sign(deployTransaction);
                // Send the signed transaction
                let txHash = await this.transactionsProvider.sendTransaction(signedTransaction);
                // if the signer was a Wallet then the hash is in an object
                if (txHash.hash) {
                    txHash = txHash.hash;
                }
                logger.debug(`${txHash} is transaction hash for ${description}`);
                const transactionReceipt = await this.processTransaction(txHash, description, deployTransaction.gasLimit);
                this.contract = new ethers_1.Contract(transactionReceipt.contractAddress, this.jsonInterface, signer);
                logger.info(`${this.contract.address} created from ${description}`);
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
        const description = `calling function ${functionName} with params ${callParams.toString()} on contract with address ${this.contract.address}`;
        try {
            let result = await this.contract[functionName](...callParams);
            // if an Ethers BigNumber
            if (result._bn) {
                // convert to a bn.js BigNumber
                result = result._bn;
            }
            logger.info(`Got ${result} from ${description}`);
            return result;
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
    async send(functionName, txSignerAddress, overrideSendOptions, ...callParams) {
        // override the default send options
        const sendOptions = Object.assign({}, this.defaultSendOptions, overrideSendOptions);
        const description = `send transaction to function ${functionName} with transaction signer ${txSignerAddress}, parameters ${callParams}, gas limit ${sendOptions.gasLimit} and gas price ${sendOptions.gasPrice} on contract with address ${this.contract.address}`;
        return new Promise(async (resolve, reject) => {
            try {
                let contract = this.contract;
                if (txSignerAddress) {
                    const signer = new this.Signer(txSignerAddress, this.transactionsProvider);
                    contract = new ethers_1.Contract(this.contract.address, this.jsonInterface, signer);
                }
                // send the transaction
                let txHash = await contract[functionName](...callParams, sendOptions);
                // if the signer was a Wallet then the hash is in an object
                if (txHash.hash) {
                    txHash = txHash.hash;
                }
                logger.debug(`${txHash} is transaction hash for ${description}`);
                const transactionReceipt = await this.processTransaction(txHash, description, sendOptions.gasLimit);
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
            const error = new VError(`Failed transaction ${hash} with status code ${transactionReceipt.status}. ${transactionReceipt.gasUsed} gas used of ${gasLimit} gas limit.`);
            error.txReceipt = transactionReceipt;
            logger.error(error.stack);
            throw error;
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
            const Event = this.contract.interface.events[eventName];
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
        const jsonInterfaceStr = fs_1.readFileSync(filename + ".abi", 'utf8');
        return JSON.parse(jsonInterfaceStr);
    }
    static loadBinaryFromFile(filename) {
        return '0x' + fs_1.readFileSync(filename + ".bin", 'utf8');
    }
}
exports.default = BaseContract;
//# sourceMappingURL=BaseContract.js.map