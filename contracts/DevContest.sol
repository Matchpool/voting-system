pragma solidity ^0.4.11;

// TokenInterface allows DevContest contract to call approve function from erc20 tokens
contract TokenInterface {
  function totalSupply() constant returns (uint256 totalSupply) {}
  function balanceOf(address _owner) constant returns (uint256 balance) {}
  function transfer(address _recipient, uint256 _value) returns (bool success) {}
  function transferFrom(address _from, address _recipient, uint256 _value) returns (bool success) {}
  function approve(address _spender, uint256 _value) returns (bool success) {}
  function allowance(address _owner, address _spender) constant returns (uint256 remaining) {}
}

contract DevContest {

  /// @title DevContest - Allows any existing ERC20 token contract to facilitate a contest with submissions and voting with the token's stake.
  /// @author Michael O'Rourke - <michael@pkt.network>

  struct Submission {
    address submissionOwner;
    bool isApproved;
    string url;
    uint256 id;
    uint256 votes;
  }

  address public owner;
  // Mapping of address staking => staked amount
  mapping (address => uint256) public stakedAmount;
  // Mapping of address to Submission struct
  mapping (address => Submission) public submissions;

  // Contract owner must manually screen and approve submissions
  address[] public unapprovedSubmissions;
  address[] public approvedSubmissions;

  //
  uint256 public idCount;

  event Staked(address indexed _from, uint256 _value);
  event StakeReleased(address indexed _from, uint256 _value);

  function DevContest() {
      owner = msg.sender;
  }
  /*
  * Staking functions
  */

  /// @dev Stakes ERC20 compatible token into contract. Must call 'approve' on current token contract first.
  /// @param _tokenAddress address of ERC20 token
  /// @param amount Desired amount to stake in contract
  /// @return
  function stake(address _tokenAddress, uint256 amount) returns (bool) {
    TokenInterface token = TokenInterface(_tokenAddress);

    // get contract's allowance
    uint256 allowance = token.allowance(msg.sender, this);
    // do not continue if allowance is less than amount sent
    require(allowance >= amount);

    token.transferFrom(msg.sender, this, amount);
    stakedAmount[msg.sender] += amount;
    Staked(msg.sender, amount);

    return true;
  }

  /// @dev Releases stake of ERC20 compatible token back to user by calling `transfer`.
  /// @param _tokenAddress address of ERC20 token
  /// @param amount Desired amount to transfer from contract
  function releaseStake(address _tokenAddress, uint256 amount) returns (bool) {
    // Check that amount is less or = to current staked amount
    require(amount <= stakedAmount[msg.sender]);
    TokenInterface token = TokenInterface(_tokenAddress);

    stakedAmount[msg.sender] -= amount;
    token.transfer(msg.sender, amount);
    StakeReleased(msg.sender, amount);
    return true;
  }

  /*
  * Submission functions
  */

  /// @dev Registers new submission that contract owner can approve.
  /// @param url Link to project submission
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
    require(unapprovedSubmissions.length > _index);

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

  function vote(address _address) {
    require(stakedAmount[msg.sender] > 0);

    Submission approvedSub = submissions[_address];
    //set to zero
    approvedSub.votes = 0;
    // add new amount
    approvedSub.votes += stakedAmount[msg.sender];
  }

  function removeVote(address _address) {
    require(stakedAmount[msg.sender] > 0);

    Submission approvedSub = submissions[_address];
    //set to zero
    approvedSub.votes = 0;
  }

  function addBounty() {
    
  }
}

// TESTRPC SHORTCUTS
/*
DevContest.deployed().then(function(i) {voting = i})
MPToken.deployed().then(function(i) {token = i})
token.approve(voting.address, 100)
voting.stake(token.address, 10)
sender = web3.eth.accounts[0]
voting.registerSubmission("test")
voting.getUnapprovedSubmissionAddresses()
voting.approveSubmission("address", 0)
voting.vote("address")

*/
