import { randomUUID } from "node:crypto";

import { HttpError } from "../../lib/http-error.js";
import type { BoardCell, BoardConfig, CellPosition, FinishGameInput, GameBoard } from "./game.types.js";

export function createSessionId() {
  return randomUUID();
}

export function createBoard(config: BoardConfig): GameBoard {
  const totalCells = config.rows * config.cols;
  if (config.mineCount >= totalCells) {
    throw new HttpError(500, "Invalid board configuration");
  }

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
    mineIndexes.add(Math.floor(Math.random() * totalCells));
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

export function toClientBoard(board: GameBoard) {
  return {
    rows: board.config.rows,
    cols: board.config.cols,
    mineCount: board.config.mineCount,
    cells: board.cells.flat().map((cell) => ({
      row: cell.row,
      col: cell.col,
      isMine: cell.isMine,
      adjacentMines: cell.adjacentMines,
    })),
  };
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
