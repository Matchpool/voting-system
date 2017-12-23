# Development Challenge contract

Contract meant to plug into any existing ERC20 token that wants to incentivize crowdsourced development for their platform. Participants register their submission and the contract owner approves it. Token holders stake their token into the contract and vote for their favorite submission with their stake.

## Rules

- Must call `approve` on token contract before staking
- Contract owner sets the bounty and timeframe for challenge
- No split votes (entire staked amount goes to choice)
- Staked vote gets revoked if removed from contract

## Questions

- What if there's a 2+ tie with votes?

## TODOs

- edit submission
- cancel (return everything)

## Interesting additions

- tournament style
- mechanism like dash (reward people voting for winner)
