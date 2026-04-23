import { useMemo } from "react";

import type { FinishGameResponse } from "../lib/api/blocksweeperApi";
import type { GameBoard as BlockSweeperBoard } from "../lib/game/board";
import { GameBoard } from "./GameBoard";

type GamePhase = "idle" | "pending-tx" | "creating-session" | "playing" | "won" | "lost";

type GamePanelProps = {
  phase: GamePhase;
  board: BlockSweeperBoard | null;
  error: string | null;
  result: FinishGameResponse | null;
  weekId: number;
  txHash?: `0x${string}`;
  isConnected: boolean;
  isDevBypass: boolean;
  isWrongNetwork: boolean;
  wrongNetworkMessage: string | null;
  targetChainName: string;
  isSubmittingFinish: boolean;
  mineCount: number;
  attempts: number;
  wins: number;
  onStart: () => Promise<void> | void;
  onReveal: (row: number, col: number) => Promise<void> | void;
  onFlag: (row: number, col: number) => void;
};

export function GamePanel({
  phase,
  board,
  error,
  result,
  weekId,
  txHash,
  isConnected,
  isDevBypass,
  isWrongNetwork,
  wrongNetworkMessage,
  targetChainName,
  isSubmittingFinish,
  mineCount,
  attempts,
  wins,
  onStart,
  onReveal,
  onFlag,
}: GamePanelProps) {
  const statusText = useMemo(() => {
    switch (phase) {
      case "pending-tx":
        return "Confirm the onchain play transaction.";
      case "creating-session":
        return "Creating server session.";
      case "playing":
        return "Sweep the board. Right click to flag.";
      case "won":
        return "Board cleared. Backend confirmed the win.";
      case "lost":
        return "Run failed. Backend recorded the loss.";
      default:
        return isDevBypass
          ? "Dev mode bypass is active. Start without wallet confirmation."
          : "Start a run and clear every safe tile.";
    }
  }, [isDevBypass, phase]);

  return (
    <section className="panel game-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Run control</p>
          <h2>{phase === "playing" ? "Sweep in progress" : "Start next sweep"}</h2>
        </div>
        <span className="pill leaderboard-pill">{phase.toUpperCase()}</span>
      </div>

      <section className="play-grid">
        <article className="play-feature">
          <p className="feature-title">BOARD</p>
          <div className="feature-numbers">
            <strong>{board ? `${board.rows} x ${board.cols}` : "16 x 16"}</strong>
            <span>{mineCount} bombs</span>
          </div>
        </article>

        <article className="play-feature play-feature-accent">
          <p className="feature-title">WEEK</p>
          <div className="feature-numbers">
            <strong>{weekId}</strong>
            <span>{txHash ? `${txHash.slice(0, 10)}...` : "awaiting tx"}</span>
          </div>
        </article>
      </section>

      <dl className="details compact-details play-stats">
        <div>
          <dt>Attempt</dt>
          <dd>{attempts}</dd>
        </div>
        <div>
          <dt>Win</dt>
          <dd>{wins}</dd>
        </div>
      </dl>

      {isWrongNetwork && wrongNetworkMessage ? (
        <div className="network-banner" role="alert">
          <p className="network-banner-title">Wrong network</p>
          <p>{wrongNetworkMessage}</p>
          <p className="network-banner-hint">This run requires {targetChainName} before you can start.</p>
        </div>
      ) : null}

      <p className={error ? "status-error" : "status-ok"}>{error ?? statusText}</p>
      {!isConnected && !isDevBypass ? (
        <p className="status-error">Open inside MiniPay or enable wallet access to use the live flow.</p>
      ) : null}

      {result ? (
        <div className="run-summary">
          <p className="feature-title">FINAL</p>
          <div className="run-summary-row">
            <span>Status</span>
            <strong>{result.status.toUpperCase()}</strong>
          </div>
          <div className="run-summary-row">
            <span>Safe cells</span>
            <strong>{result.revealedSafeCells}</strong>
          </div>
        </div>
      ) : null}

      {board ? (
        <GameBoard
          board={board}
          disabled={phase !== "playing" || isSubmittingFinish}
          onChord={() => {}}
          onReveal={onReveal}
          onFlag={onFlag}
        />
      ) : null}

      <button
        className="start-run-button"
        disabled={phase === "pending-tx" || phase === "creating-session" || isSubmittingFinish || isWrongNetwork}
        onClick={() => void onStart()}
        type="button"
      >
        {phase === "playing" ? "Restart Run" : "Start Run"}
      </button>
    </section>
  );
}
