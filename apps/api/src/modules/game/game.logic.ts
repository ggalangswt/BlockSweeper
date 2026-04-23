import { randomUUID } from "node:crypto";

import { HttpError } from "../../lib/http-error.js";
import type {
  BoardCell,
  BoardConfig,
  CellPosition,
  FinishGameInput,
  GameBoard,
  RevealCellsInput,
} from "./game.types.js";

export function createSessionId() {
  return randomUUID();
}

export function createBoard(config: BoardConfig, safePosition?: CellPosition): GameBoard {
  const totalCells = config.rows * config.cols;
  if (config.mineCount >= totalCells) {
    throw new HttpError(500, "Invalid board configuration");
  }

  const forbiddenIndex =
    safePosition !== undefined ? safePosition.row * config.cols + safePosition.col : undefined;

  const cells: BoardCell[][] = Array.from({ length: config.rows }, (_, row) =>
    Array.from({ length: config.cols }, (_, col) => ({
      row,
      col,
      isMine: false,
      adjacentMines: 0,
    })),
  );

  const mineIndexes = new Set<number>();
  while (mineIndexes.size < config.mineCount) {
    const index = Math.floor(Math.random() * totalCells);
    if (index === forbiddenIndex) {
      continue;
    }
    mineIndexes.add(index);
  }

  for (const index of mineIndexes) {
    const row = Math.floor(index / config.cols);
    const col = index % config.cols;
    cells[row][col].isMine = true;
  }

  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      if (cells[row][col].isMine) {
        continue;
      }

      cells[row][col].adjacentMines = getNeighborPositions({ row, col }, config).filter(
        ({ row: neighborRow, col: neighborCol }) => cells[neighborRow][neighborCol].isMine,
      ).length;
    }
  }

  return { config, cells };
}

export function createSafeFirstClickBoard(config: BoardConfig, safePosition: CellPosition) {
  return createBoard(config, safePosition);
}

export function getNeighborPositions(position: CellPosition, config: BoardConfig) {
  const neighbors: CellPosition[] = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const nextRow = position.row + rowOffset;
      const nextCol = position.col + colOffset;

      if (nextRow < 0 || nextRow >= config.rows || nextCol < 0 || nextCol >= config.cols) {
        continue;
      }

      neighbors.push({ row: nextRow, col: nextCol });
    }
  }

  return neighbors;
}

export function revealCellsForSession(
  board: GameBoard,
  currentlyRevealedKeys: string[],
  payload: RevealCellsInput,
) {
  assertPositionsInBounds(board, payload.cells);

  const revealedKeys = new Set(currentlyRevealedKeys);
  const newlyRevealed: Array<CellPosition & { adjacentMines: number }> = [];

  for (const position of payload.cells) {
    const key = toCellKey(position);
    if (revealedKeys.has(key)) {
      continue;
    }

    const cell = board.cells[position.row][position.col];
    if (cell.isMine) {
      return {
        status: "lost" as const,
        revealedCells: newlyRevealed,
        explodedCell: position,
        mineCells: getMineCells(board),
        revealedKeys: Array.from(revealedKeys),
      };
    }

    floodReveal(board, position, revealedKeys, newlyRevealed);
  }

  const safeCellCount = board.config.rows * board.config.cols - board.config.mineCount;
  const hasWon = revealedKeys.size === safeCellCount;

  return {
    status: hasWon ? ("won" as const) : ("playing" as const),
    revealedCells: newlyRevealed,
    explodedCell: null,
    mineCells: hasWon ? [] : [],
    revealedKeys: Array.from(revealedKeys),
  };
}

export function validateFinishPayload(board: GameBoard, payload: FinishGameInput) {
  assertPositionsInBounds(board, payload.revealedCells);

  const revealedUniqueKeys = new Set(payload.revealedCells.map(toCellKey));
  if (revealedUniqueKeys.size !== payload.revealedCells.length) {
    throw new HttpError(400, "revealedCells contains duplicates");
  }

  const safeCellCount = board.config.rows * board.config.cols - board.config.mineCount;

  for (const revealed of payload.revealedCells) {
    const cell = board.cells[revealed.row][revealed.col];
    if (cell.isMine) {
      throw new HttpError(400, "revealedCells cannot contain mines");
    }
  }

  if (payload.status === "won") {
    if (payload.revealedCells.length !== safeCellCount) {
      throw new HttpError(400, "Won games must reveal all safe cells");
    }

    return {
      status: "won" as const,
      revealedSafeCells: payload.revealedCells.length,
      explodedCell: null,
    };
  }

  if (!payload.explodedCell) {
    throw new HttpError(400, "Lost games require explodedCell");
  }

  assertPositionsInBounds(board, [payload.explodedCell]);

  const explodedCell = board.cells[payload.explodedCell.row][payload.explodedCell.col];
  if (!explodedCell.isMine) {
    throw new HttpError(400, "explodedCell must point to a mine");
  }

  if (revealedUniqueKeys.has(toCellKey(payload.explodedCell))) {
    throw new HttpError(400, "explodedCell cannot also appear in revealedCells");
  }

  return {
    status: "lost" as const,
    revealedSafeCells: payload.revealedCells.length,
    explodedCell: payload.explodedCell,
  };
}

export function toClientBoard(boardConfig: BoardConfig) {
  return {
    rows: boardConfig.rows,
    cols: boardConfig.cols,
    mineCount: boardConfig.mineCount,
  };
}

export function toClientBoardWithCells(board: GameBoard) {
  return {
    rows: board.config.rows,
    cols: board.config.cols,
    mineCount: board.config.mineCount,
    cells: board.cells.flat().map((cell) => ({
      row: cell.row,
      col: cell.col,
      adjacentMines: cell.adjacentMines,
      isMine: cell.isMine,
    })),
  };
}

function floodReveal(
  board: GameBoard,
  start: CellPosition,
  revealedKeys: Set<string>,
  newlyRevealed: Array<CellPosition & { adjacentMines: number }>,
) {
  const queue: CellPosition[] = [start];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = toCellKey(current);

    if (revealedKeys.has(key)) {
      continue;
    }

    const cell = board.cells[current.row]?.[current.col];
    if (!cell || cell.isMine) {
      continue;
    }

    revealedKeys.add(key);
    newlyRevealed.push({
      row: cell.row,
      col: cell.col,
      adjacentMines: cell.adjacentMines,
    });

    if (cell.adjacentMines !== 0) {
      continue;
    }

    for (const neighbor of getNeighborPositions(current, board.config)) {
      if (!revealedKeys.has(toCellKey(neighbor))) {
        queue.push(neighbor);
      }
    }
  }
}

function getMineCells(board: GameBoard) {
  return board.cells
    .flat()
    .filter((cell) => cell.isMine)
    .map(({ row, col }) => ({ row, col }));
}

function assertPositionsInBounds(board: GameBoard, positions: CellPosition[]) {
  for (const position of positions) {
    if (
      position.row < 0 ||
      position.row >= board.config.rows ||
      position.col < 0 ||
      position.col >= board.config.cols
    ) {
      throw new HttpError(400, "Cell position is out of bounds");
    }
  }
}

function toCellKey(position: CellPosition) {
  return `${position.row}:${position.col}`;
}
