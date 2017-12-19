var DevContest = artifacts.require("./DevContest.sol");
var MPToken = artifacts.require("./MPToken.sol");

module.exports = function(deployer) {

  deployer.deploy(MPToken).then(function() {
    return deployer.deploy(DevContest, MPToken.address, 1431780, 1431900);
  });
};
