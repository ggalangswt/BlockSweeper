import { useAccount, useChainId } from "wagmi";

import { SUPPORTED_CHAINS, getChainName, isSupportedChain } from "../lib/chains";

export function WalletStatusCard() {
  const { address, connector, isConnected, status } = useAccount();
  const chainId = useChainId();
  const supported = isSupportedChain(chainId);

  return (
    <section className="panel wallet-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Profile</p>
          <h2>Wallet</h2>
        </div>
        <span className={`pill ${supported ? "pill-ok" : "pill-warn"}`}>
          {supported ? "Supported network" : "Switch to Celo"}
        </span>
      </div>

      <div className="wallet-badge">
        <span className="wallet-dot" />
        <span>{supported ? "Ready to play" : "Network check"}</span>
      </div>

      <div className="wallet-identity">
        <div className="wallet-avatar">{isConnected ? "W" : "?"}</div>
        <div>
          <p className="wallet-name">{isConnected ? "MiniPay Wallet" : "Wallet offline"}</p>
          <p className="wallet-handle">{isConnected ? address : "Open inside MiniPay"}</p>
        </div>
      </div>

      <dl className="details wallet-grid">
        <div>
          <dt>Wallet</dt>
          <dd>{isConnected ? "Connected" : status}</dd>
        </div>
        <div>
          <dt>Provider</dt>
          <dd>{connector?.name ?? "Injected wallet"}</dd>
        </div>
        <div>
          <dt>Address</dt>
          <dd>{isConnected ? `${address?.slice(0, 8)}...${address?.slice(-6)}` : "Not connected"}</dd>
        </div>
        <div>
          <dt>Network</dt>
          <dd>{getChainName(chainId)}</dd>
        </div>
      </dl>

      <p className="panel-copy supported-copy">Supports {SUPPORTED_CHAINS.join(" and ")}</p>
    </section>
  );
}
