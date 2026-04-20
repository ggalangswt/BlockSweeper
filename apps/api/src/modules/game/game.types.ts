export type CellPosition = {
  row: number;
  col: number;
};

export type BoardCell = CellPosition & {
  isMine: boolean;
  adjacentMines: number;
};

export type BoardConfig = {
  rows: number;
  cols: number;
  mineCount: number;
};

export type GameBoard = {
  config: BoardConfig;
  cells: BoardCell[][];
};

export type GameStatus = "playing" | "won" | "lost";

export type GameSession = {
  id: string;
  walletAddress: string;
  txHash: string;
  weekId: number;
  createdAt: string;
  finishedAt: string | null;
  board: GameBoard;
  status: GameStatus;
  finishPayload?: FinishGameInput;
};

export type StartGameInput = {
  walletAddress: string;
  txHash: string;
  weekId: number;
};

export type FinishGameInput = {
  sessionId: string;
  status: Exclude<GameStatus, "playing">;
  revealedCells: CellPosition[];
  explodedCell?: CellPosition;
};
