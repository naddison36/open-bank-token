

var Contract = eth.contract([{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"toAddress","type":"address"},{"name":"amount","type":"uint256"},{"name":"externalId","type":"string"},{"name":"bankTansactionIdentifier","type":"string"}],"name":"deposit","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"withdrawalCounter","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"fromAddress","type":"address"},{"name":"toAddress","type":"address"},{"name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"tokenHolder","type":"address"}],"name":"isTokenHolder","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"holderAddress","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"confirmationNumber","type":"uint256"}],"name":"isConfirmedWithdrawal","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"bankTransactionId","type":"string"}],"name":"isBankTransactionId","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"requestWithdrawal","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_owner","type":"address"}],"name":"changeOwner","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"toAddress","type":"address"},{"name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"ownerAddress","type":"address"},{"name":"spenderAddress","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"withdrawalNumber","type":"uint256"}],"name":"confirmWithdrawal","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"inputs":[{"name":"tokenSymbol","type":"string"},{"name":"toeknName","type":"string"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"toAddress","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"externalId","type":"string"},{"indexed":false,"name":"reason","type":"string"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"withdrawalNumber","type":"uint256"},{"indexed":true,"name":"fromAddress","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"RequestWithdrawal","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"withdrawalNumber","type":"uint256"}],"name":"ConfirmWithdrawal","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}]);
var contract = Contract.at('0x54eeE155bB97E6bd05a6C01473417c7733121beF'); // Geth dev
// var contract = Contract.at(''); // Parity dev
//var contract = Contract.at(''); // mainnet

function displayProperties() {
    console.log('Token at address ' + contract.address +
    ' has symbol ' + contract.symbol() +
    ' has name ' + contract.name() +
    ' and total supply ' + contract.totalSupply())
}

function displayBalances() {
  // for each account
  eth.accounts.forEach(function(account) {
    console.log(account +
      "\t tokens: " + contract.balanceOf(account) + 
      "\t eth: " + web3.fromWei(eth.getBalance(account), "ether") + 
      "\t isTokenHolder: " + contract.isTokenHolder(account) );
  });
}

function deposit(toAddress, amount, meetupId, bankTansactionIdentifier) {
    web3.eth.defaultAccount = eth.accounts[1];
    contract.deposit(toAddress, amount, meetupId, bankTansactionIdentifier);
}

deposit('0x8ae386892b59bd2a7546a9468e8e847d61955991', 12, 'externalId', '001');

contract.isTokenHolder('0x8Ae386892b59bD2A7546a9468E8e847D61955991');

var accountPassword = 'OpenBankToken';

function unlockAllAccounts() {
    eth.accounts.forEach(function(address) {
        personal.unlockAccount(address, accountPassword, 0);
    });
}

function transferEthToAll() {
  eth.accounts.forEach(function(account, i) {
    eth.sendTransaction({from:eth.accounts[0], to:eth.accounts[i], value: web3.toWei(10, "ether")})
  })
}

//eth.sendTransaction({from:eth.accounts[0], to:eth.accounts[3], value: web3.toWei(100, "ether")})
//eth.getTransactionReceipt('0xc5a930a4d4aef2525f9ce5d63e3c6a206400dae070394766de86bb43269dfc50');
