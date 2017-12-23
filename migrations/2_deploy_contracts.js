var DevContest = artifacts.require("./DevContest.sol");
var MPToken = artifacts.require("./MPToken.sol");

module.exports = function(deployer) {

  deployer.deploy(MPToken).then(function() {
    return deployer.deploy(DevContest, MPToken.address, 0, 1471900);
  });

  //deployer.deploy(DevContest, "0x2db92ac0132e12084082714d0133abee6d7e4d0e", 0, 1471900)
};
