/**
 *Submitted for verification at sepolia.basescan.org on 2025-05-12
*/

// SPDX-License-Identifier: MIT

// File YOURDEXFaucet.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract YOURDEXFaucet {
    IERC20 public YOURDEX;
    address public owner;
    
    uint256 public amountPerRequest = 1000 * 10**18; // 1,000 YOUR DEX tokens
    uint256 public requestCooldown = 1 days;
    
    mapping(address => uint256) public lastRequestTime;
    
    event TokensDispensed(address indexed to, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _YOURDEX) {
        YOURDEX = IERC20(_YOURDEX);
        owner = msg.sender;
    }
    
    function requestTokens() external {
        require(block.timestamp >= lastRequestTime[msg.sender] + requestCooldown, "Too soon since last request");
        require(YOURDEX.balanceOf(address(this)) >= amountPerRequest, "Faucet empty");
        
        lastRequestTime[msg.sender] = block.timestamp;
        require(YOURDEX.transfer(msg.sender, amountPerRequest), "Transfer failed");
        
        emit TokensDispensed(msg.sender, amountPerRequest);
    }
    
    function setAmountPerRequest(uint256 _amount) external onlyOwner {
        amountPerRequest = _amount;
    }
    
    function setRequestCooldown(uint256 _cooldown) external onlyOwner {
        requestCooldown = _cooldown;
    }
    
    function withdrawTokens(uint256 _amount) external onlyOwner {
        require(YOURDEX.transfer(msg.sender, _amount), "Transfer failed");
    }
}