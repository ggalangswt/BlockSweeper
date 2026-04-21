# BlockSweeper API

Backend MVP untuk:

- start game session setelah transaksi `play()`
- generate board Minesweeper server-side
- validate hasil `win/lose`
- simpan session ke Supabase Postgres

## Scripts

```bash
pnpm --filter api dev
pnpm --filter api build
pnpm --filter api test
```

## Environment

Copy `apps/api/.env.example` ke `apps/api/.env` lalu isi:

```env
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## Supabase Schema

Jalankan isi file berikut di Supabase SQL Editor:

- [db/schema.sql](/home/kurohitam/code/BlockSweeper/apps/api/db/schema.sql)

Schema ini membuat:

- tabel `public.game_sessions`
- view `public.weekly_leaderboard`

## Notes

- runtime utama backend sekarang memakai Postgres via `pg`
- test tetap memakai in-memory repository supaya cepat dan tidak butuh DB
- leaderboard mingguan nanti bisa dihitung dari view `weekly_leaderboard`
