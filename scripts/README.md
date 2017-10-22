# Testing
This project comes with pre configured Geth and Parity nodes for testing purposes.

## Geth
This project comes with scripts to run a development instance of geth to test deploying a token contract and issuing tokens to it.

### Initial Setup
In the [scripts](./scripts) folder, run the following commands on a Mac OSX or Linux platform
```
cd scripts
chmod a+x initGeth.sh
./initGeth.sh
```

This is start a new development blockchain using the [genesis.json](./scripts/genesis.json) file. The chain data will be under [testchain](./testchain) in the geth folder.

### Starting Geth
If the above initial setup has already been done, the development geth node can be started with
```
cd scripts
chmod a+x startGeth.sh
./startGeth.sh
```

## Parity

## Starting Parity
In the [scripts](./scripts) folder, run the following commands on a Mac OSX or Linux platform
```
cd scripts
chmod a+x startParity.sh
./startParity.sh
```

This is start a new development blockchain using the [meetupChainSpec.json](./scripts/meetupChainSpec.json) specification file and [parityDevConfig.toml](./scripts/parityDevConfig.toml) config file. The chain data will be under [testchain](./testchain) in the parity folder.

## Test Accounts
The pre-configured testing accounts.

| Test Actor | Account Number | Public Key | Private Key | Key File |
| --- | --- | --- |  --- | --- |
| Coinbase | 0 | 0xD728cee2648A642fdA9DC1218D2d5746848400Ba | bb7dae2fd6c1023a1d108b91e8b4069c767902e5ecceb020f190bb3cb438f947 | [file](./testchain/keystore/UTC--2017-10-08T13-27-47.615766567Z--d728cee2648a642fda9dc1218d2d5746848400ba) |
| Token Issuer | 1 | 0xF55583FF8461DB9dfbBe90b5F3324f2A290c3356 | fa643e0ded9fd96209545b6cc9230376627012d8fb01cfa8d338b8a3aa4aeaaf | [file](./testchain/keystore/UTC--2017-10-08T13-30-44.023970086Z--f55583ff8461db9dfbbe90b5f3324f2a290c3356) |
| Token Holder 1 | 2 | 0x8Ae386892b59bD2A7546a9468E8e847D61955991 | 26a1887e3a3ee4e632394256f4da44a2d364db682398fc2c3f8176ef2dacebda | [file](./testchain/keystore/UTC--2017-10-08T13-31-20.622920884Z--8ae386892b59bd2a7546a9468e8e847d61955991) |
| Unit Test Issuer | 3 | 0x0013a861865d784d97c57e70814b13ba94713d4e | 146b37e6a2eb2b3593bd5d5da7c71232fc9548a150cd2507d322f8e0c0cdd2f5 | [file](./testchain/keystore/UTC--2017-10-14T11-18-07.913804398Z--0013a861865d784d97c57e70814b13ba94713d4e) |
| Token Holder 3 | 4 | 0xD9D72D466637e8408BB3B17d3ff6DB02e8BeBf27 | 25f77bc6483be54b2efc748c511f3955534b4366563bfef7e8e4c8382a7ccd29 | [file](./testchain/keystore/UTC--2017-10-17T11-57-34.143684261Z--d9d72d466637e8408bb3b17d3ff6db02e8bebf27) |


The password to the above testing accounts is `OpenBankToken`. This is also stored in the [testpassword](./scripts/testpassword) file under the [scripts](./scripts) folder.
