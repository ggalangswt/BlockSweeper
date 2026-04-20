import { useEffect, useRef } from "react";
import { useAccount, useConnect } from "wagmi";

import { hasInjectedProvider } from "../lib/ethereum";

export function useAutoConnect() {
  const attemptedRef = useRef(false);
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();

  useEffect(() => {
    if (attemptedRef.current || isConnected || isPending || !hasInjectedProvider()) {
      return;
    }

    const injectedConnector = connectors.find(
      (connector) => connector.type === "injected",
    );

    if (!injectedConnector) {
      return;
    }

    attemptedRef.current = true;
    connect({ connector: injectedConnector });
  }, [connect, connectors, isConnected, isPending]);
}
