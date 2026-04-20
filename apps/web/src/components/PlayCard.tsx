import { useAccount, useChainId } from "wagmi";

import { usePlayBlockSweeper } from "../hooks/usePlayBlockSweeper";
import { getCurrentWeekId } from "../lib/contracts/blockSweeper";
import { getBlockSweeperRegistryAddress } from "../lib/contracts/deployments";

export function PlayCard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const currentWeekId = getCurrentWeekId();
  const contractAddress = getBlockSweeperRegistryAddress(chainId);
  const { play, hash, error, isPending, isConfirming, isConfirmed } = usePlayBlockSweeper();

  return (
    <section className="panel play-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Run setup</p>
          <h2>Start next sweep</h2>
        </div>
        <span className="pill leaderboard-pill">Top 5 earn</span>
      </div>

      <section className="play-grid">
        <article className="play-feature">
          <p className="feature-title">BOARD</p>
          <div className="feature-numbers">
            <strong>16 x 16</strong>
            <span>40 bombs</span>
          </div>
          <div className="signal-graph" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </article>

        <article className="play-feature play-feature-accent">
          <p className="feature-title">ENTRY</p>
          <div className="feature-numbers">
            <strong>1 TX</strong>
            <span>1 onchain run</span>
          </div>
          <div className="data-dots" aria-hidden="true">
            {Array.from({ length: 20 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        </article>
      </section>

      <dl className="details compact-details play-stats">
        <div>
          <dt>Week</dt>
          <dd>{currentWeekId.toString()}</dd>
        </div>
        <div>
          <dt>Contract</dt>
          <dd>{contractAddress ? `${contractAddress.slice(0, 8)}...${contractAddress.slice(-6)}` : "Unavailable"}</dd>
        </div>
        {hash ? (
          <div>
            <dt>Last tx</dt>
            <dd>{`${hash.slice(0, 10)}...${hash.slice(-8)}`}</dd>
          </div>
        ) : null}
      </dl>

      {!isConnected ? <p className="status-error">Open inside MiniPay to connect your wallet.</p> : null}
      {isPending ? <p className="status-ok">Confirm the play transaction in your wallet.</p> : null}
      {isConfirming ? <p className="status-ok">Transaction sent. Waiting for confirmation.</p> : null}

      {isConfirmed ? <p className="status-ok">Play transaction confirmed.</p> : null}
      {error ? <p className="status-error">{error.message}</p> : null}
    </section>
  );
}
