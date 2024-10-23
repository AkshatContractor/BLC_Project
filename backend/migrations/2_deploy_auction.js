const SimpleAuction = artifacts.require("SimpleAuction");

module.exports = function (deployer) {
  const auctionDuration = 600; // 5 minutes
  deployer.deploy(SimpleAuction, auctionDuration);
};
