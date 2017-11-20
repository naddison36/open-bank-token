import {provider as Provider,
    Wallet, Contract} from 'ethers';
import * as VError from 'verror';
import * as logger from 'config-logger';
import * as BN from 'bn.js';

import Token from './token';

import {KeyStore} from './keyStore/index.d';
import {TransactionReceipt} from './index';

export default class BankToken extends Token
{
    constructor(readonly transactionsProvider: Provider, readonly eventsProvider: Provider,
                readonly keyStore: KeyStore,
                jsonInterface: object[], contractBinary?: string, contractAddress?: string,
                readonly defaultGasPrice = 1000000000, readonly defaultGasLimit = 120000)
    {
        super(transactionsProvider, eventsProvider, keyStore, jsonInterface,
            contractBinary, contractAddress, defaultGasPrice, defaultGasLimit);
    }

    // deploy a new web3Contract
    deployContract(contractOwner: string, gasLimit = 1900000, gasPrice = 4000000000, symbol = "DAD", tokenName = "Digital Australian Dollar"): Promise<TransactionReceipt>
    {
        return super.deployContract(contractOwner, gasLimit, gasPrice, symbol, tokenName);
    }

    // deposit an amount of tokens to an address
    deposit(toAddress: string, amount: number, externalId: string, bankTransactionId: string,
            gasLimit: number = this.defaultGasLimit,
            gasPrice: number = this.defaultGasPrice): Promise<TransactionReceipt>
    {
        const self = this;

        const description = `deposit ${amount} tokens to address ${toAddress}, from sender address ${self.contractOwner}, contract ${this.contract.address}, external id ${externalId}, bank transaction id ${bankTransactionId}, gas limit ${gasLimit} (0x${gasLimit.toString(16)}) and gas price ${gasPrice} (0x${gasPrice.toString(16)})`;

        return new Promise<TransactionReceipt>(async(resolve, reject) =>
        {
            try
            {
                // send the transaction
                const broadcastTransaction = await self.contract.deposit(toAddress, amount, externalId, bankTransactionId, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });

                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);

                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);

                resolve(transactionReceipt);
            }
            catch (err)
            {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }

    // a token holder requests the token issuer to send a bank payment for their redeemed tokens
    requestWithdrawal(tokenHolderAddress: string, amount: number,
                      gasLimit: number = this.defaultGasLimit,
                      gasPrice: number = this.defaultGasPrice): Promise<TransactionReceipt>
    {
        const self = this;

        const description = `request withdraw of ${amount} tokens from contract ${this.contract.address} and token holder ${tokenHolderAddress}`;

        return new Promise<TransactionReceipt>(async(resolve, reject) =>
        {
            try
            {
                const privateKey = await self.keyStore.getPrivateKey(tokenHolderAddress);
                const wallet = new Wallet(privateKey, self.transactionsProvider);

                const contract = new Contract(self.contract.address, self.jsonInterface, wallet);

                // send the transaction
                const broadcastTransaction = await contract.requestWithdrawal(amount, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });

                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);

                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);

                resolve(transactionReceipt);
            }
            catch (err)
            {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }

    confirmWithdrawal(withdrawalNumber: number,
                    gasLimit: number = this.defaultGasLimit,
                    gasPrice: number = this.defaultGasPrice): Promise<TransactionReceipt>
    {
        const self = this;

        const description = `confirm withdrawal number ${withdrawalNumber} against contract ${this.contract.address} using contract owner ${self.contractOwner}`;

        return new Promise<TransactionReceipt>(async(resolve, reject) =>
        {
            try
            {
                // send the transaction
                const broadcastTransaction = await self.contract.confirmWithdrawal(withdrawalNumber, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });

                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);

                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);

                resolve(transactionReceipt);
            }
            catch (err)
            {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }

    rejectWithdrawal(withdrawalNumber: number,
                    gasLimit: number = this.defaultGasLimit,
                    gasPrice: number = this.defaultGasPrice): Promise<TransactionReceipt>
    {
        const self = this;

        const description = `reject withdrawal number ${withdrawalNumber} against contract ${this.contract.address} using contract owner ${self.contractOwner}`;

        return new Promise<TransactionReceipt>(async(resolve, reject) =>
        {
            try
            {
                // send the transaction
                const broadcastTransaction = await self.contract.rejectWithdrawal(withdrawalNumber, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });

                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);

                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);

                resolve(transactionReceipt);
            }
            catch (err)
            {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }

    async hasConfirmedWithdrawal(withdrawalNumber: BN): Promise<boolean>
    {
        const description = `has withdrawal number ${withdrawalNumber.toString()} already been confirmed in contract address ${this.contract.address}`;

        try
        {
            const result = await this.contract.hasConfirmedWithdrawal(withdrawalNumber);

            logger.info(`Got ${result[0]} result for ${description}`);
            return result[0];
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }

    async getWithdrawalCounter(): Promise<BN>
    {
        const description = `get withdrawal counter at address ${this.contract.address}`;

        try
        {
            const result = await this.contract.getWithdrawalCounter();

            logger.info(`Got ${result[0]} result for ${description}`);
            return result[0];
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }

    async isTokenHolder(address: string): Promise<boolean>
    {
        const description = `is address ${address} a token holder in contract at address ${this.contract.address}`;

        try
        {
            const result = await this.contract.isTokenHolder(address);

            logger.info(`Got ${result[0]} result for ${description}`);
            return result[0];
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }

    async hasBankTransactionId(bankTransactionId: string): Promise<boolean>
    {
        const description = `has bank transaction id ${bankTransactionId} been used in contract at address ${this.contract.address}`;

        try
        {
            const result = await this.contract.hasBankTransactionId(bankTransactionId);

            logger.info(`Got ${result[0]} result for ${description}`);
            return result[0];
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
}
