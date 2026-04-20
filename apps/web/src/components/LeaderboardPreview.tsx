const leaderboardRows = [
  { rank: 1, player: "0x2A4...8F3", wins: 14, plays: 18 },
  { rank: 2, player: "0x98B...0CD", wins: 11, plays: 16 },
  { rank: 3, player: "0x51E...77A", wins: 9, plays: 12 },
];

export function LeaderboardPreview() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Weekly leaderboard</p>
          <h2>Preview</h2>
        </div>
        <span className="pill">Placeholder</span>
      </div>

      <div className="leaderboard">
        {leaderboardRows.map((row) => (
          <div className="leaderboard-row" key={row.rank}>
            <span className="rank">#{row.rank}</span>
            <div>
              <p className="player">{row.player}</p>
              <p className="meta">
                {row.wins} wins • {row.plays} total plays
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
