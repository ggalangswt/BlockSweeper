type TabKey = "leaderboard" | "home" | "profile";

type BottomNavProps = {
  activeTab: TabKey;
  onLeaderboard: () => void;
  onHome: () => void;
  onProfile: () => void;
  onPlay: () => void;
  playDisabled?: boolean;
  playBusy?: boolean;
};

function LeaderboardIcon() {
  return (
    <svg aria-hidden="true" className="nav-icon" viewBox="0 0 24 24">
      <path
        d="M7 18H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2m5 6H9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h3m6 10h-3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="play-icon" viewBox="0 0 24 24">
      <path d="M8 6v12l10-6-10-6Z" fill="currentColor" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg aria-hidden="true" className="nav-icon" viewBox="0 0 24 24">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 9a7 7 0 0 0-14 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function BottomNav({
  activeTab,
  onLeaderboard,
  onHome,
  onProfile,
  onPlay,
  playDisabled,
  playBusy,
}: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${activeTab === "leaderboard" ? "nav-item-active" : ""}`}
        onClick={onLeaderboard}
        type="button"
      >
        <LeaderboardIcon />
        <span>Leaderboard</span>
      </button>

      <div className="play-dock">
        <button
          className="play-fab"
          disabled={playDisabled}
          onClick={() => {
            onHome();
            onPlay();
          }}
          type="button"
        >
          <PlayIcon />
        </button>
        <span className="play-label">{playBusy ? "Pending" : "Play"}</span>
      </div>

      <button
        className={`nav-item ${activeTab === "profile" ? "nav-item-active" : ""}`}
        onClick={onProfile}
        type="button"
      >
        <ProfileIcon />
        <span>Profile</span>
      </button>
    </nav>
  );
}
