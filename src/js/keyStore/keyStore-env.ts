import * as VError from 'verror';
import * as logger from 'config-logger';

export default class KeyStore
{
    getPrivateKey(fromAddress: string): Promise<string>
    {
        return new Promise<string>(async(resolve, reject) =>
        {
            const privateKey = process.env[fromAddress];

            if (privateKey) {
                resolve(privateKey);
            }
            else {
                const error = new VError(`could not find environment variable with address ${fromAddress} that has the private key`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }
}