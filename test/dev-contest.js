var DevContest = artifacts.require('./DevContest.sol');
var MPToken = artifacts.require('./MPToken.sol');

contract('DevContest', function(accounts) {
  var contract;

  it("register should return true", function(){
    return DevContest.deployed().then(function(instance) {
      instance.registerSubmission("random string").then(function() {
          return instance.getUnapprovedSubmissionAddresses;
    }).then(function(addresses) {
      assert.equal(addresses.length, 0, "one");
    });
});


  //
  // }).then(function(instance) {
  //
  // }).then(function() {
  //   return contract.getUnapprovedSubmissionAddresses;
  // }).then(function(addresses) {
  //   assert.equal(addresses.count, 1, "should be 1 address");
  // });


  it("should assert true", function(done) {
    var contract = DevContest.deployed();
    assert.isTrue(true);
    done();
  });
});
