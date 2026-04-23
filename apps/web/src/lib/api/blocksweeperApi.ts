import { env } from "../../env";

export type CellPosition = {
  row: number;
  col: number;
};

export type ApiBoardCell = CellPosition & {
  adjacentMines: number;
};

export type ApiBoard = {
  rows: number;
  cols: number;
  mineCount: number;
  cells: Array<
    CellPosition & {
      adjacentMines: number;
      isMine: boolean;
    }
  >;
};

export type StartGameRequest = {
  walletAddress: string;
  txHash: string;
  weekId: number;
};

export type StartGameResponse = {
  sessionId: string;
  walletAddress: string;
  txHash: string;
  weekId: number;
  status: "playing";
  board: ApiBoard;
  createdAt: string;
};

export type FinishGameRequest = {
  sessionId: string;
  status: "won" | "lost";
  revealedCells: CellPosition[];
  explodedCell?: CellPosition;
};

export type FinishGameResponse = {
  sessionId: string;
  walletAddress: string;
  txHash: string;
  weekId: number;
  status: "won" | "lost";
  finishedAt: string;
  revealedSafeCells: number;
  explodedCell: CellPosition | null;
};

export type RevealCellsRequest = {
  sessionId: string;
  cells: CellPosition[];
};

export type RevealCellsResponse = {
  sessionId: string;
  status: "playing" | "won" | "lost";
  board: ApiBoard;
  revealedCells: ApiBoardCell[];
  explodedCell: CellPosition | null;
  mineCells: CellPosition[];
  finishedAt: string | null;
};

export type LeaderboardEntry = {
  rank: number;
  walletAddress: string;
  wins: number;
  totalPlays: number;
  lastPlayedAt: string;
};

export type LeaderboardResponse = {
  weekId: number;
  entries: LeaderboardEntry[];
};

export type WeeklyStatsResponse = {
  walletAddress: string;
  weekId: number;
  wins: number;
  totalPlays: number;
  lastPlayedAt: string | null;
};

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; details?: unknown; issues?: unknown }
    | T
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export function startGame(requestPayload: StartGameRequest) {
  return request<StartGameResponse>("/game/start", {
    method: "POST",
    body: JSON.stringify(requestPayload),
  });
}

export function finishGame(requestPayload: FinishGameRequest) {
  return request<FinishGameResponse>("/game/finish", {
    method: "POST",
    body: JSON.stringify(requestPayload),
  });
}

export function revealCells(requestPayload: RevealCellsRequest) {
  return request<RevealCellsResponse>("/game/reveal", {
    method: "POST",
    body: JSON.stringify(requestPayload),
  });
}

export function getLeaderboard(weekId: number) {
  return request<LeaderboardResponse>(`/game/leaderboard?weekId=${weekId}`);
}

export function getWeeklyStats(walletAddress: string, weekId: number) {
  return request<WeeklyStatsResponse>(`/game/stats/${walletAddress}?weekId=${weekId}`);
}
