// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract SimpleAuction {
    address payable public auctioneer;
    uint public highestBid;
    address public highestBidder;
    uint public auctionEndTime;
    bool public auctionEnded;

    mapping(address => uint) pendingReturns;

    event AuctionEnded(address winner, uint amount);
    event HighestBidIncreased(address bidder, uint amount);

    constructor(uint _biddingTime) {
        auctioneer = payable(msg.sender);
        auctionEndTime = block.timestamp + _biddingTime;
    }

    function bid() public payable {
        require(block.timestamp < auctionEndTime, "Auction already ended.");
        require(msg.value > highestBid, "There is already a higher bid.");

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
            pendingReturns[msg.sender] = 0;
            if (!payable(msg.sender).send(amount)) {
                pendingReturns[msg.sender] = amount;
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
