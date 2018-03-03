import AbstractPrivateKeySigner from './AbstractPrivateKeySigner';

export default class EnvSigner extends AbstractPrivateKeySigner
{
    getPrivateKey(address: string): Promise<string>
    {
        return new Promise((resolve, reject)=>
        {
            const privateKey = process.env[address];

            if (privateKey) {
                resolve(privateKey);
            }
            else {
                const error = new Error(`could not find environment variable called ${address} that has the private key`);
                reject(error);
            }
        });
    }
}