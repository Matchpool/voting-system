"use strict"
/* For this version of web3 the general idea for calling a method is:
      Contract.methodName(param1, param2,..., {from: what_msg.sender_will_be}, callback)
*/

// TODO
// Modal centering and padding (for stake gup and submit) (maybe release stake button highlight)
// Clock up to minutes
// Modal x button and Ok
// Border on owner panel to quickly identify approved and unapproved proposals
// try catch e alert display error
// If not on metamask network display error page



/* Promise wrapper using currying */
const promisify = (inner) =>
    new Promise((resolve, reject) =>
        inner((err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })
    )

function timeRemaining(delta) {
  // calculate (and subtract) whole days
  const days = Math.floor(delta / 86400)
  delta -= days * 86400

  // calculate (and subtract) whole hours
  const hours = Math.floor(delta / 3600) % 24
  delta -= hours * 3600

  // calculate (and subtract) whole minutes
  const minutes = Math.floor(delta / 60) % 60
  delta -= minutes * 60

  // what's left is seconds
  const seconds = delta % 60
  $('#time').html( days + " : " +
                        hours + " : " +
                        minutes + " : " +
                        seconds + " - ")
}

async function blocksRemaining() {
  // get current block number
  const current = promisify(cb => web3.eth.getBlockNumber(cb))

  // get the end block
  const end = promisify(cb => DevContest.endBlock(cb))

  const remaining = await end - await current
  $('#remaining').html(remaining)

  // calculate time by multiplying remaining amount of blocks
  // with an averaged constant represent time it takes to mine a block
  timeRemaining(remaining * 15)
}

/* Get the balances from the contracts and display them on the UI */
async function loadBalances() {
  const supply = await promisify(cb => MPToken.balanceOf(userAccount, cb))
  const lockedstake = await promisify(cb => DevContest.stakedAmount(userAccount, cb))
  const allowance = await promisify(cb => MPToken.allowance(userAccount, CONTEST_ADDRESS, cb))
  const bounty = await promisify(cb => DevContest.bounty(cb))
  try {
    $('#supply').html(supply['c'][0])
    $('#lockedstake').html(lockedstake['c'][0])
    $('#allowance').html(allowance['c'][0])
    if(allowance['c'][0] == 0) {
      $("#stake").prop( "disabled", true )
    }
    if(allowance['c'][0] > 0) {
      $('#allowance').attr('style','color: #37DCD8')
      $(".modal-content .col-12").attr('style','color: #37DCD8')
    }
    $('#displaybounty').html(bounty['c'][0])
  } catch (error) {
    console.log(error)
  }
}

/* Load Approved Submissions From DevContest Contract */
async function loadApprovedSubmissions() {
  const getApprovedSubmissionAddresses = await promisify(cb => DevContest.getApprovedSubmissionAddresses(cb))
  const hasVoted = await promisify(cb => DevContest.hasVoted(userAccount, cb))
  const votedOn = await promisify(cb => DevContest.votedOn(userAccount, cb))

  // Message when no proposals exist
  if(getApprovedSubmissionAddresses.length == 0) $("#vote-content div.container").append(`No approved proposals exist yet`)

  // Otherwise populate UI with proposals
  for(let i = 0; i < getApprovedSubmissionAddresses.length; i++) {
      const proposal = await promisify(cb => DevContest.submissions(getApprovedSubmissionAddresses[i], cb))
      const address = proposal['0']
      const isApproved = proposal['1']
      const name = web3.toUtf8(proposal['2'])
      const description = web3.toUtf8(proposal['3'])
      const url = web3.toUtf8(proposal['4'])
      const id = proposal['5']
      const votes = proposal['6']
      createApprovedSubmissionsFromLoop(i, name, description, url, hasVoted, id, address, votedOn)
  }

  // Call appropriate voting functionality
  $('button[id^="buttonVote"]').click(function() {
    const thisId = $(this).attr('id').match(/\d+$/)[0]
    const thisAddress = $("#approvedProposal" + thisId).attr('class')
    if(hasVoted) {
      removeVote(thisAddress)
    } else {
      vote(thisAddress)
    }
  })
}

/* Load Unapproved Submissions From DevContest Contract */
async function loadUnapprovedSubmissions() {
  const owner = await promisify(cb => DevContest.owner(cb))
  const getUnapprovedSubmissionAddresses = await promisify(cb => DevContest.getUnapprovedSubmissionAddresses(cb))

  if(userAccount == owner) {
    createOwnerNav()

    // Owner specific functionality for increasing bounty and completion of the contest
    $('#buttonAddBounty').click(() => addBounty())
    $('#buttonCompleteContest').click(() => completeContest())

    // Message when no proposals exist
    if(getUnapprovedSubmissionAddresses.length == 0) $("#reset-content div.container").append(`No proposals exist yet`)

    // Otherwise populate UI with proposals
    for(let i = 0; i < getUnapprovedSubmissionAddresses.length; i++) {
        const proposal = await promisify(cb => DevContest.submissions(getUnapprovedSubmissionAddresses[i], cb))
        const address = proposal['0']
        const isApproved = proposal['1']
        const name = web3.toUtf8(proposal['2'])
        const description = web3.toUtf8(proposal['3'])
        const url = web3.toUtf8(proposal['4'])
        const id = proposal['5']
        const votes = proposal['6']
        createUnapprovedSubmissionsFromLoop(i, name, description, isApproved, url, id, votes, address)
    }

    // Approve functionality
    $('button[id^="buttonApprove"]').click(function() {
      const thisId = $(this).attr('id').match(/\d+$/)[0]
      const thisAddress = $("#unapprovedProposal" + thisId).attr('class')
      approveSubmission(thisAddress, thisId)
    })
  }
}

/* Determine whether to create or edit a submission */
async function handleSubmission() {
  const submission = await promisify(cb => DevContest.submissions(userAccount, cb))
  const hasSubmitted = await promisify(cb => DevContest.hasSubmitted(userAccount, cb))

  if(userAccount == submission[0]) {
    const proposal = await promisify(cb => DevContest.submissions(submission[0], cb))
    const name = web3.toUtf8(proposal['2'])
    const description = web3.toUtf8(proposal['3'])
    const url = web3.toUtf8(proposal['4'])
    $('#submit').html('EDIT PROPOSAL')
    $('#validationCustom01').attr('value', name)
    $('#validationCustom02').html(description)
    $('#validationCustom03').attr('value', url)
  }
  /* Submitting a proposal */
  $('#buttonRegister').click(() => {
    if(!hasSubmitted && $('#validationCustom01').val().length != 0 && $('#validationCustom01').val().length <= 32
    && $('#validationCustom02').val().length >= 32 && $('#validationCustom02').val().length <= 256
    && $('#validationCustom03').val().length != 0 && $('#validationCustom03').val().length <= 32) {
      registerSubmission()
    } else if($('#validationCustom01').val().length != 0 && $('#validationCustom01').val().length < 32
    && $('#validationCustom02').val().length >= 32 && $('#validationCustom02').val().length <= 256
    && $('#validationCustom03').val().length != 0 && $('#validationCustom03').val().length <= 32) {
      editSubmission()
    }
  })
}

/* Functions for creating dom elements on page via jQuery to clean code up a bit */
function createOwnerNav() {
  $('<a />')
      .text('OWNER PANEL')
      .attr('href', '#reset-content')
      .attr('class', "nav-item nav-link")
      .attr('data-toggle', 'pill')
      .attr('role', 'tab')
      .attr('aria-controls', 'reset-content')
      .attr('aria-selected', 'false')
      .attr('id', 'reset')
      .appendTo('#sidenav-inner')

  const div_row = $('<div/>')
    .attr('class', 'row')
    .appendTo("#reset-content div.container")
  const div_col5_empty = $('<div/>')
    .attr('class', 'col-5')
    .appendTo(div_row)
  const div_col4 = $('<div/>')
    .attr('class', 'col-4')
    .appendTo(div_row)
  const div_col2 = $('<div/>')
    .appendTo(div_row)
  const div_col1_empty = $('<div/>')
    .attr('class', 'col-1')
    .appendTo(div_row)
  const div_input_group = $('<div/>')
    .attr('class', "input-group mb-3")
    .attr('style',"padding-bottom: 60px;")
    .appendTo(div_col4)
  const div_input_group_prepend = $('<div/>')
    .attr('class', "input-group-prepend")
    .appendTo(div_input_group)
  const input = $('<input/>')
    .attr('type', 'text')
    .attr('id', 'bounty')
    .attr('class', 'form-control')
    .attr('aria-describedby', 'basic-addon1')
    .appendTo(div_input_group)
  const button1 = $('<button/>')
    .text("ADD BOUNTY:")
    .attr('class', "btn btn-secondary")
    .attr('id', 'buttonAddBounty')
    .attr('type', 'button')
    .appendTo(div_input_group_prepend)
  const button2 = $('<button/>')
    .text("COMPLETE PAYOUT")
    .attr('class', "btn btn-secondary")
    .attr('id', 'buttonCompleteContest')
    .attr('type', 'button')
    .appendTo(div_col2)
}

function createUnapprovedSubmissionsFromLoop(i, name, description, isApproved, url, id, votes, address) {
  if(i % 2 == 0) {
    let div_row_i = $('<div/>')
      .attr('class', 'row dumb'+i)
      .appendTo("#reset-content div.container")
  }

  const div_col5 = $('<div/>')
    .attr('class', 'col-5')
    .attr('style', 'padding-bottom: 40px;')
    .appendTo(`#reset-content div.container div.row.dumb` + (i%2 == 0 ? i : i-1))
  const div_col1_empty = $('<div/>')
    .attr('class', 'col-1')
    .attr('style', 'max-width: 4%')
    .appendTo(`#reset-content div.container div.row.dumb` + (i%2 == 0 ? i : i-1))

  const div_d_flex_column = $('<div/>')
    .attr('class', "d-flex flex-column")
    .appendTo(div_col5)
  const div_d_flex1 = $('<div/>')
    .text(name.toUpperCase())
    .attr('style', 'padding-bottom: 20px; font-family:Josefin Sans;font-weight:700; font-size:1.1rem;')
    .appendTo(div_d_flex_column)

  const div_d_flex2 = $('<div/>')
    .text(description)
    .attr('style', 'word-break: break-word;padding-bottom: 12px; font-family:Josefin Sans;font-weight:300; color: #818182; font-size:0.8rem;text-align:justify;')
    .appendTo(div_d_flex_column)

  const div_d_flex3 = $('<div/>')
    .text(url)
    .attr('style', 'padding-bottom: 12px;')
    .appendTo(div_d_flex_column)

  const div_d_flex4 = $('<div/>')
    .appendTo(div_d_flex_column)
  const ul = $('<ul/>')
    .attr('class', 'list-group')
    .appendTo(div_d_flex4)
  const li_address = $('<li/>')
    .text("ADDRESS: ")
    .attr('class', 'list-group-item')
    .appendTo(ul)
  const span_address = $('<span/>')
    .text(address)
    .appendTo(li_address)
  const li_status = $('<li/>')
    .text("APPROVAL STATUS: ")
    .attr('class', 'list-group-item')
    .appendTo(ul)
  const span_status = $('<span/>')
    .text(isApproved)
    .appendTo(li_status)
  const li_id = $('<li/>')
    .text("PROPOSAL ID: ")
    .attr('class', 'list-group-item')
    .appendTo(ul)
  const span_id = $('<span/>')
    .text(id)
    .appendTo(li_id)
  const li_votes = $('<li/>')
    .text("VOTES: ")
    .attr('class', 'list-group-item')
    .appendTo(ul)
  const span_votes = $('<span/>')
    .text(votes)
    .appendTo(li_votes)

  if(!isApproved) {
    const button = $('<button/>')
      .text("APPROVE")
      .attr('type', 'button')
      .attr('id', "buttonApprove" + id)
      .attr('class', "btn btn-secondary")
      .attr('style', "float:right;")
      .appendTo(div_col5)

    const div_buttonInfo = $('<div/>')
      .attr('id',"unapprovedProposal"+id)
      .attr('class',address)
      .appendTo(div_col5)
  }
}

function createApprovedSubmissionsFromLoop(i, name, description, url, hasVoted, id, address, votedOn) {
  if(i % 2 == 0) {
    let div_row_i = $('<div/>')
      .attr('class', 'row dupe'+i)
      .appendTo("#vote-content div.container")
  }

  const div_col5 = $('<div/>')
    .attr('class', 'col-5')
    .appendTo(`#vote-content div.container div.row.dupe` + (i%2 == 0 ? i : i-1))
  const div_col1_empty = $('<div/>')
    .attr('class', 'col-1')
    .attr('style', 'max-width: 4%')
    .appendTo(`#vote-content div.container div.row.dupe` + (i%2 == 0 ? i : i-1))

  const div_d_flex_column = $('<div/>')
    .attr('class', "d-flex flex-column")
    .appendTo(div_col5)

  const div_d_flex1 = $('<div/>')
    .text(name.toUpperCase())
    .attr('style', 'font-family:Josefin Sans;font-weight:700; font-size:1.1rem;')
    .appendTo(div_d_flex_column)

  const div_d_flex2 = $('<div/>')
    .attr('style', 'margin-top: -50px;')
    .appendTo(div_d_flex_column)
  const idea_img = $('<img/>')
    .attr('style', 'float:right;')
    .attr('height',"16%")
    .attr('src',"imgs/idea.png")
    .appendTo(div_d_flex2)

  const div_d_flex3 = $('<div/>')
    .text(description)
    .attr('style', 'word-break: break-word;padding-bottom: 12px; font-family:Josefin Sans;font-weight:300; color: #818182; font-size:0.8rem;text-align:justify;')
    .appendTo(div_d_flex_column)

  const div_d_flex4 = $('<div/>')
    .text(url)
    .attr('style', 'color: #37DCD8;')
    .appendTo(div_d_flex_column)

  const div_d_flex5 = $('<div/>')
    .appendTo(div_d_flex_column)
  if(!hasVoted) {
    const button = $('<button/>')
      .text("VOTE")
      .attr('style','float:right; padding: 10px 25px 10px 25px')
      .attr('type', 'button')
      .attr('id', "buttonVote" + id)
      .attr('class', "btn btn-secondary")
      .appendTo(div_d_flex5)

    const div_buttonInfo = $('<div/>')
      .attr('id',"approvedProposal"+id)
      .attr('class',address)
      .appendTo(div_d_flex5)
  } else if(address == votedOn){
    const button = $('<button/>')
      .text("REMOVE VOTE")
      .attr('style','float:right; padding: 12px 22px 12px 22px')
      .attr('type', 'button')
      .attr('id', "buttonVote" + id)
      .attr('class', "btn btn-warning")
      .appendTo(div_d_flex5)

    const div_buttonInfo = $('<div/>')
      .attr('id',"approvedProposal"+id)
      .attr('class',address)
      .appendTo(div_d_flex5)
  }
}

async function completeContest() {
  try {
    await promisify(cb => DevContest.completeContest({from: userAccount}, cb))
  } catch(err) {
    alert("An error occurred while completing the contest:\r\n"+err.toString())
  }
}

async function addBounty() {
  try {
    await promisify(cb => DevContest.addBounty($('#bounty').val(), {from: userAccount}, cb))
  } catch(err) {
    alert("An error occurred while adding to the bounty:\r\n"+err.toString())
  }
}

async function vote(address) {
  try {
    await promisify(cb => DevContest.vote(address, {from: user}, cb))
  } catch(err) {
    alert("An error occurred while voting for the submission:\r\n"+err.toString())
  }
}

async function removeVote(address) {
  try {
    await promisify(cb => DevContest.removeVote(address, {from: userAccount}, cb))
  } catch(err) {
    alert("An error occurred while removing the vote for the submission:\r\n"+err.toString())
  }
}

async function approveSubmission(address, id) {
  try {
    await promisify(cb => DevContest.approveSubmission(address, id, {from: userAccount}, cb))
  } catch(err) {
    alert("An error occurred while approving the submission:\r\n"+err.toString())
  }
}

async function approve() {
  try {
    await promisify(cb => MPToken.approve(CONTEST_ADDRESS, $('#approveInput').val(), {from: userAccount}, cb))
  } catch (err) {
    alert("An error occurred approving the allowance:\r\n"+err.toString())
  }
}

async function stake() {
  try {
    await promisify(cb => DevContest.stake($('#approveInput').val(), {from: userAccount}, cb))
  } catch (err) {
    alert("An error occurred while staking:\r\n"+err.toString())
  }
}

async function releaseStake() {
  try {
    await promisify(cb => DevContest.releaseStake($('#approveInput').val(), {from: userAccount}, cb))
  } catch (err) {
    alert("An error occurred while releasing the stake:\r\n"+err.toString())
  }
}

async function registerSubmission() {
  try {
    await promisify(cb => DevContest.registerSubmission($('#validationCustom01').val(),
                                  $('#validationCustom02').val(),
                                  $('#validationCustom03').val(),
                                  {from: userAccount}, cb))
  } catch (err) {
    alert("An error occurred while registering the submission:\r\n"+err.toString())
  }
}

async function editSubmission() {
  try {
    await promisify(cb => DevContest.editSubmission($('#validationCustom01').val(),
                                  $('#validationCustom02').val(),
                                  $('#validationCustom03').val(),
                                  {from: userAccount}, cb))
  } catch (err) {
    alert("An error occurred while editing the submission:\r\n"+err.toString())
  }
}

function validateAllowance() {
  $("#approveCb").prop( "disabled", true )

  $('#approveInput').keyup(() => {
    if($(this).val() != '') {
      $('#approveCb').prop('disabled', false)
    } else {
      $('#approveCb').prop('checked', false) // Unchecks it
      $("#approveCb").prop( "disabled", true )
    }
  })
}


/* Approving an allowance */
$('#approveCb').click(() => approve())

/* Staking */
$('#stake').click(() => stake())

/* Release Stake */
$('#buttonRelease').click(() => releaseStake())

/***** Call all the necessary code *****/
// Only these functions can auto-update problem free
setInterval(() => {
  loadBalances()
  blocksRemaining()
}, 1000)

// Call these once on load
validateAllowance()
handleSubmission()
loadApprovedSubmissions()
loadUnapprovedSubmissions()
