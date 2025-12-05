// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.20;

import "@fhevm/solidity/contracts/TFHE.sol";
import "hardhat/console.sol";

contract BlindAuction {
    euint32 private highestBid;
    euint256 private highestBidder; // Encrypted address of the winner
    address public owner;
    bool public stopped;

    // The winner and winning bid, revealed after auction ends
    address public winnerAddress;
    uint32 public winningBidAmount;

    constructor() {
        owner = msg.sender;
        TFHE.setPermissions(msg.sender); // Allow owner to interact with encrypted state if needed
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyActive() {
        require(!stopped, "Auction stopped");
        _;
    }

    // Bid with an encrypted amount
    // input is a ciphertext (bytes) representing a uint32
    function bid(bytes calldata encryptedAmount) public onlyActive {
        euint32 bidAmount = TFHE.asEuint32(encryptedAmount);
        
        // Check if the new bid is strictly greater than the current highest
        ebool isNewHighest = TFHE.gt(bidAmount, highestBid);

        // Update highest bid: if isNewHighest, take bidAmount, else keep highestBid
        highestBid = TFHE.select(isNewHighest, bidAmount, highestBid);

        // Update highest bidder: if isNewHighest, take msg.sender, else keep highestBidder
        // We convert msg.sender (address) to uint256 to store it as an encrypted integer
        euint256 bidderAsInt = TFHE.asEuint256(uint256(uint160(msg.sender)));
        highestBidder = TFHE.select(isNewHighest, bidderAsInt, highestBidder);
        
        // Allow the bidder to see their own bid (optional, for debugging/verification)
        TFHE.allow(bidAmount, msg.sender);
        TFHE.allow(isNewHighest, msg.sender);
    }

    // Stop the auction
    function stop() public onlyOwner {
        stopped = true;
    }

    // Reveal the winner (only owner can trigger this in this simple version)
    // In a real app, this might use a Gateway for async decryption
    function reveal() public onlyOwner {
        require(stopped, "Auction must be stopped");

        // Decrypt the highest bid and bidder
        // Note: In production, use Gateway.requestDecryption(). 
        // For local testing/devnet, TFHE.decrypt() might be available depending on network config.
        winningBidAmount = TFHE.decrypt(highestBid);
        uint256 winnerInt = TFHE.decrypt(highestBidder);
        winnerAddress = address(uint160(winnerInt));
    }
}
