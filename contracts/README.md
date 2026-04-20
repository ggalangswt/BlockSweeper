# BlockSweeper Contracts

Foundry project for the onchain registry used by BlockSweeper.

## Scope

- record `play()` activity onchain
- expose weekly counters for backend/indexers
- support owner-controlled pause and upgrades

## Commands

```bash
forge build
forge test -vvv
forge script script/DeployBlockSweeperRegistry.s.sol:DeployBlockSweeperRegistry --rpc-url $RPC_URL_TESTNET --broadcast
```
