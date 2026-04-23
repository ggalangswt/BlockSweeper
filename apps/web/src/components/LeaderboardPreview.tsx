import type { LeaderboardEntry } from "../lib/api/blocksweeperApi";

type LeaderboardPreviewProps = {
  entries: LeaderboardEntry[];
  error: string | null;
  isLoading: boolean;
};

function shortAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
}

export function LeaderboardPreview({ entries, error, isLoading }: LeaderboardPreviewProps) {
  return (
    <section className="panel leaderboard-panel">
      <div className="panel-header leaderboard-header">
        <div>
          <p className="section-label">Weekly leaderboard</p>
          <h2>Top Players</h2>
        </div>
        <span className="pill leaderboard-pill">Top 5 paid</span>
      </div>

      <div className="leaderboard-scroll">
        <div className="leaderboard score-sheet">
          {isLoading ? <p className="status-ok">Loading leaderboard...</p> : null}
          {!isLoading && error ? <p className="status-error">{error}</p> : null}
          {!isLoading && !error && entries.length === 0 ? <p className="status-ok">No runs recorded this week yet.</p> : null}
          {!isLoading && !error
            ? entries.map((row) => (
                <div
                  className={`leaderboard-row${row.rank <= 3 ? ` leaderboard-row-rank-${row.rank}` : ""}`}
                  key={`${row.rank}-${row.walletAddress}`}
                >
                  <span className={`rank-badge${row.rank <= 3 ? ` rank-badge-rank-${row.rank}` : ""}`}>
                    {String(row.rank).padStart(2, "0")}
                  </span>
                  <div className="leaderboard-copy">
                    <p className="player">{shortAddress(row.walletAddress)}</p>
                    <p className="meta">{row.totalPlays} plays</p>
                  </div>
                  <strong className={`wins-count${row.rank <= 3 ? ` wins-count-rank-${row.rank}` : ""}`}>
                    {row.wins}
                  </strong>
                </div>
              ))
            : null}
        </div>
      </div>
    </section>
  );
}
