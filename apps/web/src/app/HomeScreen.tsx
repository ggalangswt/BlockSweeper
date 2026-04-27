import { useState } from "react";

import { BottomNav } from "../components/BottomNav";
import { GamePanel } from "../components/GamePanel";
import { GameSessionScreen } from "../components/GameSessionScreen";
import { LeaderboardPreview } from "../components/LeaderboardPreview";
import { RecentRunsPanel } from "../components/RecentRunsPanel";
import { TutorialModal, useTutorialModal } from "../components/TutorialModal";
import { WalletStatusCard } from "../components/WalletStatusCard";
import { env } from "../env";
import { useBlockSweeperGame } from "../hooks/useBlockSweeperGame";
import { useRecentRuns } from "../hooks/useRecentRuns";
import { useTargetChain } from "../hooks/useTargetChain";
import { useWeeklyLeaderboard } from "../hooks/useWeeklyLeaderboard";
import { useWeeklyStats } from "../hooks/useWeeklyStats";

export function HomeScreen() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "home" | "profile">("home");
  const { targetChainId, targetChainName, isMainnet, isSwitching, switchError, toggleChain } = useTargetChain();
  const game = useBlockSweeperGame(targetChainId, targetChainName);
  const leaderboard = useWeeklyLeaderboard(game.weekId, game.statsRefreshKey);
  const weeklyStats = useWeeklyStats(game.walletAddress, game.weekId, game.statsRefreshKey);
  const recentRuns = useRecentRuns(game.walletAddress, game.statsRefreshKey);

  const { shouldAutoOpen } = useTutorialModal();
  const [isTutorialOpen, setIsTutorialOpen] = useState(shouldAutoOpen);

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
        <GamePanel
          board={game.board}
          error={game.error}
          isConnected={game.isConnected}
          isDevBypass={game.isDevBypass}
          isWrongNetwork={game.isWrongNetwork}
          wrongNetworkMessage={game.wrongNetworkMessage}
          targetChainName={game.targetChainName}
          isMiniPay={game.providerName === "MiniPay"}
          isSwitchingNetwork={game.isSwitchingNetwork}
          isSecuringFirstTile={game.isSecuringFirstTile}
          pendingFirstReveal={game.pendingFirstReveal}
          isSubmittingFinish={game.isSubmittingFinish}
          mineCount={game.stats.mineCount}
          attempts={weeklyStats.stats?.totalPlays ?? 0}
          onFlag={(row, col) => game.flagCell({ row, col })}
          onReveal={(row, col) => game.revealCell({ row, col })}
          onStart={game.startNewGame}
          onSwitchNetwork={game.switchToTargetChain}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          phase={game.phase}
          result={game.result}
          txHash={(game.session?.txHash as `0x${string}` | undefined) ?? game.txHash}
          weekId={game.weekId}
          wins={weeklyStats.stats?.wins ?? 0}
        />
      ) : null}
      {activeTab === "leaderboard" ? (
        <LeaderboardPreview
          entries={leaderboard.entries}
          error={leaderboard.error}
          isLoading={leaderboard.isLoading}
        />
      ) : null}
      {activeTab === "profile" ? (
        <>
          <WalletStatusCard
            isMainnet={isMainnet}
            targetChainName={targetChainName}
            isSwitching={isSwitching}
            switchError={switchError}
            onToggleChain={toggleChain}
          />
          <RecentRunsPanel
            error={recentRuns.error}
            isConnected={game.isConnected || game.isDevBypass}
            isLoading={recentRuns.isLoading}
            runs={recentRuns.runs}
          />
        </>
      ) : null}

      {game.isSessionOpen ? (
        <GameSessionScreen
          board={game.board}
          error={game.error}
          flaggedCount={game.stats.flaggedCount}
          isSubmittingFinish={game.isSubmittingFinish}
          isSecuringFirstTile={game.isSecuringFirstTile}
          mineCount={game.stats.mineCount}
          onBack={game.resetToLobby}
          onChord={(row, col) => game.chordCell({ row, col })}
          onFlag={(row, col) => game.flagCell({ row, col })}
          onReveal={(row, col) => game.revealCell({ row, col })}
          onStart={game.startNewGame}
          pendingFirstReveal={game.pendingFirstReveal}
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

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </main>
  );
}
