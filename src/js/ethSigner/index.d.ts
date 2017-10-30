
import {TransactionReceipt} from 'web3/types.d';
export {TransactionReceipt} from 'web3/types.d';

export declare interface Transaction {
    nonce?: number
    from: string
    to?: string
    value?: string
    gasPrice: number
    gas: number
    data?: string
}

export declare class EthSigner {
    constructor();
    signTransaction(tx: Transaction): Promise<TransactionReceipt>;
    getPrivateKey(address: string): Promise<string>;
}