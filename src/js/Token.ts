import {Wallet, Contract,
    provider as Provider} from 'ethers';
import * as BN from 'bn.js';
import * as logger from 'config-logger';
import * as VError from 'verror';

import BaseContract, {SendOptions} from './BaseContract';

import {KeyStore} from './keyStore/index.d';
import {TransactionReceipt} from "./index";

declare type HolderBalances = {
    [holderAddress: string] : number
};

export default class Token extends BaseContract
{
    contract: object;

    transactions: { [transactionHash: string] : number; } = {};

    constructor(readonly transactionsProvider: Provider, readonly eventsProvider: Provider,
                readonly keyStore: KeyStore,
                readonly jsonInterface: object[], readonly contractBinary: string, contractAddress?: string,
                readonly defaultSendOptions: SendOptions = {
                    gasPrice: 1000000000,
                    gasLimit: 120000})
    {
        super(transactionsProvider, eventsProvider, keyStore, jsonInterface,
            contractBinary, contractAddress, defaultSendOptions);

        if (contractAddress)
        {
            this.contract = new Contract(contractAddress, jsonInterface, this.transactionsProvider);
        }
    }

    // deploy a new contract
    deployContract(contractOwner: string, gasLimit = 1900000, gasPrice = 2000000000, symbol: string, tokenName: string): Promise<TransactionReceipt>
    {
        return super.deployContract(contractOwner, gasLimit, gasPrice, symbol, tokenName);
    }

    // transfer an amount of tokens from one address to another
    transfer(fromAddress: string, toAddress: string, amount: number,
             gasLimit: number = this.defaultGasLimit,
             gasPrice: number = this.defaultGasPrice): Promise<TransactionReceipt>
    {
        const self = this;

        const description = `transfer ${amount} tokens from address ${fromAddress}, to address ${toAddress}, contract ${this.contract.address}, gas limit ${gasLimit} and gas price ${gasPrice}`;

        return new Promise<TransactionReceipt>(async (resolve, reject) =>
        {
            try
            {
                const privateKey = await self.keyStore.getPrivateKey(fromAddress);
                const wallet = new Wallet(privateKey, self.transactionsProvider);

                const contract = new Contract(self.contract.address, self.jsonInterface, wallet);

                // send the transaction
                const broadcastTransaction = await contract.transfer(toAddress, amount, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });

                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);

                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);

                resolve(transactionReceipt);
            }
            catch (err) {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }

    async getSymbol(): Promise<string>
    {
        const description = `symbol of contract at address ${this.contract.address}`;

        try
        {
            const result = await this.contract.symbol();
            const symbol = result[0];

            logger.info(`Got ${symbol} ${description}`);
            return symbol;
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }

    async getName(): Promise<string>
    {
        const description = `name of contract at address ${this.contract.address}`;

        try
        {
            const result = await this.contract.name();
            const name = result[0];

            logger.info(`Got "${name}" ${description}`);
            return name;
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }

    async getDecimals(): Promise<number>
    {
        const description = `number of decimals for contract at address ${this.contract.address}`;

        try
        {
            const result = await this.contract.decimals();
            const decimals = result[0];

            logger.info(`Got ${decimals} ${description}`);
            return decimals;
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }

    async getTotalSupply(): Promise<BN>
    {
        const description = `total supply of contract at address ${this.contract.address}`;

        try
        {
            const result = await this.contract.totalSupply();
            const totalSupply: BN = result[0]._bn;

            logger.info(`Got ${totalSupply.toString()} ${description}`);
            return totalSupply;
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }

    async getBalanceOf(address: string): Promise<BN>
    {
        const description = `balance of address ${address} in contract at address ${this.contract.address}`;

        try
        {
            const result = await this.contract.balanceOf(address);
            const balance: BN = result[0]._bn;

            logger.info(`Got ${balance} ${description}`);
            return balance;
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }

    async getHolderBalances(): Promise<HolderBalances>
    {
        const description = `all token holder balances from contract address ${this.contract.address}`;

        try {
            const transferEvents = await this.getEvents("Transfer");

            const holderBalances: HolderBalances = {};

            transferEvents.forEach(event => {
                const fromAddress: string = event.fromAddress,
                    toAddress: string = event.toAddress,
                    amount: number = Number(event.amount);

                // if deposit
                if(fromAddress == '0x0000000000000000000000000000000000000000')
                {
                    holderBalances[toAddress] = (holderBalances[toAddress]) ?
                        holderBalances[toAddress] += amount :
                        holderBalances[toAddress] = amount;
                }
                // if withdrawal
                else if(toAddress == '0x0000000000000000000000000000000000000000')
                {
                    holderBalances[fromAddress] = (holderBalances[fromAddress]) ?
                        holderBalances[fromAddress] -= amount :
                        holderBalances[fromAddress] = -amount;
                }
                // if transfer
                else
                {
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
        catch(err) {
            const error = new VError(err, `Could not get ${description}`);
            console.log(error.stack);
            throw error;
        }
    }
}
