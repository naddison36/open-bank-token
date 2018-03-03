import {provider as Provider,
    Wallet, Contract} from 'ethers';
import * as BN from 'bn.js';

import BaseContract from './BaseContract';
import Token from './Token';
import {SendOptions} from './BaseContract';
import {SignerConstructor} from './signers';
import {TransactionReceipt} from './index';

export default class RestrictedBankToken extends Token
{
    constructor(transactionsProvider: Provider, eventsProvider: Provider,
                Signer: SignerConstructor, contractAddress?: string,
                defaultSendOptions: SendOptions = {
                    gasPrice: 1000000000,
                    gasLimit: 120000})
    {
        super(transactionsProvider, eventsProvider, Signer, null, null, contractAddress, defaultSendOptions);

        const contractBinariesDir = process.cwd() + "/bin/contracts/";
        this.jsonInterface = BaseContract.loadJsonInterfaceFromFile(contractBinariesDir + "RestrictedBankToken");
        this.contractBinary = BaseContract.loadBinaryFromFile(contractBinariesDir + "RestrictedBankToken");
    }

    // deploy a new contract
    deployContract(contractOwner: string, overrideSendOptions: SendOptions = {
        gasLimit: 1900000,
        gasPrice: 4000000000},
        symbol = "DAD", tokenName = "Digital Australian Dollar"): Promise<TransactionReceipt>
    {
        return super.deployContract(contractOwner, overrideSendOptions, symbol, tokenName);
    }

    // deposit an amount of tokens to an address
    deposit(toAddress: string, amount: number, externalId: string, bankTransactionId: string, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("deposit", this.contractOwner, sendOptions, toAddress, amount, externalId, bankTransactionId);
    }

    // a token holder requests the token issuer to send a bank payment for their redeemed tokens
    requestWithdrawal(amount: number, signer: string, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("requestWithdrawal", signer, sendOptions, amount);
    }

    confirmWithdrawal(withdrawalNumber: number, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("confirmWithdrawal", this.contractOwner, sendOptions, withdrawalNumber);
    }

    rejectWithdrawal(withdrawalNumber: number, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("rejectWithdrawal", this.contractOwner, sendOptions, withdrawalNumber);
    }

    hasConfirmedWithdrawal(withdrawalNumber: BN): Promise<boolean>
    {
        return super.call("hasConfirmedWithdrawal", ...arguments);
    }

    getWithdrawalCounter(): Promise<BN>
    {
        return super.call("getWithdrawalCounter");
    }

    isTokenHolder(address: string): Promise<boolean>
    {
        return super.call("isTokenHolder", ...arguments);
    }

    hasBankTransactionId(bankTransactionId: string): Promise<boolean>
    {
        return super.call("hasBankTransactionId", ...arguments);
    }
}
