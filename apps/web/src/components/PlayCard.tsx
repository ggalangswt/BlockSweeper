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
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Play session</p>
          <h2>Ready for onchain start</h2>
        </div>
      </div>

      <p className="panel-copy">
        This scaffold now points to the deployed proxy and can call{" "}
        <code>play(weekId)</code> from MiniPay. After the transaction lands, the
        backend can generate and track the session offchain.
      </p>

      <dl className="details compact-details">
        <div>
          <dt>Current weekId</dt>
          <dd>{currentWeekId.toString()}</dd>
        </div>
        <div>
          <dt>Registry</dt>
          <dd>{contractAddress ?? "No deployment for this chain yet"}</dd>
        </div>
        {hash ? (
          <div>
            <dt>Last tx hash</dt>
            <dd>{hash}</dd>
          </div>
        ) : null}
      </dl>

      <button
        className="primary-button"
        disabled={!isConnected || !contractAddress || isPending || isConfirming}
        onClick={() => play()}
        type="button"
      >
        {isPending ? "Confirm in wallet..." : null}
        {isConfirming ? "Waiting for confirmation..." : null}
        {!isPending && !isConfirming && isConnected ? "Play Onchain" : null}
        {!isPending && !isConfirming && !isConnected ? "Connect inside MiniPay" : null}
      </button>

      {isConfirmed ? <p className="status-ok">Play transaction confirmed.</p> : null}
      {error ? <p className="status-error">{error.message}</p> : null}
    </section>
  );
}
