pragma solidity ^0.4.11;

import "./SafeMath.sol";

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

  /// @title DevContest - Allows any existing ERC20 token contract to facilitate a contest with submissions and voting by staking tokens into the contract.
  /// @author Michael O'Rourke - <michael@pkt.network>

  using SafeMath for uint256;

  // Submissions must first get approved by contract owner to be voted on.
  struct Submission {
    address submitter;
    bool isApproved;
    bytes32 name;
    bytes desc;
    bytes32 url;
    uint256 id;
    uint256 votes;
  }

  /*
  * State variables
  */

  // Interface for interacting with an ERC20
  TokenInterface public token;

  address public owner;

  // Mappings of voter information
  mapping (address => uint256) public stakedAmount;
  mapping (address => uint256) public voteCount;
  mapping (address => bool) public hasVoted;
  // Mapping of where vote is
  mapping (address => address) public votedOn;

  // Mapping of whether address has submitted
  mapping (address => bool) public hasSubmitted;
  // Contract owner must manually screen and approve submissions
  mapping (address => Submission) public submissions;
  address[] public unapprovedSubmissions;
  address[] public approvedSubmissions;

  // Prize for winner
  uint256 public bounty;

  // Global keeping track of submissions
  uint256 public id;

  // Globals for deciding winner
  uint256 public highestVote;
  address public winningAddress;

  // Blocktimes for contest start
  uint256 public startBlock;
  uint256 public endBlock;

  /*
  * Events
  */

  event Staked(address indexed _from, uint256 _value);
  event StakeReleased(address indexed _from, uint256 _value);
  event SubmissionRegistered(address indexed owner);
  event SubmissionApproved(address indexed owner);
  event Voted(address indexed favoriteSubmission, address indexed who, uint256 amount);
  event RemovedVote(address indexed unfortunateSubmission, address indexed who, uint256 amount);

  function DevContest(address _tokenAddress, uint256 _startBlock, uint256 _endBlock) {
      owner = msg.sender;
      token = TokenInterface(_tokenAddress);
      startBlock = _startBlock;
      endBlock = _endBlock;
      // Set id to 1 to reject submissions not in approvedSubmissions
      id = 1;
  }

    /*
    * Submission functions
    */

    /// @dev Registers new submission that contract owner can approve
    /// @param _name of project submission
    /// @param _desc of project submission
    /// @param _url of project submission
    /// @return Success of submission register
    function registerSubmission (bytes32 _name, string _desc, bytes32 _url) returns (bool success){

      checkContestStatus();
      require(hasSubmitted[msg.sender] == false);

      Submission memory newSub;
      newSub.isApproved = false;
      newSub.submitter = msg.sender;
      newSub.name = _name;
      newSub.desc = _desc;
      newSub.url = _url;
      newSub.id = id;
      id += 1;

      submissions[msg.sender] = newSub;
      hasSubmitted[msg.sender] = true;
      unapprovedSubmissions.push(msg.sender);
      SubmissionRegistered(msg.sender);
      return true;
    }

    /// @dev Edit submission by submitter
    /// @param _name of project submission
    /// @param _desc of project submission
    /// @param _url of project submission
    /// @return Success of submission edit
    function editSubmission(bytes32 _name, string _desc, bytes32 _url) returns (bool success) {

      Submission sub = submissions[msg.sender];
      require(sub.submitter == msg.sender);
      sub.name = _name;
      sub.desc = _desc;
      sub.url = _url;
      return true;
    }

    /// @dev Contract owner approves submissions to be shown
    /// @param _subAddress of owner of submission to be approved
    /// @param _index of owner address in approvedSubmissions
    /// @return Success of approval
    function approveSubmission (address _subAddress, uint256 _index) returns (bool success) {

      require(owner == msg.sender);
      //require(unapprovedSubmissions.length > _index);

      Submission approvedSub = submissions[_subAddress];

      // Cannot add same submission twice
      require(approvedSub.isApproved == false);
      require(approvedSub.id == _index);
      require(approvedSub.id != 0);
      approvedSub.isApproved = true;
      approvedSubmissions.push(_subAddress);
      SubmissionApproved(_subAddress);
      return true;
    }

  /*
  * Staking functions
  */

  /// @dev Stakes ERC20 compatible token into contract. Must call 'approve' on current token contract first.
  /// @param _amount Desired amount to stake in contract
  /// @return Success of stake
  function stake(uint256 _amount) returns (bool success) {

    checkContestStatus();
    // get contract's allowance
    uint256 allowance = token.allowance(msg.sender, this);
    // do not continue if allowance is less than amount sent
    require(allowance >= _amount);
    token.transferFrom(msg.sender, this, _amount);
    stakedAmount[msg.sender] = stakedAmount[msg.sender].add(_amount);
    Staked(msg.sender, _amount);
    return true;
  }

  /// @dev Releases stake of ERC20 compatible token back to user by calling `transfer`.
  /// @param _amount Desired amount to transfer from contract
  /// @return Success of release
  function releaseStake(uint256 _amount) returns (bool success) {
    require(hasVoted[msg.sender] == false);
    require(_amount <= stakedAmount[msg.sender]);
    stakedAmount[msg.sender] = stakedAmount[msg.sender].sub(_amount);
    token.transfer(msg.sender, _amount);
    StakeReleased(msg.sender, _amount);
    return true;
  }

  /*
  * Voting functions
  */

  /// @dev vote for favorite submissions
  /// @param _favoriteSubmission of approved submissions participant wishes to vote for
  /// @return Success of vote
  function vote(address _favoriteSubmission) returns (bool success) {

    require(stakedAmount[msg.sender] > 0);
    require(hasVoted[msg.sender] == false);

    Submission approvedSub = submissions[_favoriteSubmission];

    voteCount[msg.sender] = stakedAmount[msg.sender];
    approvedSub.votes = approvedSub.votes.add(stakedAmount[msg.sender]);
    hasVoted[msg.sender] = true;
    votedOn[msg.sender] = _favoriteSubmission;
    Voted(_favoriteSubmission, msg.sender, stakedAmount[msg.sender]);
    return true;
  }

  /// @dev remove vote from submission
  /// @param _unfortunateSubmission address of approved submission participant wishes to remove vote for
  /// @return success of vote removal
  function removeVote(address _unfortunateSubmission) returns (bool success) {
    require(stakedAmount[msg.sender] > 0);
    require(hasVoted[msg.sender] == true);
    require(votedOn[msg.sender] == _unfortunateSubmission);

    Submission approvedSub = submissions[_unfortunateSubmission];

    approvedSub.votes = approvedSub.votes.sub(voteCount[msg.sender]);
    voteCount[msg.sender] = 0;
    hasVoted[msg.sender] = false;
    votedOn[msg.sender] = address(0x0);
    RemovedVote(_unfortunateSubmission, msg.sender, stakedAmount[msg.sender]);
    return true;
  }

  /*
  * Owner functions
  */

  /// @dev Add bounty for contest winner. Contract owner must approve amount to be transferred
  /// @param _amount of bounty to be added
  function addBounty(uint256 _amount) {
    require(owner == msg.sender);

    uint256 allowance = token.allowance(msg.sender, this);
    require(allowance >= _amount);

    bounty = bounty.add(_amount);
    token.transferFrom(msg.sender, this, _amount);
  }

  function completeContest() {
    require(hasContestStarted());
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
    token.transfer(winningAddress, bounty);
    bounty = 0;
  }

  /*
  * Helper functions
  */

  function hasContestStarted() private constant returns (bool) {
    // Check if global block.number is greater than or equal to start block and return result
    return block.number >= startBlock;
  }

  function hasContestEnded() private constant returns (bool) {
    // Return only greater than result because crowdsale goes until the endblock
    return block.number > endBlock;
  }

  function checkContestStatus() {
    if (!hasContestStarted()) revert();
    if (hasContestEnded()) revert();
  }

  function getUnapprovedSubmissionAddresses() constant returns (address[] submissions) {
    return unapprovedSubmissions;
  }

  function getApprovedSubmissionAddresses() constant returns (address[] submissions) {
    return approvedSubmissions;
  }
}
