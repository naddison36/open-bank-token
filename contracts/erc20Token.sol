/*
A standard ERC20 compliant token

This software is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
See MIT Licence for further details.
<https://opensource.org/licenses/MIT>.
*/

pragma solidity ^0.4.18;

import {SafeMath} from './lib/safeMaths.sol';

contract ERC20Token
{
    using SafeMath for uint256;

/* State */
    // The Total supply of tokens
    uint256 totSupply;
    
    /// @return Token symbol
    string sym;
    string nam;

    uint8 public decimals = 0;
    
    // Token ownership mapping
    mapping (address => uint256) balances;
    
    // Allowances mapping
    mapping (address => mapping (address => uint256)) allowed;

    // constructor
    function ERC20Token(string tokenSymbol, string tokenName)
    {
        sym = tokenSymbol;
        nam = tokenName;
    }

/* Events */
    // Triggered when tokens are transferred.
    event Transfer(
        address indexed fromAddress,
        address indexed toAddress,
        uint256 amount);

    // Triggered whenever approve is called.
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 amount);

/* Funtions Public */

    function symbol() public view returns (string)
    {
        return sym;
    }

    function name() public view returns (string)
    {
        return nam;
    }
    
    // Using an explicit getter allows for function overloading    
    function totalSupply() public view returns (uint256)
    {
        return totSupply;
    }
    
    // Using an explicit getter allows for function overloading    
    function balanceOf(address holderAddress) public view returns (uint256 balance)
    {
        return balances[holderAddress];
    }
    
    // Using an explicit getter allows for function overloading    
    function allowance(address ownerAddress, address spenderAddress) public view returns (uint256 remaining)
    {
        return allowed[ownerAddress][spenderAddress];
    }
    
    // The transaction signer sends an amount of tokens to another address.
    function transfer(address toAddress, uint256 amount) public returns (bool success)
    {
        return xfer(msg.sender, toAddress, amount);
    }

    // An allowed third party sends an amount of tokens from one address to another
    function transferFrom(address fromAddress, address toAddress, uint256 amount) public returns (bool success)
    {
        allowed[fromAddress][msg.sender] = allowed[fromAddress][msg.sender].sub(amount);
        xfer(fromAddress, toAddress, amount);

        return true;
    }

    // Process a transfer internally.
    function xfer(address fromAddress, address toAddress, uint amount) internal returns (bool success)
    {
        balances[fromAddress] = balances[fromAddress].sub(amount);
        balances[toAddress] = balances[toAddress].add(amount);

        Transfer(fromAddress, toAddress, amount);
        return true;
    }

    // Approves a third-party spender
    function approve(address spender, uint256 amount) public returns (bool) {

        // To change the approve amount you first have to reduce the addresses`
        //  allowance to zero by calling `approve(_spender, 0)` if it is not
        //  already 0 to mitigate the race condition described here:
        //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        require((amount == 0) || (allowed[msg.sender][spender] == 0));

        allowed[msg.sender][spender] = amount;

        Approval(msg.sender, spender, amount);
        return true;
    }

    /**
    * approve should be called when allowed[_spender] == 0. To increment
    * allowed amount is better to use this function to avoid 2 calls (and wait until 
    * the first transaction is mined)
    * From MonolithDAO Token.sol
    */
    function increaseApproval (address spender, uint addedAmount) public returns (bool success)
    {
        allowed[msg.sender][spender] = allowed[msg.sender][spender].add(addedAmount);

        Approval(msg.sender, spender, allowed[msg.sender][spender]);
        return true;
    }

    function decreaseApproval (address spender, uint subtractedAmount) public returns (bool success)
    {
        uint oldAmount = allowed[msg.sender][spender];

        if (subtractedAmount > oldAmount) {
            allowed[msg.sender][spender] = 0;
        } else {
            allowed[msg.sender][spender] = oldAmount.sub(subtractedAmount);
        }

        Approval(msg.sender, spender, allowed[msg.sender][spender]);
        return true;
    }

    // do not accept Ether as fallback function is not payable
    function() {throw;}
}