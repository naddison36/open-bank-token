import {provider as Provider,
    Wallet, Contract} from 'ethers';
import * as BN from 'bn.js';

import Token from './Token';
import {SendOptions} from './BaseContract';

import {KeyStore} from './keyStore/index.d';
import {TransactionReceipt} from './index';

export default class BankToken extends Token
{
    constructor(readonly transactionsProvider: Provider, readonly eventsProvider: Provider,
                readonly keyStore: KeyStore,
                jsonInterface: object[], contractBinary?: string, contractAddress?: string,
                readonly defaultSendOptions: SendOptions = {
                    gasPrice: 1000000000,
                    gasLimit: 120000})
    {
        super(transactionsProvider, eventsProvider, keyStore, jsonInterface,
            contractBinary, contractAddress, defaultSendOptions);
    }

    // deploy a new web3Contract
    deployContract(contractOwner: string, gasLimit = 1900000, gasPrice = 4000000000, symbol = "DAD", tokenName = "Digital Australian Dollar"): Promise<TransactionReceipt>
    {
        return super.deployContract(contractOwner, gasLimit, gasPrice, symbol, tokenName);
    }

    // deposit an amount of tokens to an address
    deposit(toAddress: string, amount: number, externalId: string, bankTransactionId: string, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("deposit", sendOptions, toAddress, amount, externalId, bankTransactionId);
    }

    // a token holder requests the token issuer to send a bank payment for their redeemed tokens
    requestWithdrawal(amount: number, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("requestWithdrawal", sendOptions, amount);
    }

    confirmWithdrawal(withdrawalNumber: number, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("confirmWithdrawal", sendOptions, withdrawalNumber);
    }

    rejectWithdrawal(withdrawalNumber: number, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("rejectWithdrawal", sendOptions, withdrawalNumber);
    }

    hasConfirmedWithdrawal(withdrawalNumber: BN): Promise<boolean>
    {
        return super.call("hasConfirmedWithdrawal", withdrawalNumber);
    }

    getWithdrawalCounter(): Promise<BN>
    {
        return super.call("getWithdrawalCounter");
    }

    isTokenHolder(address: string): Promise<boolean>
    {
        return super.call("isTokenHolder", address);
    }

    hasBankTransactionId(bankTransactionId: string): Promise<boolean>
    {
        return super.call("hasBankTransactionId", bankTransactionId);
    }
}
