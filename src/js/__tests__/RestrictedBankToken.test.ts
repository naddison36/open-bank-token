import {providers as Providers, Wallet} from 'ethers';
import * as BN from 'bn.js';

import RestrictedBankToken from '../RestrictedBankToken';
import HardcodedSigner from '../signers/HardcodedSigner';

const testContractOwner = '0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A',
    depositor1 = '0x1563915e194D8CfBA1943570603F7606A3115508',
    depositor2 = '0x5CbDd86a2FA8Dc4bDdd8a8f69dBa48572EeC07FB',
    depositor3 = '0x7564105E977516C53bE337314c7E53838967bDaC';

describe("BankToken", ()=>
{
    const transactionsProvider = new Providers.JsonRpcProvider("http://localhost:8646", "unspecified");
    const eventsProvider = new Providers.JsonRpcProvider("http://localhost:8646", "unspecified");

    const restrictedBankToken = new RestrictedBankToken(transactionsProvider, eventsProvider, HardcodedSigner);

    describe("Deploy contract", ()=>
    {
        test('with default arguments', async () =>
        {
            expect.assertions(5);

            const txReceipt = await restrictedBankToken.deployContract(testContractOwner);

            expect(txReceipt.contractAddress).toHaveLength(42);

            expect(await restrictedBankToken.getSymbol()).toEqual('DAD');
            expect(await restrictedBankToken.getName()).toEqual('Digital Australian Dollar');
            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(0));
            expect(await restrictedBankToken.getDecimals()).toEqual(0);

        }, 60000);

        test('with specified arguments', async () =>
        {
            expect.assertions(4);

            const txReceipt = await restrictedBankToken.deployContract(testContractOwner, {
                gasLimit: 1900000,
                gasPrice: 4000000000},
                "Test", "Test name");

            expect(txReceipt.contractAddress).toHaveLength(42);

            expect(await restrictedBankToken.getSymbol()).toEqual('Test');
            expect(await restrictedBankToken.getName()).toEqual('Test name');
            expect(await restrictedBankToken.getDecimals()).toEqual(0);

        }, 60000);
    });

    describe("deposit", async ()=>
    {
        beforeAll(async()=>
        {
            await restrictedBankToken.deployContract(testContractOwner);
        }, 30000);

        test("checks before any deposits", async ()=>
        {
            expect.assertions(4);

            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(0));
            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(0));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(0));

            const events = await restrictedBankToken.getEvents('Deposit', 1);
            expect(events).toHaveLength(0);
        }, 30000);

        test("to first token holder", async ()=>
        {
            expect.assertions(6);

            expect(await restrictedBankToken.isTokenHolder(depositor1)).toEqual(false);

            const txReceipt = await restrictedBankToken.deposit(depositor1, 100, '1111', '10000');

            expect(await restrictedBankToken.isTokenHolder(depositor1)).toEqual(true);

            expect(txReceipt.transactionHash).toHaveLength(66);
            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(100));
            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(100));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(0));
        }, 30000);

        test("get event from first deposit", async ()=>
        {
            expect.assertions(5);

            const events = await restrictedBankToken.getEvents('Deposit', 2);

            expect(events).toHaveLength(1);
            expect(events[0].toAddress).toEqual(depositor1);
            expect(events[0].amount).toEqual(new BN(100));
            expect(events[0].externalId).toEqual('1111');
            expect(events[0].bankTransactionId).toEqual('10000');
        });

        test("to second token holder", async ()=>
        {
            expect.assertions(6);

            expect(await restrictedBankToken.isTokenHolder(depositor2)).toEqual(false);

            const txReceipt = await restrictedBankToken.deposit(depositor2, 200, '2222', '10001');

            expect(await restrictedBankToken.isTokenHolder(depositor2)).toEqual(true);

            expect(txReceipt.transactionHash).toHaveLength(66);
            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(300));
            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(100));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(200));
        }, 40000);

        test("to first token holder again", async ()=>
        {
            expect.assertions(5);

            expect(await restrictedBankToken.hasBankTransactionId('10003')).toEqual(false);

            const txReceipt = await restrictedBankToken.deposit(depositor1, 10, '1111', '10003');

            expect(await restrictedBankToken.hasBankTransactionId('10003')).toEqual(true);

            expect(txReceipt.transactionHash).toHaveLength(66);
            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(310));
            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(110));
        }, 40000);

        test("get events from three deposits", async ()=>
        {
            expect.assertions(13);

            const events = await restrictedBankToken.getEvents('Deposit', 0);

            expect(events).toHaveLength(3);

            expect(events[0].toAddress.toUpperCase()).toEqual(depositor1.toUpperCase());
            expect(events[0].amount).toEqual(new BN(100));
            expect(events[0].externalId).toEqual('1111');
            expect(events[0].bankTransactionId).toEqual('10000');

            expect(events[1].toAddress.toUpperCase()).toEqual(depositor2.toUpperCase());
            expect(events[1].amount).toEqual(new BN(200));
            expect(events[1].externalId).toEqual('2222');
            expect(events[1].bankTransactionId).toEqual('10001');

            expect(events[2].toAddress.toUpperCase()).toEqual(depositor1.toUpperCase());
            expect(events[2].amount).toEqual(new BN(10));
            expect(events[2].externalId).toEqual('1111');
            expect(events[2].bankTransactionId).toEqual('10003');
        });

        test("duplicate to first token holder again", async ()=>
        {
            expect.assertions(3);

            try {
                await restrictedBankToken.deposit(depositor1, 20, '11', '10003');
            }
            catch (err) {
                expect(err instanceof Error).toBeTruthy();
            }

            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(310));
            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(110));
        }, 40000);

        test("to third token holder with > 1000 tokens", async ()=>
        {
            expect.assertions(3);

            restrictedBankToken.contractOwner = testContractOwner;

            try {
                await restrictedBankToken.deposit(depositor3, 10001, '3333', '10010');
            }
            catch (err) {
                expect(err instanceof Error).toBeTruthy();
            }

            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(310));
            expect(await restrictedBankToken.getBalanceOf(depositor3)).toMatchObject(new BN(0));
        }, 40000);

        test("to first token holder so they have more than 1000 tokens", async ()=>
        {
            expect.assertions(3);

            try {
                await restrictedBankToken.deposit(depositor1, 900, '1111', '10020');
            }
            catch (err) {
                expect(err instanceof Error).toBeTruthy();
            }

            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(310));
            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(110));
        }, 40000);

        test("to first token holder but not as the contract owner", async ()=>
        {
            expect.assertions(3);

            const differentOwnerBankToken = new RestrictedBankToken(
                transactionsProvider,
                eventsProvider,
                HardcodedSigner
            );

            try {
                await differentOwnerBankToken.deposit(depositor1, 30, '111', '10004');
            }
            catch (err) {
                expect(err instanceof Error).toBeTruthy();
            }

            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(310));
            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(110));
        }, 40000);
    });

    describe("transfers", ()=>
    {
        beforeAll(async()=>
        {
            await restrictedBankToken.deployContract(testContractOwner);
            await restrictedBankToken.deposit(depositor1, 999, '3333', '10100');
            await restrictedBankToken.deposit(depositor2, 888, '4444', '10200');
        }, 60000);

        test("from first depositor to an address not registered as a depositor", async ()=>
        {
            expect.assertions(4);

            try {
                const transactionReceipt = await restrictedBankToken.transfer(depositor1, depositor3, 100);
            }
            catch (err) {
                expect(err instanceof Error).toBeTruthy();
            }

            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(999));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(888));
            expect(await restrictedBankToken.getBalanceOf(depositor3)).toMatchObject(new BN(0));
        }, 40000);

        test("from an address with no tokens", async ()=>
        {
            expect.assertions(3);

            try {
                const transactionReceipt = await restrictedBankToken.transfer(depositor3, depositor1, 1);
            }
            catch (err) {
                expect(err instanceof Error).toBeTruthy();
            }

            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(999));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(888));
        }, 40000);

        test("from first to second depositor where the second depositor will have > 1000 tokens", async ()=>
        {
            expect.assertions(3);

            try {
                const transactionReceipt = await restrictedBankToken.transfer(depositor1, depositor2, 200);
            }
            catch (err) {
                expect(err instanceof Error).toBeTruthy();
            }

            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(999));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(888));
        }, 40000);

        test("12 tokens from first to second depositor", async ()=>
        {
            expect.assertions(3);

            const txReceipt = await restrictedBankToken.transfer(depositor1, depositor2, 12);
            expect(txReceipt.transactionHash).toHaveLength(66);

            const depositor1Balance = await restrictedBankToken.getBalanceOf(depositor1);
            expect(depositor1Balance.toString()).toEqual(new BN(987).toString());
            const depositor2Balance = await restrictedBankToken.getBalanceOf(depositor2);
            expect(depositor2Balance.toString()).toEqual(new BN(900).toString());
        }, 40000);

        test("event from transfer", async()=>
        {
            expect.assertions(4);

            const events = await restrictedBankToken.getEvents("Transfer");

            expect(events).toHaveLength(3);
            // the third event as the two deposits in the beforeAll function will also emit Transfer events
            expect(events[2].fromAddress.toUpperCase()).toEqual(depositor1.toUpperCase());
            expect(events[2].toAddress.toUpperCase()).toEqual(depositor2.toUpperCase());
            expect(events[2].amount).toMatchObject(new BN(12));
        }, 40000);

        test("13 tokens from second to first depositor", async ()=>
        {
            expect.assertions(3);

            const txReceipt = await restrictedBankToken.transfer(depositor2, depositor1, 13);

            expect(txReceipt.transactionHash).toHaveLength(66);
            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(1000));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(887));
        }, 40000);

        test("0 tokens from first to second depositor", async ()=>
        {
            expect.assertions(3);

            const txReceipt = await restrictedBankToken.transfer(depositor1, depositor2, 0);

            expect(txReceipt.transactionHash).toHaveLength(66);
            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(1000));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(887));
        }, 40000);
    });

    describe("withdrawals", ()=>
    {
        beforeAll(async ()=>
        {
            try {
                let hash = await restrictedBankToken.deployContract(testContractOwner);
                hash = await restrictedBankToken.deposit(depositor1, 1000, '5555', '10501');
                hash = await restrictedBankToken.deposit(depositor2, 1000, '6666', '10601');
            }
            catch (err) {
                console.log(err.stack);
            }
        }, 60000);

        test("test suite setup was successful", async()=>
        {
            expect.assertions(3);

            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(1000));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(1000));
            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(2000));
        }, 20000);

        test("request withdraw when no tokens", async ()=>
        {
            expect.assertions(3);

            try {
                await restrictedBankToken.requestWithdrawal(100, depositor3);
            }
            catch(err) {
                expect(err instanceof Error).toBeTruthy();
            }

            expect(await restrictedBankToken.getBalanceOf(depositor3)).toMatchObject(new BN(0));
            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(2000));

        }, 30000);

        test("request withdraw too much", async ()=>
        {
            expect.assertions(4);

            try {
                await restrictedBankToken.requestWithdrawal(1001, depositor1);
            }
            catch(err) {
                expect(err instanceof Error).toBeTruthy();
            }

            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(1000));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(1000));
            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(2000));
        }, 30000);

        test("request withdraw from first depositor", async ()=>
        {
            expect.assertions(6);

            const preWithdrawalCounter = await restrictedBankToken.getWithdrawalCounter();

            expect(preWithdrawalCounter.toNumber()).toEqual(0);

            const txReceipt = await restrictedBankToken.requestWithdrawal(100, depositor1);

            expect(txReceipt.transactionHash).toHaveLength(66);
            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(900));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(1000));
            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(1900));

            const postWithdrawalCounter = await restrictedBankToken.getWithdrawalCounter();
            expect(postWithdrawalCounter.toNumber()).toEqual(preWithdrawalCounter.toNumber() + 1);
        }, 30000);

        test("event from request withdrawal", async()=>
        {
            expect.assertions(4);

            const events = await restrictedBankToken.getEvents("RequestWithdrawal");

            expect(events).toHaveLength(1);
            expect(events[0].withdrawalNumber).toMatchObject(new BN(0));
            expect(events[0].withdrawer.toUpperCase()).toEqual(depositor1.toUpperCase());
            expect(events[0].amount).toMatchObject(new BN(100));
        }, 40000);

        test("get token holder balances", async()=>
        {
            expect.assertions(5);

            const tokenHolderBalances = await restrictedBankToken.getHolderBalances();

            const keys = Object.keys(tokenHolderBalances);

            expect(keys).toHaveLength(2);
            expect(keys[0].toUpperCase()).toEqual(depositor1.toUpperCase());
            expect(tokenHolderBalances[keys[0]]).toEqual(900);

            expect(keys[1].toUpperCase()).toEqual(depositor2.toUpperCase());
            expect(tokenHolderBalances[keys[1]]).toEqual(1000);
        }, 30000);

        test("confirm withdrawal request", async()=>
        {
            expect.assertions(6);

            const preConfirm = await restrictedBankToken.hasConfirmedWithdrawal(new BN(0));
            expect(preConfirm).toBeFalsy();

            const txReceipt = await restrictedBankToken.confirmWithdrawal(new BN(0));

            expect(txReceipt.transactionHash).toHaveLength(66);
            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(900));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(1000));
            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(1900));

            const postConfirm = await restrictedBankToken.hasConfirmedWithdrawal(new BN(0));
            expect(postConfirm).toBeTruthy();
        }, 30000);

        test("event from confirm withdrawal", async()=>
        {
            expect.assertions(4);

            const events = await restrictedBankToken.getEvents("ConfirmWithdrawal");

            expect(events).toHaveLength(1);
            expect(events[0].withdrawalNumber).toMatchObject(new BN(0));
            expect(events[0].withdrawer.toUpperCase()).toEqual(depositor1.toUpperCase());
            expect(events[0].amount).toMatchObject(new BN(100));
        }, 40000);

        test("transfer and then withdraw", async()=>
        {
            expect.assertions(7);

            // need a deposit before a transfer can be done to a new token holder
            const depositTxReceipt = await restrictedBankToken.deposit(depositor3, 0, '6666', '10502');
            expect(depositTxReceipt.transactionHash).toHaveLength(66);

            const transferTxReceipt = await restrictedBankToken.transfer(depositor1, depositor3, 99);
            expect(transferTxReceipt.transactionHash).toHaveLength(66);

            const withdrawalTxReceipt = await restrictedBankToken.requestWithdrawal(100, depositor1);

            expect(withdrawalTxReceipt.transactionHash).toHaveLength(66);
            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(701));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(1000));
            expect(await restrictedBankToken.getBalanceOf(depositor3)).toMatchObject(new BN(99));
            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(1800));
        }, 60000);

        test("get token holder balances after transfer and withdrawal", async()=>
        {
            expect.assertions(7);

            const tokenHolderBalances = await restrictedBankToken.getHolderBalances();

            const keys = Object.keys(tokenHolderBalances);

            expect(keys).toHaveLength(3);
            expect(keys[0].toUpperCase()).toEqual(depositor1.toUpperCase());
            expect(tokenHolderBalances[keys[0]]).toEqual(701);

            expect(keys[1].toUpperCase()).toEqual(depositor2.toUpperCase());
            expect(tokenHolderBalances[keys[1]]).toEqual(1000);

            expect(keys[2].toUpperCase()).toEqual(depositor3.toUpperCase());
            expect(tokenHolderBalances[keys[2]]).toEqual(99);
        }, 20000);

        test("reject withdrawal request", async()=>
        {
            expect.assertions(7);

            const preConfirm = await restrictedBankToken.hasConfirmedWithdrawal(new BN(1));
            expect(preConfirm).toBeFalsy();

            const txReceipt = await restrictedBankToken.rejectWithdrawal(new BN(1));

            expect(txReceipt.transactionHash).toHaveLength(66);
            expect(await restrictedBankToken.getBalanceOf(depositor1)).toMatchObject(new BN(801));
            expect(await restrictedBankToken.getBalanceOf(depositor2)).toMatchObject(new BN(1000));
            expect(await restrictedBankToken.getBalanceOf(depositor3)).toMatchObject(new BN(99));
            expect(await restrictedBankToken.getTotalSupply()).toMatchObject(new BN(1900));

            const postConfirm = await restrictedBankToken.hasConfirmedWithdrawal(new BN(1));
            expect(postConfirm).toBeFalsy();
        }, 30000);

        test("event from reject withdrawal", async()=>
        {
            expect.assertions(4);

            const events = await restrictedBankToken.getEvents("RejectWithdrawal");

            expect(events).toHaveLength(1);
            expect(events[0].withdrawalNumber).toMatchObject(new BN(1));
            expect(events[0].withdrawer.toUpperCase()).toEqual(depositor1.toUpperCase());
            expect(events[0].amount).toMatchObject(new BN(100));
        }, 40000);
    });

    describe("Sending Ether", async ()=>
    {
        beforeAll(async () => {
            await restrictedBankToken.deployContract(testContractOwner);
        }, 30000);

        test("to Bank Token contract", async() =>
        {
            expect.assertions(2);

            const wallet = new Wallet("0x0123456789012345678901234567890123456789012345678901234567890123");

            const signedTransaction = wallet.sign({
                to: restrictedBankToken.contract.address,  // the target address
                nonce: await transactionsProvider.getTransactionCount(wallet.address, "latest"),           // the transaction nonce
                gasLimit: 22000,        // the maximum gas this transaction may spend
                gasPrice: 1000000000,        // the price (in wei) per unit of gas
                value: 1,           // the amount (in wei) this transaction is sending
                chainId: transactionsProvider.chainId          // the network ID; usually added by a signer
            });

            const hash = await transactionsProvider.sendTransaction(signedTransaction);

            expect(hash).toHaveLength(66);

            const rawTransactionReceipt = await transactionsProvider.getTransactionReceipt(hash);

            // status 0 is a failed transaction, status 1 is a successful transaction
            expect(rawTransactionReceipt.status).toEqual(0);
        });
    });
});
