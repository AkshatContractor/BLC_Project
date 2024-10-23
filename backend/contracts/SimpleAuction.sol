// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract SimpleAuction {
    address payable public auctioneer;
    uint public highestBid;
    address public highestBidder;
    uint public auctionEndTime;
    bool public auctionEnded;

    mapping(address => uint) private pendingReturns;

    event AuctionEnded(address indexed winner, uint amount);
    event HighestBidIncreased(address indexed bidder, uint amount);

    constructor(uint _biddingTime) {
        auctioneer = payable(msg.sender);
        auctionEndTime = block.timestamp + _biddingTime;
    }

    function bid() public payable {
        require(block.timestamp < auctionEndTime, "Auction already ended.");
        require(msg.value > highestBid, "There is already a higher bid.");

        // Refund the previously highest bidder
        if (highestBid != 0) {
            pendingReturns[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
        emit HighestBidIncreased(msg.sender, msg.value);
    }

    function withdraw() public returns (bool) {
        uint amount = pendingReturns[msg.sender];
        if (amount > 0) {
            // Reset the pending return before sending to prevent reentrancy attacks
            pendingReturns[msg.sender] = 0; 
            (bool success, ) = msg.sender.call{value: amount}("");
            if (!success) {
                pendingReturns[msg.sender] = amount; // Revert the state change if sending fails
                return false;
            }
        }
        return true;
    }

    function endAuction() public {
        require(block.timestamp >= auctionEndTime, "Auction not yet ended.");
        require(!auctionEnded, "Auction already ended.");

        auctionEnded = true;
        emit AuctionEnded(highestBidder, highestBid);

        auctioneer.transfer(highestBid);
    }
}
