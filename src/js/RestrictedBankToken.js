"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseContract_1 = require("./BaseContract");
const Token_1 = require("./Token");
class RestrictedBankToken extends Token_1.default {
    constructor(transactionsProvider, eventsProvider, Signer, contractAddress, defaultSendOptions = {
        gasPrice: 1000000000,
        gasLimit: 120000
    }) {
        super(transactionsProvider, eventsProvider, Signer, null, null, contractAddress, defaultSendOptions);
        const contractBinariesDir = process.cwd() + "/bin/contracts/";
        this.jsonInterface = BaseContract_1.default.loadJsonInterfaceFromFile(contractBinariesDir + "RestrictedBankToken");
        this.contractBinary = BaseContract_1.default.loadBinaryFromFile(contractBinariesDir + "RestrictedBankToken");
    }
    // deploy a new contract
    deployContract(contractOwner, overrideSendOptions = {
        gasLimit: 1900000,
        gasPrice: 4000000000
    }, symbol = "DAD", tokenName = "Digital Australian Dollar") {
        return super.deployContract(contractOwner, overrideSendOptions, symbol, tokenName);
    }
    // deposit an amount of tokens to an address
    deposit(toAddress, amount, externalId, bankTransactionId, sendOptions) {
        return super.send("deposit", this.contractOwner, sendOptions, toAddress, amount, externalId, bankTransactionId);
    }
    // a token holder requests the token issuer to send a bank payment for their redeemed tokens
    requestWithdrawal(amount, signer, sendOptions) {
        return super.send("requestWithdrawal", signer, sendOptions, amount);
    }
    confirmWithdrawal(withdrawalNumber, sendOptions) {
        return super.send("confirmWithdrawal", this.contractOwner, sendOptions, withdrawalNumber);
    }
    rejectWithdrawal(withdrawalNumber, sendOptions) {
        return super.send("rejectWithdrawal", this.contractOwner, sendOptions, withdrawalNumber);
    }
    hasConfirmedWithdrawal(withdrawalNumber) {
        return super.call("hasConfirmedWithdrawal", ...arguments);
    }
    getWithdrawalCounter() {
        return super.call("getWithdrawalCounter");
    }
    isTokenHolder(address) {
        return super.call("isTokenHolder", ...arguments);
    }
    hasBankTransactionId(bankTransactionId) {
        return super.call("hasBankTransactionId", ...arguments);
    }
}
exports.default = RestrictedBankToken;
//# sourceMappingURL=RestrictedBankToken.js.map