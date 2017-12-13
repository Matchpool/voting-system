var DevContest = artifacts.require("./DevContest.sol");
var MPToken = artifacts.require("./MPToken.sol");


contract('DevContest', function(accounts) {

  var token;
  var contest;
  var sender = accounts[0];


  before(function() {
    return MPToken.new().then(function(instance){
       token = instance;
    });
});

before(function() {
  return DevContest.new().then(function(instance){
     contest = instance;
  });
});

  it("should have tokens", function() {
    return token.balanceOf(sender).then(function(balance) {
      assert.equal(balance.toNumber(), 1000000000, "more than zero");
    });
  });

  it("should register", function() {
    contest.registerSubmission("http://woo.com");
  }).then(function() {
    return contest.getUnapprovedSubmissionAddresses().then(function(addresses) {
        return addresses.length.then(function(length) {
          assert.equal(length, 0, "one");
        });
      });
    });


  //
  // }).then(function(addresses) {
  //   return addresses.length;
  // }).then(function(length) {
  //   assert.equal(length, 0, "one");
  // });

  it("should assert true", function(done) {
    var dev_contest = DevContest.deployed();
    assert.isTrue(true);
    done();
  });
});
