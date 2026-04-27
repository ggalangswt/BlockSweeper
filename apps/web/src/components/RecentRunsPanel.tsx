import type { RecentRun } from "../lib/api/blocksweeperApi";

type RecentRunsPanelProps = {
  runs: RecentRun[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
};

export function RecentRunsPanel({ runs, isLoading, error, isConnected }: RecentRunsPanelProps) {
  return (
    <section className="panel recent-runs-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">History</p>
          <h2>Last 5 Runs</h2>
        </div>
        <span className="pill">{runs.length}</span>
      </div>

      {!isConnected ? <p className="panel-copy">Connect a wallet to view your latest runs.</p> : null}
      {isConnected && isLoading ? <p className="panel-copy">Loading recent runs...</p> : null}
      {isConnected && error ? <p className="status-error">{error}</p> : null}
      {isConnected && !isLoading && !error && runs.length === 0 ? (
        <p className="panel-copy">No finished runs yet. Start a sweep to populate this list.</p>
      ) : null}

      {isConnected && runs.length > 0 ? (
        <div className="recent-runs-list">
          {runs.map((run) => (
            <article className="recent-run-item" key={run.sessionId}>
              <div className="recent-run-top">
                <span className={`pill ${run.status === "won" ? "pill-ok" : "pill-warn"}`}>{run.status}</span>
                <span className="recent-run-time">{formatDateTime(run.finishedAt ?? run.createdAt)}</span>
              </div>
              <div className="recent-run-grid">
                <div>
                  <p className="feature-title">Safe cells</p>
                  <strong>{run.revealedSafeCells}</strong>
                </div>
                <div>
                  <p className="feature-title">Week</p>
                  <strong>{run.weekId}</strong>
                </div>
              </div>
              <p className="recent-run-hash">
                {run.txHash ? `${run.txHash.slice(0, 10)}...${run.txHash.slice(-6)}` : "No tx hash"}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
