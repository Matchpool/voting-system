/* Web3 Setup */
var Web3 = require('web3');

/* Create web3 for Metamask interaction */
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

/* Contract and Events */
let DevContestContract = web3.eth.contract(ABI);
let MPTokenContract = web3.eth.contract(TOKEN_ABI);
let DevContest = DevContestContract.at(ADDRESS);
let MPToken = MPTokenContract.at(TOKEN_ADDRESS);

/* Log to console current block number */
web3.eth.getBlockNumber(function(error, result){ console.log("CURRENT BLOCK NUMBER:" + result) });

/* Attempt to refresh balance but not yet working well */
function getBalance(){
  MPToken.balanceOf(web3.eth.accounts[0], function(error,result) {
    $('#supply').html(result['c'][0] + " GUP");
  });
}
getBalance();

/* If owner: display the appropriate navigation menu,
  Must run before the toggle script */
DevContest.owner(function(e,r){
  if(web3.eth.accounts[0] == r){
    console.log("OWNER CONFIRMED");
    $('#sidenav-inner').append(`
    <a class="nav-item nav-link" data-toggle="pill" href="#reset-content" role="tab" aria-controls="reset-content" aria-selected="false" id="reset">OWNER PANEL</a>`);
  }

  $("#reset").click(function(e,r) {
    DevContest.getUnapprovedSubmissionAddresses(function(error, result) {
      console.log(result.length);
      for(let i = 0; i < result.length; i++){

        DevContest.submissions(result[0],function(e,r){
          console.log(r);
          // submission details
          var address = r['0'];
          var isApproved = r['1'];
          var name = web3.toUtf8(r['2']);
          var description = web3.toUtf8(r['3']);
          var url = web3.toUtf8(r['4']);
          var id = r['5'];
          var votes = r['6'];
          $("#reset-content").html(`
          <strong>Address:</strong> ` + address + `<br>
          <strong>Approval Status:</strong> `+ isApproved + `<br>
          <strong>Proposal Name:</strong> ` + name + `<br>
          <strong>Proposal Description:</strong> ` + description + `<br>
          <strong>Proposal URL:</strong> ` + url + `<br>
          <strong>Proposal ID:</strong> ` + id + `<br>
          <strong>Votes:</strong> ` + votes + `<br>`);
        });

      }

    });
  });
});



  // let StakedEvent = DevContest.Staked();
  // StakedEvent.watch(function(error, result){
  //   if(!error) {
  //     console.log(result.args._from);
  //     console.log(result.args._value);
  //   } else {
  //     console.log("ERROR");
  //   }
  // });



/* Contract methods binded to buttons on main page */

/* For this version of web3 the general idea for calling a method is:
      Contract.methodName(param1, param2,..., {from: what_msg.sender_will_be}, callback);
*/
$('#buttonTokenApprove').click(function(error, result) {
  MPToken.approve(ADDRESS, $('#submission').val(), {from: web3.eth.accounts[0]}, function(error, result) {
    console.log(result);
  });
  console.log("CLICKED APPROVE");
});

$('#buttonTokenTransfer').click(function(error, result) {
  MPToken.transfer($('#submissionAddress').val(), $('#submission').val(), {from: web3.eth.accounts[0]}, function(error, result) {
    console.log(result);
    location.reload();
  });
  console.log("CLICKED APPROVE");
});


$('#buttonStake').click(function(error, result) {
  DevContest.stake($('#submission').val(), {from: web3.eth.accounts[0]}, function(error, result) {
    console.log(result);
  });
  console.log("CLICKED STAKE");

});

$('#buttonRelease').click(function(error, result) {
  DevContest.releaseStake($('#submission').val(), {from: web3.eth.accounts[0]}, function(error, result) {
    console.log(result);
  });
  console.log("CLICKED RELEASE STAKE");
});

$('#buttonRegister').click(function(error, result) {
  if($('#validationCustom01').val().length != 0 && $('#validationCustom01').val() != 0 && $('#validationCustom01').val() != 0) {
    DevContest.registerSubmission($('#validationCustom01').val(),
                                  $('#validationCustom02').val(),
                                  $('#validationCustom03').val(),
                                  {from: web3.eth.accounts[0]}, function(error, result) {
      console.log(result);
    });
  }
  console.log("CLICKED REGISTER SUBMISSION");
});

$('#buttonApprove').click(function(error, result) {
  DevContest.approveSubmission($('#submissionAddress').val(), $('#submission').val(), {from: web3.eth.accounts[0]}, function(error, result) {
    console.log(result);
  });
  console.log("CLICKED APPROVE SUBMISSION");
});

$('#buttonGetUn').click(function(error, result) {
  DevContest.getUnapprovedSubmissionAddresses(function(error, result) {
    console.log(result);
  });
  console.log("CLICKED GET UNAPPROVED SUBMISSIONS");
});

$('#buttonGetAp').click(function(error, result) {
  DevContest.getApprovedSubmissionAddresses(function(error, result) {
    console.log(result);
  });
  console.log("CLICKED GET APPROVED SUBMISSIONS");
});

$('#buttonVote').click(function(error, result) {
  DevContest.vote($('#submissionAddress').val(), {from: web3.eth.accounts[0]}, function(error, result) {
    console.log(result);
  });
  console.log("CLICKED VOTE");
});

$('#buttonRemVote').click(function(error, result) {
  DevContest.removeVote($('#submissionAddress').val(), {from: web3.eth.accounts[0]}, function(error, result) {
    console.log(result);
  });
  console.log("CLICKED REMOVE VOTE");
});

$('#buttonAddBounty').click(function(error, result) {
  DevContest.addBounty($('#submission').val(), {from: web3.eth.accounts[0]}, function(error, result) {
    console.log(result);
  });
  console.log("CLICKED ADD BOUNTY");
});

$('#buttonCompleteContest').click(function(error, result) {
  DevContest.completeContest({from: web3.eth.accounts[0]}, function(error, result) {
    console.log(result);
  });
  console.log("CLICKED COMPLETE CONTEST");
});
