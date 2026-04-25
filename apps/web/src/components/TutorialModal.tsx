import { useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "blocksweeper_tutorial_seen";

type TutorialModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function useTutorialModal() {
  const hasSeenTutorial = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "true";
  return { shouldAutoOpen: !hasSeenTutorial };
}

export function markTutorialSeen() {
  localStorage.setItem(STORAGE_KEY, "true");
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    markTutorialSeen();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="tutorial-overlay"
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      <div className="tutorial-modal">
        <div className="tutorial-modal-header">
          <div>
            <p className="section-label">Tutorial</p>
            <h2>Run guide</h2>
          </div>
          <div className="tutorial-modal-header-right">
            <span className="pill leaderboard-pill">Clear 216 safe tiles</span>
            <button
              className="tutorial-modal-close"
              onClick={handleClose}
              type="button"
              aria-label="Close tutorial"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="tutorial-modal-body">
          <div className="tutorial-grid">
            <article className="tutorial-step tutorial-step-accent">
              <span className="tutorial-kicker">Goal</span>
              <strong>Clear the safe grid</strong>
              <p>Reveal all 216 safe tiles. Hit one mine and the run ends immediately.</p>
            </article>
            <article className="tutorial-step">
              <span className="tutorial-kicker">Tap</span>
              <strong>Reveal a tile</strong>
              <p>Open hidden tiles fast and build safe space before taking bigger reads.</p>
            </article>
            <article className="tutorial-step">
              <span className="tutorial-kicker">Hold</span>
              <strong>Place a flag</strong>
              <p>Mark suspected mines quickly. Flags also reduce the live bomb counter on the run screen.</p>
            </article>
            <article className="tutorial-step">
              <span className="tutorial-kicker">Read</span>
              <strong>Trust the numbers</strong>
              <p>Each number shows how many mines touch that tile across all 8 surrounding cells.</p>
            </article>
            <article className="tutorial-step">
              <span className="tutorial-kicker">Double tap</span>
              <strong>Chord faster</strong>
              <p>On a revealed number, double tap to open forced neighbors or auto-flag the last hidden mine.</p>
            </article>
          </div>
        </div>

        <button
          className="tutorial-modal-got-it"
          onClick={handleClose}
          type="button"
        >
          Got it, let&apos;s sweep!
        </button>
      </div>
    </div>
  );
}
