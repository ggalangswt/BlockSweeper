import { useMemo, useRef } from "react";

import type { GameBoard as BlockSweeperBoard } from "../lib/game/board";

type GameBoardProps = {
  board: BlockSweeperBoard;
  disabled?: boolean;
  highlightedCell?: { row: number; col: number } | null;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
};

const LONG_PRESS_MS = 380;
const DOUBLE_TAP_MS = 260;

export function GameBoard({ board, disabled, highlightedCell, onReveal, onFlag, onChord }: GameBoardProps) {
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const lastTapRef = useRef<{ key: string; time: number } | null>(null);

  const gridTemplateColumns = useMemo(
    () => `repeat(${board.cols}, minmax(var(--cell-size), var(--cell-size)))`,
    [board.cols],
  );

  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  return (
    <div
      className="mine-grid"
      style={{
        gridTemplateColumns,
      }}
    >
      {board.cells.flat().map((cell) => {
        const className = [
          "mine-cell",
          cell.isRevealed ? "mine-cell-revealed" : "",
          cell.isFlagged ? "mine-cell-flagged" : "",
          cell.isMine && cell.isRevealed ? "mine-cell-mine" : "",
          cell.isExploded ? "mine-cell-exploded" : "",
          highlightedCell?.row === cell.row && highlightedCell?.col === cell.col ? "mine-cell-pending" : "",
          !cell.isRevealed && !cell.isFlagged ? "mine-cell-hidden" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const label = getCellLabel(cell);

        return (
          <button
            key={`${cell.row}:${cell.col}`}
            className={className}
            disabled={disabled}
            onContextMenu={(event) => {
              event.preventDefault();
              onFlag(cell.row, cell.col);
            }}
            onDoubleClick={() => {
              if (cell.isRevealed && !cell.isMine && cell.adjacentMines !== null && cell.adjacentMines > 0) {
                onChord(cell.row, cell.col);
              }
            }}
            onPointerDown={(event) => {
              if (disabled || event.pointerType !== "touch" || cell.isRevealed) {
                return;
              }

              longPressTriggeredRef.current = false;
              clearLongPressTimer();
              longPressTimerRef.current = window.setTimeout(() => {
                longPressTriggeredRef.current = true;
                onFlag(cell.row, cell.col);
              }, LONG_PRESS_MS);
            }}
            onPointerMove={() => {
              clearLongPressTimer();
            }}
            onPointerCancel={() => {
              clearLongPressTimer();
            }}
            onPointerUp={(event) => {
              if (disabled) {
                return;
              }

              if (event.pointerType === "touch") {
                clearLongPressTimer();

                if (longPressTriggeredRef.current) {
                  longPressTriggeredRef.current = false;
                  return;
                }

                if (cell.isRevealed && !cell.isMine && cell.adjacentMines !== null && cell.adjacentMines > 0) {
                  const now = Date.now();
                  const key = `${cell.row}:${cell.col}`;

                  if (lastTapRef.current?.key === key && now - lastTapRef.current.time <= DOUBLE_TAP_MS) {
                    lastTapRef.current = null;
                    onChord(cell.row, cell.col);
                    return;
                  }

                  lastTapRef.current = { key, time: now };
                  return;
                }

                onReveal(cell.row, cell.col);
                return;
              }

              if (!cell.isRevealed) {
                onReveal(cell.row, cell.col);
              }
            }}
            type="button"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function getCellLabel(
  cell: BlockSweeperBoard["cells"][number][number],
): string {
  if (cell.isFlagged && !cell.isRevealed) {
    return "F";
  }

  if (!cell.isRevealed) {
    return "";
  }

  if (cell.isMine) {
    return "*";
  }

  if (cell.adjacentMines === 0) {
    return "";
  }

  return String(cell.adjacentMines);
}
