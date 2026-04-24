# BlockSweeper API

The API persists game sessions, guarantees a first-click-safe opening, validates completed runs, and serves weekly leaderboard and wallet stats.

## Responsibilities

- create a session after an onchain `play()` transaction
- persist the generated board and session state in PostgreSQL
- process the first reveal so the stored board remains first-click-safe
- validate `won` and `lost` payloads submitted by the frontend
- expose weekly leaderboard and per-wallet stats

## Runtime Endpoints

- `POST /game/start`
- `POST /game/reveal`
- `POST /game/finish`
- `GET /game/leaderboard?weekId=<id>`
- `GET /game/stats/:walletAddress?weekId=<id>`
- `GET /game/:sessionId`

## Scripts

```bash
pnpm --filter api dev
pnpm --filter api build
pnpm --filter api test
```

## Environment

Copy [apps/api/.env.example](/home/kurohitam/code/BlockSweeper/apps/api/.env.example) to `apps/api/.env` and fill in:

```env
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

For hosted deployments, use a production connection string that your platform can reach. Railway uses the compiled output from `apps/api/dist`.

## Database Setup

Run the SQL in [db/schema.sql](/home/kurohitam/code/BlockSweeper/apps/api/db/schema.sql) inside Supabase SQL Editor.

That schema creates:

- `public.game_sessions`
- `public.weekly_leaderboard`

## Validation Notes

- The backend is the source of truth for persisted board state.
- The first reveal is routed through `/game/reveal` so a mined opening cell can be regenerated into a safe one.
- Winning payloads must reveal all safe cells.
- Losing payloads must include a valid mined `explodedCell` and may only reveal safe cells.

## Testing

- Runtime uses PostgreSQL through `pg`.
- Automated tests use the in-memory repository so API tests stay fast and deterministic.
- Weekly ranking is derived from the persisted session data and exposed through `weekly_leaderboard`.
