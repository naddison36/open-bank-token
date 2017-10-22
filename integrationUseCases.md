# User Cases for the Bank to Token Integration program

## 1. Calculate token balances from contract events
Get the token balance for each of the token holders by iterating through all deposit and withdrawal events from the token contract.

Reconstructing the token balances from the contract events rather than an off-chain datastore means the token balances are more likely to be accurate as off-chain datastores can get out of sync with the on-chain balances.

## 2. Get Ethereum addresses from meetup profiles
Using the Meetup API, get all members of the configured meetup group. For each member, try and extract an Ethereum address from the introduction field of the member's profile. The Ethereum address will be stored against the Meetup member identifier.

## 3. Check for new bank deposits from the bank API
Using the issuer bank's transaction API, check for any new deposit transactions in the issuer's bank account since the last time this check was run.

## 4. Process new deposit
For each new deposit into the issuer's bank account:
1. Extract the Meetup member identifier from the transaction reference.
2. Store the sender's bank details against the Meetup member identifier. This is used later for withdrawals.
3. Look up the Ethereum address for the Meetup member's identifier.
4. Validate that issuing the newly deposited tokens will not increase the token holder's balance by more than 1000 tokens.

If the previous steps fail then return the funds to the sender using the Bank payment API.

If the steps pass then issue new tokens to the token holder's Ethereum address where each dollar deposited equals the issuance of one token.

## 5. Get depositor bank details from the Bank API
Get the list of deposit transactions into the issuer's bank account. For each deposit transaction, get the sender's bank account details so funds can be returned if they withdraw tokens or the scheme needs to be liquidated. 

## 6. Process withdraw event
For each withdraw event received since the last time a withdrawal was processed, look up the token holder's bank account details used by their last deposit. Send the amount of tokens being withdrawn as dollars from the issuer's bank account to the token holder's bank account. 

## 7. Token issuer liquidate all tokens
As the token issuer, get all the positive token holder balances. Then for each balance, redeem the balance and send a bank payment.

## 8. Reconcile total token supply to bank account balance
As the token issuser, the number of tokens on issue needs to be less than or equal to the dollars held in the bank account. This reconciliation report needs to be periodically run and exceptions raised.