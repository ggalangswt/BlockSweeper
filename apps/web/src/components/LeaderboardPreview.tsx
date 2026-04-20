const leaderboardRows = [
  { rank: 1, player: "0x2A4...8F3", wins: 14, plays: 18 },
  { rank: 2, player: "0x98B...0CD", wins: 11, plays: 16 },
  { rank: 3, player: "0x51E...77A", wins: 9, plays: 12 },
];

export function LeaderboardPreview() {
  return (
    <section className="panel leaderboard-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Weekly leaderboard</p>
          <h2>Top Players</h2>
        </div>
        <span className="pill leaderboard-pill">Top 5 paid</span>
      </div>

      <div className="leaderboard score-sheet">
        {leaderboardRows.map((row) => (
          <div className="leaderboard-row" key={row.rank}>
            <span className="rank-badge">0{row.rank}</span>
            <div className="leaderboard-copy">
              <p className="player">{row.player}</p>
              <p className="meta">{row.plays} plays</p>
            </div>
            <strong className="wins-count">{row.wins}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
