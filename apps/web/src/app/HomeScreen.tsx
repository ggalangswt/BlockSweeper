import { useState } from "react";

import { BottomNav } from "../components/BottomNav";
import { GamePanel } from "../components/GamePanel";
import { GameSessionScreen } from "../components/GameSessionScreen";
import { LeaderboardPreview } from "../components/LeaderboardPreview";
import { WalletStatusCard } from "../components/WalletStatusCard";
import { env } from "../env";
import { useBlockSweeperGame } from "../hooks/useBlockSweeperGame";
import { useWeeklyLeaderboard } from "../hooks/useWeeklyLeaderboard";
import { useWeeklyStats } from "../hooks/useWeeklyStats";

export function HomeScreen() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "home" | "profile">("home");
  const game = useBlockSweeperGame();
  const leaderboard = useWeeklyLeaderboard(game.weekId, game.statsRefreshKey);
  const weeklyStats = useWeeklyStats(game.walletAddress, game.weekId, game.statsRefreshKey);

  return (
    <main className="shell">
      <section className="hero-card hero-card-compact">
        <div>
          <p className="eyebrow">Welcome to</p>
          <h1>{env.appName}</h1>
          <p className="hero-subtitle">Sweep smart. Climb fast. Lock in your weekly rank.</p>
        </div>
      </section>

      {activeTab === "home" && !game.isSessionOpen ? (
        <>
          <GamePanel
            board={game.board}
            error={game.error}
            isConnected={game.isConnected}
            isDevBypass={game.isDevBypass}
            isSubmittingFinish={game.isSubmittingFinish}
            mineCount={game.stats.mineCount}
            attempts={weeklyStats.stats?.totalPlays ?? 0}
            onFlag={(row, col) => game.flagCell({ row, col })}
            onReveal={(row, col) => game.revealCell({ row, col })}
            onStart={game.startNewGame}
            phase={game.phase}
            result={game.result}
            txHash={(game.session?.txHash as `0x${string}` | undefined) ?? game.txHash}
            weekId={game.weekId}
            wins={weeklyStats.stats?.wins ?? 0}
          />

          <section className="panel tutorial-panel">
            <div className="panel-header">
              <div>
                <p className="section-label">Tutorial</p>
                <h2>How to sweep</h2>
              </div>
              <span className="pill leaderboard-pill">216 safe tiles</span>
            </div>

            <div className="tutorial-grid">
              <article className="tutorial-step">
                <strong>Reveal</strong>
                <p>Tap a tile to open it. Clear all 216 safe tiles to win the run.</p>
              </article>
              <article className="tutorial-step">
                <strong>Flag</strong>
                <p>Hold a hidden tile to drop a flag. Flags reduce the bomb counter even if the guess is wrong.</p>
              </article>
              <article className="tutorial-step">
                <strong>Read numbers</strong>
                <p>Each number tells you how many bombs touch that tile across all eight directions.</p>
              </article>
              <article className="tutorial-step">
                <strong>Chord fast</strong>
                <p>Double tap a revealed number to auto-open neighbors, or auto-flag the last hidden tile when it is forced.</p>
              </article>
            </div>
          </section>
        </>
      ) : null}
      {activeTab === "leaderboard" ? (
        <LeaderboardPreview
          entries={leaderboard.entries}
          error={leaderboard.error}
          isLoading={leaderboard.isLoading}
        />
      ) : null}
      {activeTab === "profile" ? <WalletStatusCard /> : null}

      {game.isSessionOpen ? (
        <GameSessionScreen
          board={game.board}
          error={game.error}
          flaggedCount={game.stats.flaggedCount}
          isSubmittingFinish={game.isSubmittingFinish}
          mineCount={game.stats.mineCount}
          onBack={game.resetToLobby}
          onChord={(row, col) => game.chordCell({ row, col })}
          onFlag={(row, col) => game.flagCell({ row, col })}
          onReveal={(row, col) => game.revealCell({ row, col })}
          onStart={game.startNewGame}
          phase={game.phase}
          result={game.result}
          revealedSafeCount={game.stats.revealedSafeCount}
          txHash={(game.session?.txHash as `0x${string}` | undefined) ?? game.txHash}
          weekId={game.weekId}
        />
      ) : null}

      {!game.isSessionOpen ? (
        <BottomNav
          activeTab={activeTab}
          onHome={() => setActiveTab("home")}
          onLeaderboard={() => setActiveTab("leaderboard")}
          onProfile={() => setActiveTab("profile")}
          onPlay={() => setActiveTab("home")}
          playBusy={game.isPendingTx}
          playDisabled={game.phase === "pending-tx" || game.phase === "creating-session" || game.isSubmittingFinish}
        />
      ) : null}
    </main>
  );
}
