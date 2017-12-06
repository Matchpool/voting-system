pragma solidity ^0.4.4;

contract MPToken {

    // ERC20 state
    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowances;
    uint256 public totalSupply;

    // Human state
    string public name;
    string public symbol;
    uint8 public decimals;
    string public version;

    // Events
    event Transfer (address indexed _from, address indexed _to, uint256 _value);
    event Approval (address indexed _owner, address indexed _spender, uint256 _value);

    function MPToken() {
      // constructor
      name = "Matchpool Token";
      symbol = "MPT";
      decimals = 18;
      version = "0.1";

      totalSupply = 1000000000;

      balances[msg.sender] = totalSupply;
    }

    function balanceOf(address _owner) constant returns (uint256 balance) {
      return balances[_owner];
    }

    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
      return allowances[_owner][_spender];
    }

    function transfer (address _to, uint256 _value) returns (bool success) {

      if(balances[msg.sender] < _value) revert();
      if(balances[_to] + _value < balances[_to]) revert();
      balances[msg.sender] -= _value;
      balances[_to] += _value;
      Transfer(msg.sender, _to, _value);
      return true;
    }

    function approve(address _spender, uint256 _value) returns (bool success) {
      allowances[msg.sender][_spender] = _value;
      Approval(msg.sender, _spender, _value);
      return true;
    }

    function transferFrom(address _owner, address _to, uint _value) returns (bool success) {

      if (balances[_owner] < _value) revert();
      if (balances[_to] + _value < balances[_to]) revert();
      if (allowances[_owner][msg.sender] < _value) revert();
      balances[_owner] -= _value;
      balances[_to] += _value;
      allowances[_owner][msg.sender] -= _value;
      Transfer(_owner, _to, _value);
      return true;
    }

    function() {
      revert();
    }
}
