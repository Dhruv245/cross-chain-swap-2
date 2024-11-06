// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract CPAMM {
    IERC20 public immutable mytToken;
    address public owner;

    uint256 public ethReserve;    
    uint256 public mytReserve;       
    uint256 public constant EXCHANGE_RATE = 1000; 

    constructor(address _mytToken) {
        mytToken = IERC20(_mytToken);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    function swapEthForMYT() external payable returns (uint256 mytAmountOut) {
        require(msg.value > 0, "Must send ETH to swap");

        mytAmountOut = (msg.value * EXCHANGE_RATE) / 1 ether;
        require(mytToken.balanceOf(address(this)) >= mytAmountOut, "Insufficient MYT liquidity");

        mytToken.transfer(msg.sender, mytAmountOut);

        ethReserve += msg.value;
        mytReserve -= mytAmountOut;
    }

    function addMytLiquidity(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than zero");
        mytToken.transferFrom(msg.sender, address(this), _amount);
        mytReserve += _amount;
    }

    function withdrawETH() external onlyOwner {
        uint256 ethBalance = address(this).balance;
        require(ethBalance > 0, "No ETH to withdraw");

        (bool success, ) = owner.call{value: ethBalance}("");
        require(success, "ETH withdrawal failed");

        ethReserve = 0; 
    }

    function getReserves() external view returns (uint256 ethReserveAmount, uint256 mytReserveAmount) {
        return (ethReserve, mytReserve);
    }
}

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}