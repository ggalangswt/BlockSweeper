import { useAccount } from "wagmi";

import { SUPPORTED_CHAINS, getChainName, isSupportedChain } from "../lib/chains";
import { isMiniPayProvider } from "../lib/ethereum";
import { useWalletChainId } from "../hooks/useWalletChainId";

type WalletStatusCardProps = {
  isMainnet: boolean;
  targetChainName: string;
  isSwitching: boolean;
  switchError: string | null;
  onToggleChain: () => void;
};

export function WalletStatusCard({ isMainnet, targetChainName, isSwitching, switchError, onToggleChain }: WalletStatusCardProps) {
  const { address, connector, isConnected, status } = useAccount();
  const chainId = useWalletChainId();
  const supported = isSupportedChain(chainId);
  const readinessLabel = supported ? "Ready to play" : "Wrong network";
  const shortAddress = isConnected ? `${address?.slice(0, 8)}...${address?.slice(-6)}` : "Not connected";

  return (
    <section className="panel wallet-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Profile</p>
          <h2>Profile</h2>
        </div>
        <span className={`pill ${supported ? "pill-ok" : "pill-warn"}`}>
          {supported ? "Ready" : "Switch"}
        </span>
      </div>

      <div className="wallet-badge wallet-badge-compact">
        <span className="wallet-dot" />
        <span>{readinessLabel}</span>
      </div>

      <div className="wallet-identity">
        <div className="wallet-avatar">{isConnected ? "W" : "?"}</div>
        <div className="wallet-copy">
          <p className="wallet-name">{isConnected ? "MiniPay Wallet" : "Wallet offline"}</p>
          <p className="wallet-handle">{isConnected ? shortAddress : "Open inside MiniPay"}</p>
        </div>
      </div>

      <dl className="details wallet-grid wallet-grid-compact">
        <div>
          <dt>Status</dt>
          <dd>{readinessLabel}</dd>
        </div>
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
          <dd>{shortAddress}</dd>
        </div>
        <div>
          <dt>Current network</dt>
          <dd>{getChainName(chainId)}</dd>
        </div>
        <div>
          <dt>Target network</dt>
          <dd>{targetChainName}</dd>
        </div>
      </dl>

      <button
        className="chain-switch-button"
        disabled={isSwitching}
        onClick={() => void onToggleChain()}
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 10L1 7L4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 6L15 9L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1 7H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M15 9H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {isSwitching ? "Switching network..." : `Switch to ${isMainnet ? "Alfajores (Testnet)" : "Celo (Mainnet)"}`}
      </button>

      {switchError ? <p className="status-error">{switchError}</p> : null}

      {!supported && isConnected ? (
        <div className="network-banner network-banner-compact" role="alert">
          <p className="network-banner-title">Wrong network</p>
          <p>
            {isMiniPayProvider()
              ? `MiniPay is on the wrong network. Open Settings > Developer Settings > Use Testnet to switch to ${targetChainName}.`
              : `Switch your wallet to ${targetChainName} before starting a run.`}
          </p>
        </div>
      ) : null}

      <p className="panel-copy supported-copy">Supports {SUPPORTED_CHAINS.join(" and ")}</p>
    </section>
  );
}

