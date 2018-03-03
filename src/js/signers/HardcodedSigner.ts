import AbstractPrivateKeySigner from './AbstractPrivateKeySigner';

export default class HardcodedSigner extends AbstractPrivateKeySigner
{
    getPrivateKey(address: string): Promise<string>
    {
        return new Promise((resolve, reject)=>
        {
            if (address == '0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A') {
                //8ae386892b59bd2a7546a9468e8e847d61955991
                resolve('0x1111111111111111111111111111111111111111111111111111111111111111');
            }
            else if (address == '0x1563915e194D8CfBA1943570603F7606A3115508') {
                resolve('0x2222222222222222222222222222222222222222222222222222222222222222');
            }
            else if (address == '0x5CbDd86a2FA8Dc4bDdd8a8f69dBa48572EeC07FB') {
                resolve('0x3333333333333333333333333333333333333333333333333333333333333333');
            }
            else if (address == '0x7564105E977516C53bE337314c7E53838967bDaC') {
                resolve('0x4444444444444444444444444444444444444444444444444444444444444444');
            }
            else if (address == '0x14791697260e4c9a71f18484c9f997b308e59325') {
                resolve('0x0123456789012345678901234567890123456789012345678901234567890123');
            }

            reject(new Error(`Could not find private key for address ${address}`));
        });
    }
}