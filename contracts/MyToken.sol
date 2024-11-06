// SPDX-License-Identifier: MIT

pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {EquitoApp} from "https://github.com/equito-network/equito-evm-contracts/src/EquitoApp.sol";
import {bytes64, EquitoMessage, EquitoMessageLibrary} from "https://github.com/equito-network/equito-evm-contracts/src/libraries/EquitoMessageLibrary.sol";

/// @title EquitoERC20
/// @notice This contract implements a cross-chain ERC20 token that can be
///         transferred between different blockchains using the Equito protocol.
contract EquitoERC20 is EquitoApp, ERC20 {
     event PingSent(
        uint256 indexed destinationChainSelector,
        bytes32 messageHash
    );
       event PingReceived(
        uint256 indexed sourceChainSelector,
        bytes32 messageHash
    );
      event PongSent(
        uint256 indexed destinationChainSelector,
        bytes32 messageHash
    );
       event PongReceived(
        uint256 indexed sourceChainSelector,
        bytes32 messageHash
    );
    error InvalidMessageType();

    
    uint public COOLDOWN_PERIOD = 5 hours;

    mapping (address => uint) public lastWithdraw;

    constructor(
        address _router,
        string memory name,
        string memory symbol,
        uint256 supply
    ) EquitoApp(_router) ERC20(name, symbol) {
        _mint(msg.sender, supply);
    }

    /// @notice Sends a cross-chain message using Equito.
    /// @param receiver The address of the receiver on the destination chain.
    /// @param destinationChainSelector The identifier of the destination chain.
    /// @param amount The amount of tokens to send.
    function crossChainTransfer(
        bytes64 calldata receiver,
        uint256 destinationChainSelector,
        uint256 amount
    ) external payable {
        _burn(msg.sender, amount);
        bytes memory data = abi.encode("ping", receiver, amount);
        bytes32 messageHash = router.sendMessage{value: msg.value}(
            getPeer(destinationChainSelector),
            destinationChainSelector,
            data
        );

        emit PingSent(destinationChainSelector, messageHash);
    }

    /// @notice Receives a cross-chain message from a peer.
    ///         Mints the appropriate amount of tokens to the receiver address.
    /// @param message The Equito message received.
    /// @param messageData The data of the message received.
    function _receiveMessageFromPeer(
        EquitoMessage calldata message,
        bytes calldata messageData
    ) internal override {
        
        (string memory messageType ,bytes64 memory receiver, uint256 payload) = abi.decode(
            messageData,
            (string,bytes64, uint256)
        );
        _mint(EquitoMessageLibrary.bytes64ToAddress(receiver), payload);
        

        if (keccak256(bytes(messageType)) == keccak256(bytes("ping"))) {
            emit PingReceived(
                message.sourceChainSelector,
                keccak256(abi.encode(message))
            );

            // send pong
            bytes memory data = abi.encode("pong", payload);
            bytes32 messageHash = router.sendMessage{value: msg.value}(
                peers[message.sourceChainSelector],
                message.sourceChainSelector,
                data
            );
            emit PongSent(message.sourceChainSelector, messageHash);
        } else if (keccak256(bytes(messageType)) == keccak256(bytes("pong"))) {
            emit PongReceived(
                message.sourceChainSelector,
                keccak256(abi.encode(message))
            );
        } else {
            revert InvalidMessageType();
        }
    }

    function transferToken() public {
        require(lastWithdraw[msg.sender] + COOLDOWN_PERIOD < block.timestamp, "Withdraw Cooldown");
        uint256 amount = 5;
        require(balanceOf(address(this)) >= amount, "Not enough tokens in contract");
        _transfer(address(this), msg.sender, amount);
        lastWithdraw[msg.sender] = block.timestamp;
    }
}