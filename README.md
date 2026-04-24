# BlockSweeper

BlockSweeper is a MiniPay-first, onchain puzzle game built on Celo. Players pay for a run onchain, play a fast Minesweeper-style board in the browser, and compete on a weekly leaderboard backed by a lightweight API and Postgres session store.

## Monorepo Layout

- `apps/web`: React + Vite frontend for MiniPay and injected wallets
- `apps/api`: Fastify API for sessions, validation, leaderboard, and stats
- `contracts`: Foundry project for the onchain `BlockSweeperRegistry`
- `packages/shared`: reserved workspace package for future shared types and helpers

## Current Gameplay Flow

1. The player signs an onchain `play(weekId)` transaction on Celo.
2. The frontend creates a backend session with `POST /game/start`.
3. The first reveal is synced through the API so the persisted board is always first-click-safe.
4. After the first reveal, gameplay runs locally in the frontend for instant tile interaction.
5. When the run ends, the frontend submits the result to `POST /game/finish` and the backend validates it before updating weekly stats.

## Stack

- Frontend: React 18, Vite, TypeScript, Wagmi, Viem
- Backend: Fastify, Zod, PostgreSQL (`pg`), Vitest
- Contracts: Solidity, Foundry, OpenZeppelin UUPS proxy pattern
- Infra: Vercel (web), Railway (API), Supabase Postgres (data)

## Local Development

Install dependencies from the repo root:

```bash
pnpm install
```

Run the frontend:

```bash
pnpm dev:web
```

Run the API:

```bash
pnpm dev:api
```

Build targets:

```bash
pnpm build:web
pnpm build:api
```

Run backend tests:

```bash
pnpm test:api
```

## Environment Files

- Frontend: [apps/web/.env.example](/home/kurohitam/code/BlockSweeper/apps/web/.env.example)
- API: [apps/api/.env.example](/home/kurohitam/code/BlockSweeper/apps/api/.env.example)
- Contracts: [contracts/.env.example](/home/kurohitam/code/BlockSweeper/contracts/.env.example)

## Deployment Notes

- The frontend targets **Celo Mainnet** when `VITE_BLOCKSWEEPER_REGISTRY_CELO` is set.
- If that value is empty, the frontend falls back to **Celo Sepolia** through `VITE_BLOCKSWEEPER_REGISTRY_CELO_SEPOLIA`.
- The API is designed to work behind Railway and expects a PostgreSQL connection string.
- Contract deployments are managed from the Foundry project in [`contracts`](/home/kurohitam/code/BlockSweeper/contracts).
