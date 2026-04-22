import { useEffect, useRef } from "react";
import { useAccount, useChainId, useConnect, useSwitchChain } from "wagmi";

import { hasInjectedProvider, isMiniPayProvider } from "../lib/ethereum";
import { getTargetChainId } from "../lib/chains";

export function useAutoConnect() {
  const attemptedConnectRef = useRef(false);
  const attemptedSwitchRef = useRef<number | null>(null);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending } = useConnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const targetChainId = getTargetChainId();

  useEffect(() => {
    if (attemptedConnectRef.current || isConnected || isPending || !hasInjectedProvider()) {
      return;
    }

    const injectedConnector = connectors.find(
      (connector) => connector.type === "injected",
    );

    if (!injectedConnector) {
      return;
    }

    attemptedConnectRef.current = true;
    connect({ connector: injectedConnector });
  }, [connect, connectors, isConnected, isPending]);

  useEffect(() => {
    if (isMiniPayProvider()) {
      attemptedSwitchRef.current = null;
      return;
    }

    if (!isConnected || !chainId || chainId === targetChainId || isSwitching) {
      if (!isConnected || chainId === targetChainId) {
        attemptedSwitchRef.current = null;
      }
      return;
    }

    if (attemptedSwitchRef.current === targetChainId) {
      return;
    }

    attemptedSwitchRef.current = targetChainId;
    switchChain({ chainId: targetChainId });
  }, [chainId, isConnected, isSwitching, switchChain, targetChainId]);
}
