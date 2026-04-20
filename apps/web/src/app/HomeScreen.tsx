import { LeaderboardPreview } from "../components/LeaderboardPreview";
import { PlayCard } from "../components/PlayCard";
import { WalletStatusCard } from "../components/WalletStatusCard";
import { env } from "../env";

export function HomeScreen() {
  return (
    <main className="shell">
      <section className="hero-card">
        <p className="eyebrow">MiniPay Mini App</p>
        <h1>{env.appName}</h1>
        <p className="hero-copy">
          Mobile-first Minesweeper scaffold for Celo Mainnet. Wallet setup is
          ready; gameplay, backend validation, and weekly leaderboard will be
          layered in next.
        </p>
      </section>

      <WalletStatusCard />
      <PlayCard />
      <LeaderboardPreview />
    </main>
  );
}
