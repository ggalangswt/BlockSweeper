import type { ApiBoard, ApiBoardCell, CellPosition } from "../api/blocksweeperApi";

export type GameCell = CellPosition & {
  adjacentMines: number | null;
  isRevealed: boolean;
  isFlagged: boolean;
  isMine: boolean;
  isExploded: boolean;
};

export type GameBoard = {
  rows: number;
  cols: number;
  mineCount: number;
  cells: GameCell[][];
};

export function createGameBoard(board: ApiBoard): GameBoard {
  return {
    rows: board.rows,
    cols: board.cols,
    mineCount: board.mineCount,
    cells: Array.from({ length: board.rows }, (_, row) =>
      Array.from({ length: board.cols }, (_, col) => {
        const source = board.cells.find((cell) => cell.row === row && cell.col === col);

        return {
          row,
          col,
          adjacentMines: source?.adjacentMines ?? 0,
          isRevealed: false,
          isFlagged: false,
          isMine: source?.isMine ?? false,
          isExploded: false,
        };
      }),
    ),
  };
}

export function toggleFlag(board: GameBoard, position: CellPosition) {
  const nextBoard = cloneBoard(board);
  const cell = nextBoard.cells[position.row]?.[position.col];
  if (!cell || cell.isRevealed) {
    return nextBoard;
  }

  cell.isFlagged = !cell.isFlagged;
  return nextBoard;
}

export function applyRevealResult(
  board: GameBoard,
  revealedCells: ApiBoardCell[],
  mineCells: CellPosition[],
  explodedCell: CellPosition | null,
) {
  const nextBoard = cloneBoard(board);

  for (const revealed of revealedCells) {
    const cell = nextBoard.cells[revealed.row][revealed.col];
    cell.isRevealed = true;
    cell.isFlagged = false;
    cell.adjacentMines = revealed.adjacentMines;
  }

  for (const mine of mineCells) {
    const cell = nextBoard.cells[mine.row][mine.col];
    cell.isMine = true;
    cell.isRevealed = true;
  }

  if (explodedCell) {
    const cell = nextBoard.cells[explodedCell.row][explodedCell.col];
    cell.isMine = true;
    cell.isRevealed = true;
    cell.isExploded = true;
  }

  return nextBoard;
}

export function revealBoardCell(board: GameBoard, position: CellPosition) {
  const nextBoard = cloneBoard(board);
  const startCell = nextBoard.cells[position.row]?.[position.col];

  if (!startCell || startCell.isFlagged || startCell.isRevealed) {
    return {
      board: nextBoard,
      status: "playing" as const,
      explodedCell: null,
    };
  }

  if (startCell.isMine) {
    startCell.isRevealed = true;
    startCell.isExploded = true;

    for (const cell of nextBoard.cells.flat()) {
      if (cell.isMine) {
        cell.isRevealed = true;
      }
    }

    return {
      board: nextBoard,
      status: "lost" as const,
      explodedCell: { row: startCell.row, col: startCell.col },
    };
  }

  const queue: CellPosition[] = [position];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const cell = nextBoard.cells[current.row]?.[current.col];

    if (!cell || cell.isRevealed || cell.isFlagged || cell.isMine) {
      continue;
    }

    cell.isRevealed = true;

    if ((cell.adjacentMines ?? 0) !== 0) {
      continue;
    }

    for (const neighbor of getNeighborPositions(nextBoard, current)) {
      const neighborCell = nextBoard.cells[neighbor.row][neighbor.col];
      if (!neighborCell.isRevealed && !neighborCell.isFlagged && !neighborCell.isMine) {
        queue.push(neighbor);
      }
    }
  }

  return {
    board: nextBoard,
    status: hasClearedAllSafeCells(nextBoard) ? ("won" as const) : ("playing" as const),
    explodedCell: null,
  };
}

export function getRevealedSafeCells(board: GameBoard) {
  return board.cells
    .flat()
    .filter((cell) => cell.isRevealed && !cell.isMine)
    .map(({ row, col }) => ({ row, col }));
}

export function hasClearedAllSafeCells(board: GameBoard) {
  return getRevealedSafeCells(board).length === board.rows * board.cols - board.mineCount;
}

export function getFlaggedCount(board: GameBoard) {
  return board.cells.flat().filter((cell) => cell.isFlagged).length;
}

export function getChordAction(board: GameBoard, position: CellPosition) {
  const centerCell = board.cells[position.row]?.[position.col];
  if (!centerCell || !centerCell.isRevealed || centerCell.isMine || !centerCell.adjacentMines) {
    return {
      flagPositions: [] as CellPosition[],
      revealPositions: [] as CellPosition[],
    };
  }

  const neighbors = getNeighborPositions(board, position);
  const flaggedCount = neighbors.filter(({ row, col }) => board.cells[row][col].isFlagged).length;
  const hiddenNeighbors = neighbors.filter(({ row, col }) => {
    const cell = board.cells[row][col];
    return !cell.isRevealed && !cell.isFlagged;
  });
  const remainingMines = centerCell.adjacentMines - flaggedCount;

  if (remainingMines > 0 && hiddenNeighbors.length === remainingMines) {
    return {
      flagPositions: hiddenNeighbors,
      revealPositions: [] as CellPosition[],
    };
  }

  if (flaggedCount === centerCell.adjacentMines) {
    return {
      flagPositions: [] as CellPosition[],
      revealPositions: hiddenNeighbors,
    };
  }

  return {
    flagPositions: [] as CellPosition[],
    revealPositions: [] as CellPosition[],
  };
}

export function applyFlags(board: GameBoard, positions: CellPosition[]) {
  const nextBoard = cloneBoard(board);

  for (const position of positions) {
    const cell = nextBoard.cells[position.row]?.[position.col];
    if (cell && !cell.isRevealed) {
      cell.isFlagged = true;
    }
  }

  return nextBoard;
}

function cloneBoard(board: GameBoard): GameBoard {
  return {
    ...board,
    cells: board.cells.map((row) => row.map((cell) => ({ ...cell }))),
  };
}

function getNeighborPositions(board: GameBoard, position: CellPosition) {
  const neighbors: CellPosition[] = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const nextRow = position.row + rowOffset;
      const nextCol = position.col + colOffset;

      if (nextRow < 0 || nextRow >= board.rows || nextCol < 0 || nextCol >= board.cols) {
        continue;
      }

      neighbors.push({ row: nextRow, col: nextCol });
    }
  }

  return neighbors;
}
