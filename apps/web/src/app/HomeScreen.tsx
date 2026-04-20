import { useState } from "react";

import { BottomNav } from "../components/BottomNav";
import { LeaderboardPreview } from "../components/LeaderboardPreview";
import { PlayCard } from "../components/PlayCard";
import { WalletStatusCard } from "../components/WalletStatusCard";
import { env } from "../env";
import { usePlayBlockSweeper } from "../hooks/usePlayBlockSweeper";

export function HomeScreen() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "home" | "profile">("home");
  const { play, registry, isPending, isConfirming } = usePlayBlockSweeper();

  return (
    <main className="shell">
      <section className="hero-card hero-card-compact">
        <div>
          <p className="eyebrow">Weekly Prize</p>
          <h1>{env.appName}</h1>
          <p className="hero-subtitle">Play fast. Climb rank. Get paid.</p>
        </div>
        <span className="hero-chip">0.5 CELO</span>
      </section>

      {activeTab === "home" ? <PlayCard /> : null}
      {activeTab === "leaderboard" ? <LeaderboardPreview /> : null}
      {activeTab === "profile" ? <WalletStatusCard /> : null}

      <BottomNav
        activeTab={activeTab}
        onHome={() => setActiveTab("home")}
        onLeaderboard={() => setActiveTab("leaderboard")}
        onProfile={() => setActiveTab("profile")}
        onPlay={() => play()}
        playBusy={isPending || isConfirming}
        playDisabled={!registry || isPending || isConfirming}
      />
    </main>
  );
}
