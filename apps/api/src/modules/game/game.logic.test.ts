import { describe, expect, it } from "vitest";

import { createBoard, validateFinishPayload } from "./game.logic.js";

describe("game.logic", () => {
  it("creates a 16x16 board with 40 bombs", () => {
    const board = createBoard({
      rows: 16,
      cols: 16,
      mineCount: 40,
    });

    expect(board.cells).toHaveLength(16);
    expect(board.cells[0]).toHaveLength(16);

    const mineCount = board.cells.flat().filter((cell) => cell.isMine).length;
    expect(mineCount).toBe(40);
  });

  it("computes adjacent mine counts correctly", () => {
    const board = createBoard({
      rows: 8,
      cols: 8,
      mineCount: 10,
    });

    for (const cell of board.cells.flat()) {
      if (cell.isMine) {
        continue;
      }

      let countedMines = 0;
      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
          if (rowOffset === 0 && colOffset === 0) {
            continue;
          }

          const row = cell.row + rowOffset;
          const col = cell.col + colOffset;

          if (row < 0 || row >= 8 || col < 0 || col >= 8) {
            continue;
          }

          if (board.cells[row][col].isMine) {
            countedMines += 1;
          }
        }
      }

      expect(cell.adjacentMines).toBe(countedMines);
    }
  });

  it("accepts valid win payloads", () => {
    const board = createBoard({
      rows: 4,
      cols: 4,
      mineCount: 2,
    });

    const revealedCells = board.cells
      .flat()
      .filter((cell) => !cell.isMine)
      .map(({ row, col }) => ({ row, col }));

    const result = validateFinishPayload(board, {
      sessionId: "session",
      status: "won",
      revealedCells,
    });

    expect(result.status).toBe("won");
    expect(result.revealedSafeCells).toBe(14);
  });

  it("accepts valid lose payloads", () => {
    const board = createBoard({
      rows: 4,
      cols: 4,
      mineCount: 2,
    });

    const mine = board.cells.flat().find((cell) => cell.isMine);
    const safeCell = board.cells.flat().find((cell) => !cell.isMine);
    if (!mine || !safeCell) {
      throw new Error("Board generation failed");
    }

    const result = validateFinishPayload(board, {
      sessionId: "session",
      status: "lost",
      revealedCells: [{ row: safeCell.row, col: safeCell.col }],
      explodedCell: { row: mine.row, col: mine.col },
    });

    expect(result.status).toBe("lost");
    expect(result.explodedCell).toEqual({ row: mine.row, col: mine.col });
  });

  it("rejects win payloads that do not reveal all safe cells", () => {
    const board = createBoard({
      rows: 4,
      cols: 4,
      mineCount: 2,
    });

    const revealedCells = board.cells
      .flat()
      .filter((cell) => !cell.isMine)
      .slice(0, 3)
      .map(({ row, col }) => ({ row, col }));

    expect(() =>
      validateFinishPayload(board, {
        sessionId: "session",
        status: "won",
        revealedCells,
      }),
    ).toThrowError(/reveal all safe cells/i);
  });
});
