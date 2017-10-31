
import BN from 'bn.js';

export declare interface TransactionReceipt {
    contractAddress?: string,
    transactionIndex: number,
    root?: string,
    status?: BN,
    gasUsed: BN,
    cumulativeGasUsed: BN,
    logsBloom: string,
    blockHash: string,
    transactionHash: string,
    logs: TransactionReceiptLog[],
    blockNumber: number
}

export declare interface TransactionReceiptLog {
    blockNumber: number,
    blockHash: string,
    transactionHash: string,
    transactionIndex: number,
    transactionLogIndex: number,
    address: string,
    topics: string[],
    data: string,
    logIndex: number
}