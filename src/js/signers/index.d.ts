import {provider as Provider, utils} from 'ethers';

// TODO The following can be removed once Ethers.js has TypeScript definitions https://github.com/ethers-io/ethers.js/pull/99 has been merged
export type Transaction = {
    chainId: number
    hash: string
    from: string
    to: string
    data: any
    nonce: utils.BigNumber
    gasPrice: utils.BigNumber
    gasLimit: utils.BigNumber
    value: utils.BigNumber
}

export interface ISigner
{
    getAddress(): Promise<string>,
    sign(transaction: Transaction): Promise<string>,
    provider: Provider
}
export interface SignerConstructor
{
    new(address: string, provider: Provider): ISigner
}