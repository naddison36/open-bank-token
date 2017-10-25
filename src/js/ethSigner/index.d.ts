
import * as Web3 from 'web3';

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

export default class EthSigner {
    constructor(web3: Web3);
    signTransaction(tx: Transaction): Promise<TransactionReceipt>;
}