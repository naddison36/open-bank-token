import {Wallet, Contract, provider as Provider} from 'ethers';
import * as BN from 'bn.js';
import * as logger from 'config-logger';
import * as VError from 'verror';

import BaseContract, {SendOptions} from './BaseContract';
import {SignerConstructor} from './signers';
import {TransactionReceipt} from "./index";

declare type HolderBalances = {
    [holderAddress: string] : number
};

export default class Token extends BaseContract
{
    contract: object;

    transactions: { [transactionHash: string] : number; } = {};

    constructor(transactionsProvider: Provider, eventsProvider: Provider,
                Signer: SignerConstructor,
                jsonInterface: object[], contractBinary: string, contractAddress?: string,
                defaultSendOptions: SendOptions = {
                    gasPrice: 1000000000,
                    gasLimit: 120000})
    {
        super(transactionsProvider, eventsProvider, Signer, jsonInterface,
            contractBinary, contractAddress, defaultSendOptions);

        if (contractAddress)
        {
            this.contract = new Contract(contractAddress, jsonInterface, this.transactionsProvider);
        }
    }

    // deploy a new contract
    deployContract(contractOwner: string, overrideSendOptions: SendOptions, symbol: string, tokenName: string): Promise<TransactionReceipt>
    {
        return super.deployContract(contractOwner, overrideSendOptions, symbol, tokenName);
    }

    // transfer an amount of tokens from the signer to another address
    transfer(signer: string, toAddress: string, amount: number, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("transfer", signer, sendOptions, toAddress, amount);
    }

    async getSymbol(): Promise<string>
    {
        return await super.call("symbol");
    }

    async getName(): Promise<string>
    {
        return await super.call("name");
    }

    async getDecimals(): Promise<number>
    {
        return await super.call("decimals");
    }

    async getTotalSupply(): Promise<BN>
    {
        return await super.call("totalSupply");
    }

    async getBalanceOf(address: string): Promise<BN>
    {
        return await super.call("balanceOf", ...arguments);
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
