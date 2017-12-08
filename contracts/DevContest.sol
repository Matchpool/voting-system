pragma solidity ^0.4.11;

contract TokenInterface {
  function totalSupply() constant returns (uint256 totalSupply) {}
  function balanceOf(address _owner) constant returns (uint256 balance) {}
  function transfer(address _recipient, uint256 _value) returns (bool success) {}
  function transferFrom(address _from, address _recipient, uint256 _value) returns (bool success) {}
  function approve(address _spender, uint256 _value) returns (bool success) {}
  function allowance(address _owner, address _spender) constant returns (uint256 remaining) {}
}

contract DevContest {

  struct Submission {
    address submissionOwner;
    bool isApproved;
    string url;
    uint256 id;
  }

  address public owner;
  // Mapping of address staking => staked amount
  mapping (address => uint256) public stakedAmount;
  mapping (address => Submission) public submissions;

  address[] public unapprovedSubmissions;
  address[] public approvedSubmissions;

  uint256 public idCount;

  event Staked(address indexed _from, uint256 _value);
  event StakeReleased(address indexed _from, uint256 _value);

  function DevContest() {
      owner = msg.sender;
  }

  function stake(address _tokenAddress, uint256 amount) {
    //address user = msg.sender;
    TokenInterface token = TokenInterface(_tokenAddress);

    // get contract's allowance
    uint256 allowance = token.allowance(msg.sender, this);
    // do not continue if allowance is less than amount sent
    require(allowance >= amount);

    token.transferFrom(msg.sender, this, amount);
    stakedAmount[msg.sender] += amount;
    Staked(msg.sender, amount);
  }

  function releaseStake(address _tokenAddress, uint256 amount) {
    // Check that amount is less or = to current staked amount
    require(amount <= stakedAmount[msg.sender]);
    TokenInterface token = TokenInterface(_tokenAddress);

    stakedAmount[msg.sender] -= amount;
    token.transfer(msg.sender, amount);
    StakeReleased(msg.sender, amount);
  }

  function registerSubmission (string _url) {

    Submission memory newSub;
    newSub.submissionOwner = msg.sender;
    newSub.isApproved = false;
    newSub.url = _url;
    newSub.id = idCount;
    idCount += 1;

    submissions[msg.sender] = newSub;
    unapprovedSubmissions.push(msg.sender);

  }

  function approveSubmission (address _address, uint256 _index) {

    require(owner == msg.sender);
    require(unapprovedSubmissions.length < _index);

    Submission approvedSub = submissions[_address];
    approvedSub.isApproved = true;
    approvedSubmissions.push(_address);
    delete unapprovedSubmissions[_index];
  }

  function getUnapprovedSubmissionAddresses() constant returns (address[] submissions) {
    return unapprovedSubmissions;
  }

  function getApprovedSubmissionAddresses() constant returns (address[] submissions) {
    return approvedSubmissions;
  }

  function vote() {

  }

  /*function getUnapprovedSubmissionsCount() constant returns (uint count) {
    return unapprovedSubmissions.length;
  }

  function getApprovedSubmissionsCount() constant returns (uint count) {
    return unapprovedSubmissions.length;
  }*/

  /*function getApprovedSubmission(uint index) constant returns (Submission sub) {
    return approvedSubmissions[index];
  }*/
}


/*DevContest.deployed().then(function(i) {voting = i})
MPToken.deployed().then(function(i) {token = i})
token.approve(voting.address, 100)
voting.stake(token.address, 10)
sender = web3.eth.accounts[0]*/
