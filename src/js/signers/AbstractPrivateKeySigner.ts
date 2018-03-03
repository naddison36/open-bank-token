import {provider as Provider, Wallet, utils} from 'ethers';
import {ISigner, Transaction} from "./index";

export default abstract class AbstractPrivateKeySigner implements ISigner
{
    wallet: Wallet;

    constructor(protected address: string, public provider: Provider) {}

    getAddress(): Promise<string>
    {
        return new Promise((resolve, reject)=>
        {
            resolve(this.address);
        });
    }

    sign(transaction: Transaction): Promise<string>
    {
        return new Promise(async (resolve, reject)=>
        {
            if (!this.wallet)
            {
                const privateKey = await this.getPrivateKey(this.address);
                this.wallet = new Wallet(privateKey);
            }

            const signedTransaction = this.wallet.sign(transaction);

            resolve(signedTransaction);
        });
    }

    abstract getPrivateKey(address: string): Promise<string>
}