"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("./Token");
class BankToken extends Token_1.default {
    constructor(transactionsProvider, eventsProvider, keyStore, jsonInterface, contractBinary, contractAddress, defaultSendOptions = {
            gasPrice: 1000000000,
            gasLimit: 120000
        }) {
        super(transactionsProvider, eventsProvider, keyStore, jsonInterface, contractBinary, contractAddress, defaultSendOptions);
        this.transactionsProvider = transactionsProvider;
        this.eventsProvider = eventsProvider;
        this.keyStore = keyStore;
        this.defaultSendOptions = defaultSendOptions;
    }
    // deploy a new web3Contract
    deployContract(contractOwner, gasLimit = 1900000, gasPrice = 4000000000, symbol = "DAD", tokenName = "Digital Australian Dollar") {
        return super.deployContract(contractOwner, gasLimit, gasPrice, symbol, tokenName);
    }
    // deposit an amount of tokens to an address
    deposit(toAddress, amount, externalId, bankTransactionId, sendOptions) {
        return super.send("deposit", sendOptions, toAddress, amount, externalId, bankTransactionId);
    }
    // a token holder requests the token issuer to send a bank payment for their redeemed tokens
    requestWithdrawal(amount, sendOptions) {
        return super.send("requestWithdrawal", sendOptions, amount);
    }
    confirmWithdrawal(withdrawalNumber, sendOptions) {
        return super.send("confirmWithdrawal", sendOptions, withdrawalNumber);
    }
    rejectWithdrawal(withdrawalNumber, sendOptions) {
        return super.send("rejectWithdrawal", sendOptions, withdrawalNumber);
    }
    hasConfirmedWithdrawal(withdrawalNumber) {
        return super.call("hasConfirmedWithdrawal", withdrawalNumber);
    }
    getWithdrawalCounter() {
        return super.call("getWithdrawalCounter");
    }
    isTokenHolder(address) {
        return super.call("isTokenHolder", address);
    }
    hasBankTransactionId(bankTransactionId) {
        return super.call("hasBankTransactionId", bankTransactionId);
    }
}
exports.default = BankToken;
//# sourceMappingURL=BankToken.js.map