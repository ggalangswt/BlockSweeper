import type { Pool } from "pg";

import type { GameSession, WeeklyLeaderboardEntry, WeeklyPlayerStats } from "./game.types.js";

export interface GameSessionRepository {
  create(session: GameSession): Promise<GameSession> | GameSession;
  findById(id: string): Promise<GameSession | null> | GameSession | null;
  update(session: GameSession): Promise<GameSession> | GameSession;
  getWeeklyLeaderboard(weekId: number): Promise<WeeklyLeaderboardEntry[]> | WeeklyLeaderboardEntry[];
  getWeeklyStats(walletAddress: string, weekId: number): Promise<WeeklyPlayerStats> | WeeklyPlayerStats;
}

export class InMemoryGameSessionRepository implements GameSessionRepository {
  private readonly sessions = new Map<string, GameSession>();

  create(session: GameSession) {
    this.sessions.set(session.id, session);
    return session;
  }

  findById(id: string) {
    return this.sessions.get(id) ?? null;
  }

  update(session: GameSession) {
    this.sessions.set(session.id, session);
    return session;
  }

  getWeeklyLeaderboard(weekId: number) {
    const rows = Array.from(this.sessions.values())
      .filter((session) => session.weekId === weekId)
      .reduce(
        (accumulator, session) => {
          const existing = accumulator.get(session.walletAddress) ?? {
            walletAddress: session.walletAddress,
            wins: 0,
            totalPlays: 0,
            lastPlayedAt: session.createdAt,
          };

          existing.totalPlays += 1;
          if (session.status === "won") {
            existing.wins += 1;
          }

          if (new Date(session.createdAt).getTime() > new Date(existing.lastPlayedAt).getTime()) {
            existing.lastPlayedAt = session.createdAt;
          }

          accumulator.set(session.walletAddress, existing);
          return accumulator;
        },
        new Map<
          string,
          Omit<WeeklyLeaderboardEntry, "rank">
        >(),
      );

    return Array.from(rows.values())
      .sort((left, right) => {
        if (right.wins !== left.wins) {
          return right.wins - left.wins;
        }

        if (new Date(left.lastPlayedAt).getTime() !== new Date(right.lastPlayedAt).getTime()) {
          return new Date(left.lastPlayedAt).getTime() - new Date(right.lastPlayedAt).getTime();
        }

        return left.walletAddress.localeCompare(right.walletAddress);
      })
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));
  }

  getWeeklyStats(walletAddress: string, weekId: number) {
    const sessions = Array.from(this.sessions.values()).filter(
      (session) => session.weekId === weekId && session.walletAddress.toLowerCase() === walletAddress.toLowerCase(),
    );

    const lastPlayedAt =
      sessions.length > 0
        ? sessions
            .map((session) => session.createdAt)
            .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0]
        : null;

    return {
      walletAddress,
      weekId,
      wins: sessions.filter((session) => session.status === "won").length,
      totalPlays: sessions.length,
      lastPlayedAt,
    };
  }
}

export class PostgresGameSessionRepository implements GameSessionRepository {
  constructor(private readonly pool: Pool) {}

  async create(session: GameSession) {
    await this.pool.query(
      `
        insert into public.game_sessions (
          id,
          wallet_address,
          tx_hash,
          week_id,
          status,
          created_at,
          finished_at,
          board_json,
          revealed_cell_keys,
          exploded_cell,
          finish_payload
        ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb)
      `,
      [
        session.id,
        session.walletAddress,
        session.txHash,
        session.weekId,
        session.status,
        session.createdAt,
        session.finishedAt,
        JSON.stringify(session.board),
        JSON.stringify(session.revealedCellKeys),
        JSON.stringify(session.explodedCell),
        JSON.stringify(session.finishPayload ?? null),
      ],
    );

    return session;
  }

  async findById(id: string) {
    const result = await this.pool.query(
      `
        select
          id,
          wallet_address,
          tx_hash,
          week_id,
          status,
          created_at,
          finished_at,
          board_json,
          revealed_cell_keys,
          exploded_cell,
          finish_payload
        from public.game_sessions
        where id = $1
        limit 1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapRowToGameSession(result.rows[0]);
  }

  async update(session: GameSession) {
    await this.pool.query(
      `
        update public.game_sessions
        set
          wallet_address = $2,
          tx_hash = $3,
          week_id = $4,
          status = $5,
          created_at = $6,
          finished_at = $7,
          board_json = $8::jsonb,
          revealed_cell_keys = $9::jsonb,
          exploded_cell = $10::jsonb,
          finish_payload = $11::jsonb
        where id = $1
      `,
      [
        session.id,
        session.walletAddress,
        session.txHash,
        session.weekId,
        session.status,
        session.createdAt,
        session.finishedAt,
        JSON.stringify(session.board),
        JSON.stringify(session.revealedCellKeys),
        JSON.stringify(session.explodedCell),
        JSON.stringify(session.finishPayload ?? null),
      ],
    );

    return session;
  }

  async getWeeklyLeaderboard(weekId: number) {
    const result = await this.pool.query<{
      rank: string;
      wallet_address: string;
      wins: string;
      total_plays: string;
      last_played_at: string;
    }>(
      `
        select
          row_number() over (
            order by wins desc, last_played_at asc, wallet_address asc
          ) as rank,
          wallet_address,
          wins,
          total_plays,
          last_played_at
        from public.weekly_leaderboard
        where week_id = $1
        order by rank asc
      `,
      [weekId],
    );

    return result.rows.map((row) => ({
      rank: Number(row.rank),
      walletAddress: row.wallet_address,
      wins: Number(row.wins),
      totalPlays: Number(row.total_plays),
      lastPlayedAt: new Date(row.last_played_at).toISOString(),
    }));
  }

  async getWeeklyStats(walletAddress: string, weekId: number) {
    const result = await this.pool.query<{
      wallet_address: string;
      wins: string;
      total_plays: string;
      last_played_at: string | null;
    }>(
      `
        select
          wallet_address,
          wins,
          total_plays,
          last_played_at
        from public.weekly_leaderboard
        where week_id = $1
          and lower(wallet_address) = lower($2)
        limit 1
      `,
      [weekId, walletAddress],
    );

    if (result.rowCount === 0) {
      return {
        walletAddress,
        weekId,
        wins: 0,
        totalPlays: 0,
        lastPlayedAt: null,
      };
    }

    const row = result.rows[0];
    return {
      walletAddress: row.wallet_address,
      weekId,
      wins: Number(row.wins),
      totalPlays: Number(row.total_plays),
      lastPlayedAt: row.last_played_at ? new Date(row.last_played_at).toISOString() : null,
    };
  }
}

function mapRowToGameSession(row: {
  id: string;
  wallet_address: string;
  tx_hash: string;
  week_id: number;
  status: GameSession["status"];
  created_at: string | Date;
  finished_at: string | Date | null;
  board_json: GameSession["board"] | string | null;
  revealed_cell_keys: GameSession["revealedCellKeys"] | string;
  exploded_cell: GameSession["explodedCell"] | string | null;
  finish_payload: GameSession["finishPayload"] | string | null;
}): GameSession {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    txHash: row.tx_hash,
    weekId: row.week_id,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    finishedAt: row.finished_at ? new Date(row.finished_at).toISOString() : null,
    board: parseJson<GameSession["board"]>(row.board_json),
    revealedCellKeys: parseJson<GameSession["revealedCellKeys"]>(row.revealed_cell_keys) ?? [],
    explodedCell: parseJson<GameSession["explodedCell"]>(row.exploded_cell),
    finishPayload: parseJson<GameSession["finishPayload"]>(row.finish_payload) ?? undefined,
  };
}

function parseJson<T>(value: T | string | null): T | null {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }

  return value as T;
}
