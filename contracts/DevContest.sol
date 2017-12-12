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
  mapping (address => uint256) public voterCount;
  mapping (address => bool) public hasVoted;

  //mapping (address => Voter) public voters;
  // Mapping of address to Submission struct
  mapping (address => Submission) public submissions;
  // Contract owner must manually screen and approve submissions
  address[] public unapprovedSubmissions;
  address[] public approvedSubmissions;

  uint256 public bounty;
  uint256 public idCount;

  uint256 public highestVote;
  address public winningAddress;

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
  /// @return Success of stake
  function stake(address _tokenAddress, uint256 amount) returns (bool success) {
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
  /// @return Success of release
  function releaseStake(address _tokenAddress, uint256 amount) returns (bool success) {
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
  /// @param _url Link to project submission
  /// @return Success of submission register
  function registerSubmission (string _url) returns (bool success){

    Submission memory newSub;
    newSub.submissionOwner = msg.sender;
    newSub.isApproved = false;
    newSub.url = _url;
    newSub.id = idCount;
    idCount += 1;

    submissions[msg.sender] = newSub;
    unapprovedSubmissions.push(msg.sender);
    return true;
  }

  /// @dev Contract owner approves submissions to be shown
  /// @param _address of owner of submission to be approvedSub
  /// @param _index of owner address in approvedSubmissions
  /// @return Success of approval
  function approveSubmission (address _address, uint256 _index) returns (bool success) {

    require(owner == msg.sender);
    require(unapprovedSubmissions.length > _index);

    Submission approvedSub = submissions[_address];
    approvedSub.isApproved = true;
    approvedSubmissions.push(_address);
    delete unapprovedSubmissions[_index];
    return true;
  }

  function getUnapprovedSubmissionAddresses() constant returns (address[] submissions) {
    return unapprovedSubmissions;
  }

  function getApprovedSubmissionAddresses() constant returns (address[] submissions) {
    return approvedSubmissions;
  }

  /*
  * Voting functions
  */

  /// @dev vote for favorite submissions
  /// @param _address of approved submission account wishes to vote for
  /// @return Success of vote
  function vote(address _address) returns (bool success) {

    require(stakedAmount[msg.sender] > 0);
    require(hasVoted[msg.sender] == false);

    Submission approvedSub = submissions[_address];

    voterCount[msg.sender] = stakedAmount[msg.sender];
    approvedSub.votes += stakedAmount[msg.sender];
    hasVoted[msg.sender] = true;
    return true;
  }

  /// @dev remove vote from submission
  /// @param _address of approved submission account wishes to remove vote for
  /// @return success of vote removal
  function removeVote(address _address) returns (bool success) {
    require(stakedAmount[msg.sender] > 0);
    require(hasVoted[msg.sender] == true);

    Submission approvedSub = submissions[_address];

    approvedSub.votes -= voterCount[msg.sender];
    voterCount[msg.sender] = 0;
    hasVoted[msg.sender] = false;
    return true;
  }

  // Contract owner must approve amount to be transferred
  function addBounty(address _tokenAddress, uint256 amount) {
    require(owner == msg.sender);

    TokenInterface token = TokenInterface(_tokenAddress);
    // get contract's allowance
    uint256 allowance = token.allowance(msg.sender, this);
    // do not continue if allowance is less than amount sent
    require(allowance >= amount);
    bounty += amount;
    token.transferFrom(msg.sender, this, amount);
  }

  function completeContest(address _tokenAddress) {

    require(owner == msg.sender);

    uint256 subCount = approvedSubmissions.length;

    for (uint8 i= 0; i<subCount; i+=1 ) {
      address subAddress = approvedSubmissions[i];
      Submission sub = submissions[subAddress];

      //need to deal with tie case
      if(sub.votes > highestVote) {
        highestVote = 0;
        highestVote += sub.votes;
        winningAddress = subAddress;
      }
    }

    payout();
  }

  function payout() internal {
    /*TokenInterface token = TokenInterface(_tokenAddress);
    // get contract's allowance
    uint256 allowance = token.allowance(msg.sender, this);
    // do not continue if allowance is less than amount sent
    require(allowance >= amount);
    bounty += amount;
    token.transferFrom(msg.sender, this, amount);*/
  }
}

// TESTRPC SHORTCUTS
/*
DevContest.deployed().then(function(i) {voting = i})
MPToken.deployed().then(function(i) {token = i})
token.approve(voting.address, 100)
voting.stake(token.address, 10)
sender = web3.eth.accounts[0]
voting.registerSubmission("http://woot.com", "Woot project")
voting.getUnapprovedSubmissionAddresses()
sub = addr
voting.approveSubmission(sub, 0)
voting.vote(sub)

*/
