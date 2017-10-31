import {provider as Provider} from 'ethers';
import * as VError from 'verror';
import * as logger from 'config-logger';
import {Wallet, Contract} from 'ethers';

import Token from './token';

import {KeyStore} from './keyStore/index.d';
import {TransactionReceipt} from './index';

export default class BankToken extends Token
{
    constructor(readonly transactionsProvider: Provider, readonly eventsProvider: Provider,
                contractOwner: string, readonly keyStore: KeyStore,
                jsonInterface?: {}, contractBinary?: string, contractAddress?: string)
    {
        super(transactionsProvider, eventsProvider, contractOwner, keyStore, jsonInterface, contractBinary, contractAddress);
    }

    // deploy a new web3Contract
    deployContract(contractOwner: string, symbol = "DAD", tokenName = "Digital Australian Dollar", gas = 1900000, gasPrice = 4000000000): Promise<TransactionReceipt>
    {
        return super.deployContract(contractOwner, symbol, tokenName, gas, gasPrice);
    }

    // deposit an amount of tokens to an address
    deposit(toAddress: string, amount: number, externalId: string, bankTransactionId: string, _gas?: number, _gasPrice?: number): Promise<TransactionReceipt>
    {
        const self = this;

        const gas = _gas || self.defaultGas;
        const gasPrice = _gasPrice || self.defaultGasPrice;

        const description = `deposit ${amount} tokens to address ${toAddress}, from sender address ${self.contractOwner}, contract ${this.contract.address}, external id ${externalId}, bank transaction id ${bankTransactionId}, gas limit ${gas} (0x${gas.toString(16)}) and gas price ${gasPrice} (0x${gasPrice.toString(16)})`;

        return new Promise<TransactionReceipt>(async(resolve, reject) =>
        {
            try
            {
                // send the transaction
                const broadcastTransaction = await self.contract.deposit(toAddress, amount, externalId, bankTransactionId, {
                    gasPrice: gasPrice,
                    gasLimit: gas
                });

                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);

                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gas);

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
    requestWithdrawal(tokenHolderAddress: string, amount: number, _gas?: number, _gasPrice?: number): Promise<TransactionReceipt>
    {
        const self = this;

        const gas = _gas || self.defaultGas;
        const gasPrice = _gasPrice || self.defaultGasPrice;

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
                    gasLimit: gas
                });

                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);

                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gas);

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

    confirmWithdraw(withdrawalNumber: number, _gas?: number, _gasPrice?: number): Promise<TransactionReceipt>
    {
        const self = this;

        const gas = _gas || self.defaultGas;
        const gasPrice = _gasPrice || self.defaultGasPrice;

        const description = `confirm withdrawal number ${withdrawalNumber} against contract ${this.contract.address} using contract owner ${self.contractOwner}`;

        return new Promise<TransactionReceipt>(async(resolve, reject) =>
        {
            try
            {
                // send the transaction
                const broadcastTransaction = await self.contract.confirmWithdraw(withdrawalNumber, {
                    gasPrice: gasPrice,
                    gasLimit: gas
                });

                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);

                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gas);

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
