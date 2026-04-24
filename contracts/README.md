# BlockSweeper Contracts

This Foundry project contains the onchain registry that records paid runs for BlockSweeper on Celo.

## Contract Scope

- record `play(weekId)` activity onchain
- expose weekly totals and per-player counts for app logic and indexing
- support owner-controlled pause/unpause
- support UUPS upgrades behind an `ERC1967Proxy`

## Main Contract

- `src/BlockSweeperRegistry.sol`

The expected user-facing entrypoint is the **proxy address**, not the implementation address.

## Environment

Copy [contracts/.env.example](/home/kurohitam/code/BlockSweeper/contracts/.env.example) to `contracts/.env`:

```env
PRIVATE_KEY=0x
RPC_URL_TESTNET=https://forno.celo-sepolia.celo-testnet.org
RPC_URL_MAINNET=https://forno.celo.org
CELOSCAN_API_KEY=
```

## Commands

Build:

```bash
forge build
```

Run tests:

```bash
forge test -vvv
```

Deploy to Celo Sepolia:

```bash
forge script script/DeployBlockSweeperRegistry.s.sol:DeployBlockSweeperRegistry \
  --rpc-url "$RPC_URL_TESTNET" \
  --broadcast -vvvv
```

Deploy to Celo Mainnet:

```bash
forge script script/DeployBlockSweeperRegistry.s.sol:DeployBlockSweeperRegistry \
  --rpc-url "$RPC_URL_MAINNET" \
  --broadcast -vvvv
```

## Verification

Once deployed, verify the implementation and proxy on Celoscan using `forge verify-contract` and your `CELOSCAN_API_KEY`.

## Notes

- `foundry.toml` already exposes both `celo` and `celo_sepolia` RPC aliases through env variables.
- The frontend selects Mainnet when `VITE_BLOCKSWEEPER_REGISTRY_CELO` is set, otherwise it falls back to the Sepolia registry address.
