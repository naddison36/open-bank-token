import * as Web3 from 'web3';
import * as logger from 'config-logger';

import {Transaction, TransactionReceipt} from "./index.d";

export default class EthSigner
{
    constructor(readonly web3: Web3) {
    }

    async signTransaction(tx: Transaction): Promise<TransactionReceipt>
    {
        const privateKey = await this.getPrivateKey(tx.from);

        const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        logger.debug(`created account ${account.address} for signing from private key ${privateKey}`);

        const signedTx = await account.signTransaction(tx);
        logger.debug(`Signed transaction for ${JSON.stringify(tx)} was:\n${JSON.stringify(signedTx)}`);

        return signedTx;
    }

    getPrivateKey(fromAddress: string): Promise<string>
    {
        return new Promise<string>(async(resolve, reject) =>
        {
            resolve('0xfa643e0ded9fd96209545b6cc9230376627012d8fb01cfa8d338b8a3aa4aeaaf');
        });
    }
}