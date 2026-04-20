import { useAccount, useChainId } from "wagmi";

import { SUPPORTED_CHAINS, getChainName, isSupportedChain } from "../lib/chains";

export function WalletStatusCard() {
  const { address, connector, isConnected, status } = useAccount();
  const chainId = useChainId();
  const supported = isSupportedChain(chainId);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Wallet</p>
          <h2>Connection status</h2>
        </div>
        <span className={`pill ${supported ? "pill-ok" : "pill-warn"}`}>
          {supported ? "Supported network" : "Switch to Celo"}
        </span>
      </div>

      <dl className="details">
        <div>
          <dt>Status</dt>
          <dd>{status}</dd>
        </div>
        <div>
          <dt>Connector</dt>
          <dd>{connector?.name ?? "Injected wallet"}</dd>
        </div>
        <div>
          <dt>Address</dt>
          <dd>{isConnected ? address : "Not connected"}</dd>
        </div>
        <div>
          <dt>Network</dt>
          <dd>{getChainName(chainId)}</dd>
        </div>
        <div>
          <dt>Allowed chains</dt>
          <dd>{SUPPORTED_CHAINS.join(", ")}</dd>
        </div>
      </dl>
    </section>
  );
}
