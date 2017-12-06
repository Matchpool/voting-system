var DevContest = artifacts.require("./DevContest.sol");
var MPToken = artifacts.require("./MPToken.sol");

module.exports = function(deployer) {
  deployer.deploy(DevContest);
  deployer.deploy(MPToken);
};
