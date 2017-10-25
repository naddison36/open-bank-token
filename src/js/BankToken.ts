import * as VError from 'verror';
import * as logger from 'config-logger';

import Token from './token';

import * as Web3Types from 'web3/types.d'

export default class BankToken extends Token
{
    constructor(readonly url: string, contractOwner: string,
                jsonInterface?: {}, contractBinary?: string, contractAddress?: string)
    {
        super(url, contractOwner, jsonInterface, contractBinary, contractAddress);
    }

    // deploy a new contract
    deployContract(contractOwner: string, symbol = "DAD", tokenName = "Digital Australian Dollar", gas = 1900000, gasPrice = 4000000000): Promise<string>
    {
        return super.deployContract(contractOwner, symbol, tokenName, gas, gasPrice);
    }

    // deposit an amount of tokens to an address
    deposit(toAddress: string, amount: number, externalId: string, bankTransactionId: string, _gas?: number, _gasPrice?: number): Promise<string>
    {
        const self = this;

        const gas = _gas || self.defaultGas;
        const gasPrice = _gasPrice || self.defaultGasPrice;

        const description = `deposit ${amount} tokens to address ${toAddress}, from sender address ${self.contractOwner}, contract ${this.contract._address}, external id ${externalId}, bank transaction id ${bankTransactionId}, gas limit ${gas} and gas price ${gasPrice}`;

        return new Promise<string>(async(resolve, reject) =>
        {
            const signedTx = await self.ethSigner.signTransaction({
                nonce: await self.web3.eth.getTransactionCount(self.contractOwner),
                from: self.contractOwner,
                to: self.contract.options.address,
                gas: gas,
                gasPrice: gasPrice,
                data: self.contract.methods.deposit(toAddress, amount, externalId, bankTransactionId).encodeABI()
            });

            self.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('transactionHash', (hash: string) =>
            {
                logger.debug(`transaction hash ${hash} returned for ${description}`);
                self.transactions[hash] = 0;
            })
            .on('receipt', (receipt: Web3Types.TransactionReceipt) =>
            {
                if (receipt.status == '0x0') {
                    const error = new VError(`Exception thrown for ${description}`);
                    logger.error(error.stack);
                    return reject(error);
                }

                logger.debug(`${receipt.gasUsed} gas used of a ${gas} gas limit for ${description}`);
                resolve(receipt.transactionHash);
            })
            .on('confirmation', (confirmationNumber: number, receipt: Web3Types.TransactionReceipt) =>
            {
                logger.trace(`${confirmationNumber} confirmations for ${description} with transaction hash ${receipt.transactionHash}`);

                self.transactions[receipt.transactionHash] = confirmationNumber;
            })
            .on('error', (err: Error) =>
            {
                const error = new VError(err, `Could not ${description}`);
                logger.error(error.stack);
                reject(error);
            });
        });
    }

    // a token holder requests the token issuer to send a bank payment for their redeemed tokens
    requestWithdrawal(tokenHolderAddress: string, amount: number, _gas?: number, _gasPrice?: number): Promise<string>
    {
        const self = this;

        const gas = _gas || self.defaultGas;
        const gasPrice = _gasPrice || self.defaultGasPrice;

        const description = `request withdraw of ${amount} tokens from contract ${this.contract._address} and token holder ${tokenHolderAddress}`;

        return new Promise<string>((resolve, reject) =>
        {
            self.contract.methods.requestWithdrawal(amount).send({
                from: tokenHolderAddress
            })
            .on('transactionHash', (hash: string) =>
            {
                logger.info(`${description} returned transaction hash ${hash}`);
                self.transactions[hash] = 0;
            })
            .on('receipt', (receipt: Web3Types.TransactionReceipt) =>
            {
                if (receipt.status == '0x0') {
                    const error = new VError(`Exception thrown for ${description}`);
                    logger.error(error.stack);
                    return reject(error);
                }

                logger.debug(`${receipt.gasUsed} gas used of a ${gas} gas limit for ${description}`);
                resolve(receipt.transactionHash);
            })
            .on('confirmation', (confirmationNumber: number, receipt: Web3Types.TransactionReceipt) =>
            {
                logger.trace(`${confirmationNumber} confirmations for ${description} with transaction hash ${receipt.transactionHash}`);
                self.transactions[receipt.transactionHash] = confirmationNumber;
            })
            .on('error', (err: Error) =>
            {
                const error = new VError(err, `Could not ${description}`);
                logger.error(error.stack);
                reject(error);
            });
        });
    }

    confirmWithdraw(withdrawalNumber: number, _gas?: number, _gasPrice?: number): Promise<string>
    {
        const self = this;

        const gas = _gas || self.defaultGas;
        const gasPrice = _gasPrice || self.defaultGasPrice;

        const description = `confirm withdrawal number ${withdrawalNumber} against contract ${this.contract._address} using contract owner ${self.contractOwner}`;

        return new Promise<string>((resolve, reject) =>
        {
            self.contract.methods.confirmWithdraw(withdrawalNumber).send({
                from: self.contractOwner
            })
                .on('transactionHash', (hash: string) =>
                {
                    logger.info(`${description} returned transaction hash ${hash}`);
                    self.transactions[hash] = 0;
                })
                .on('receipt', (receipt: Web3Types.TransactionReceipt) =>
                {
                    if (receipt.status == '0x0') {
                        const error = new VError(`Exception thrown for ${description}`);
                        logger.error(error.stack);
                        return reject(error);
                    }

                    logger.debug(`${receipt.gasUsed} gas used of a ${gas} gas limit for ${description}`);
                    resolve(receipt.transactionHash);
                })
                .on('confirmation', (confirmationNumber: number, receipt: Web3Types.TransactionReceipt) =>
                {
                    logger.trace(`${confirmationNumber} confirmations for ${description} with transaction hash ${receipt.transactionHash}`);
                    self.transactions[receipt.transactionHash] = confirmationNumber;
                })
                .on('error', (err: Error) =>
                {
                    const error = new VError(err, `Could not ${description}`);
                    logger.error(error.stack);
                    reject(error);
                });
        });
    }

    async isTokenHolder(address: string): Promise<boolean>
    {
        const description = `is address ${address} a token holder in contract at address ${this.contract._address}`;

        try
        {
            const result: boolean = await this.contract.methods.isTokenHolder(address).call();

            logger.info(`Got ${result} result for ${description}`);
            return result;
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
        const description = `has bank transaction id ${bankTransactionId} been used in contract at address ${this.contract._address}`;

        try
        {
            const result: boolean = await this.contract.methods.hasBankTransactionId(bankTransactionId).call();

            logger.info(`Got ${result} result for ${description}`);
            return result;
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }
}
