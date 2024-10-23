const SimpleAuction = artifacts.require("SimpleAuction");

module.exports = function (deployer) {
  const auctionDuration = 300; // 5 minutes
  deployer.deploy(SimpleAuction, auctionDuration);
};
