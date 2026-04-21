create table if not exists public.game_sessions (
  id text primary key,
  wallet_address text not null check (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  tx_hash text not null check (tx_hash ~ '^0x[a-fA-F0-9]{64}$'),
  week_id integer not null check (week_id > 0),
  status text not null check (status in ('playing', 'won', 'lost')),
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  board_json jsonb,
  revealed_cell_keys jsonb not null default '[]'::jsonb,
  exploded_cell jsonb,
  finish_payload jsonb
);

create index if not exists game_sessions_week_id_idx on public.game_sessions (week_id);
create index if not exists game_sessions_wallet_week_idx on public.game_sessions (wallet_address, week_id);
create index if not exists game_sessions_status_idx on public.game_sessions (status);
create index if not exists game_sessions_created_at_idx on public.game_sessions (created_at desc);
create index if not exists game_sessions_tx_hash_idx on public.game_sessions (tx_hash);

create or replace view public.weekly_leaderboard as
select
  week_id,
  wallet_address,
  count(*) filter (where status = 'won') as wins,
  count(*) as total_plays,
  max(coalesce(finished_at, created_at)) as last_played_at
from public.game_sessions
group by week_id, wallet_address;
