"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const VError = require("verror");
const BaseContract_1 = require("./BaseContract");
class Token extends BaseContract_1.default {
    constructor(transactionsProvider, eventsProvider, Signer, jsonInterface, contractBinary, contractAddress, defaultSendOptions = {
        gasPrice: 1000000000,
        gasLimit: 120000
    }) {
        super(transactionsProvider, eventsProvider, Signer, jsonInterface, contractBinary, contractAddress, defaultSendOptions);
        this.transactions = {};
        if (contractAddress) {
            this.contract = new ethers_1.Contract(contractAddress, jsonInterface, this.transactionsProvider);
        }
    }
    // deploy a new contract
    deployContract(contractOwner, overrideSendOptions, symbol, tokenName) {
        return super.deployContract(contractOwner, overrideSendOptions, symbol, tokenName);
    }
    // transfer an amount of tokens from the signer to another address
    transfer(signer, toAddress, amount, sendOptions) {
        return super.send("transfer", signer, sendOptions, toAddress, amount);
    }
    async getSymbol() {
        return await super.call("symbol");
    }
    async getName() {
        return await super.call("name");
    }
    async getDecimals() {
        return await super.call("decimals");
    }
    async getTotalSupply() {
        return await super.call("totalSupply");
    }
    async getBalanceOf(address) {
        return await super.call("balanceOf", ...arguments);
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