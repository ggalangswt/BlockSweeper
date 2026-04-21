import { useRef } from "react";

import type { FinishGameResponse } from "../lib/api/blocksweeperApi";
import type { GameBoard as BlockSweeperBoard } from "../lib/game/board";
import { GameBoard } from "./GameBoard";

type GamePhase = "idle" | "pending-tx" | "creating-session" | "playing" | "won" | "lost";

type GameSessionScreenProps = {
  board: BlockSweeperBoard | null;
  error: string | null;
  flaggedCount: number;
  isSubmittingFinish: boolean;
  isResolvingMove: boolean;
  mineCount: number;
  onBack: () => void;
  onChord: (row: number, col: number) => Promise<void> | void;
  onFlag: (row: number, col: number) => void;
  onReveal: (row: number, col: number) => Promise<void> | void;
  onStart: () => Promise<void> | void;
  phase: GamePhase;
  result: FinishGameResponse | null;
  revealedSafeCount: number;
  txHash?: `0x${string}`;
  weekId: number;
};

export function GameSessionScreen({
  board,
  error,
  flaggedCount,
  isSubmittingFinish,
  mineCount,
  onBack,
  onChord,
  onFlag,
  onReveal,
  onStart,
  phase,
  result,
  isResolvingMove,
  weekId,
}: GameSessionScreenProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; scrollLeft: number; scrollTop: number }>({
    active: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const bombsLeft = Math.max(mineCount - flaggedCount, 0);
  const terminalStatus = phase === "won" || phase === "lost" ? phase : result?.status ?? null;
  const bannerText =
    error ??
    (terminalStatus === "won"
      ? "Board cleared. Win saved."
      : terminalStatus === "lost"
        ? "Mine hit. Loss saved."
        : phase === "creating-session"
          ? "Generating board..."
          : null);

  return (
    <section className="session-screen">
      <header className="session-topbar">
        <button className="session-back" onClick={onBack} type="button">
          <svg aria-hidden="true" className="session-back-icon" viewBox="0 0 24 24">
            <path
              d="M15 18 9 12l6-6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
          </svg>
        </button>
        <div className="session-title">
          <h2>
            <span className="session-week-label">Week</span>{" "}
            <span className="session-week-number">{weekId}</span>
          </h2>
        </div>
        <div className={`session-bombs${terminalStatus ? ` session-bombs-${terminalStatus}` : ""}`}>
          <span>{terminalStatus === "won" || terminalStatus === "lost" ? "Status" : "Bombs"}</span>
          <strong>{terminalStatus === "won" ? "WIN" : terminalStatus === "lost" ? "LOST" : bombsLeft}</strong>
        </div>
      </header>

      {bannerText ? (
        <div className={`session-banner${error ? " session-banner-error" : ""}`}>{bannerText}</div>
      ) : null}

      <div
        ref={viewportRef}
        className="session-board-viewport"
        onPointerDown={(event) => {
          if (!viewportRef.current || event.target !== event.currentTarget) {
            return;
          }

          dragRef.current = {
            active: true,
            startX: event.clientX,
            startY: event.clientY,
            scrollLeft: viewportRef.current.scrollLeft,
            scrollTop: viewportRef.current.scrollTop,
          };
        }}
        onPointerMove={(event) => {
          if (!viewportRef.current || !dragRef.current.active) {
            return;
          }

          viewportRef.current.scrollLeft = dragRef.current.scrollLeft - (event.clientX - dragRef.current.startX);
          viewportRef.current.scrollTop = dragRef.current.scrollTop - (event.clientY - dragRef.current.startY);
        }}
        onPointerUp={() => {
          dragRef.current.active = false;
        }}
        onPointerLeave={() => {
          dragRef.current.active = false;
        }}
      >
        <div
          className="session-board-scale"
        >
          {board ? (
            <GameBoard
              board={board}
              disabled={phase !== "playing" || Boolean(terminalStatus) || isSubmittingFinish || isResolvingMove}
              onChord={onChord}
              onFlag={onFlag}
              onReveal={onReveal}
            />
          ) : (
            <div className="session-loading">Generating board...</div>
          )}
        </div>
      </div>

      <div className="session-actions">
        <button
          className="session-action-secondary"
          onClick={onBack}
          type="button"
        >
          Leave session
        </button>
        <button
          className="start-run-button"
          onClick={() => void onStart()}
          type="button"
        >
          New session
        </button>
      </div>
    </section>
  );
}
