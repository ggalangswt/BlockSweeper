import { useEffect, useState } from "react";

import { getInjectedProvider } from "../lib/ethereum";

function parseChainId(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number.parseInt(value, 16);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function useWalletChainId() {
  const [chainId, setChainId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const injectedProvider = getInjectedProvider();

    if (!injectedProvider) {
      setChainId(undefined);
      return;
    }

    const provider = injectedProvider;

    let active = true;

    async function syncChainId() {
      try {
        const nextChainId = parseChainId(await provider.request({ method: "eth_chainId" }));
        if (active) {
          setChainId(nextChainId);
        }
      } catch {
        if (active) {
          setChainId(undefined);
        }
      }
    }

    function handleChainChanged(nextChainId: unknown) {
      if (!active) {
        return;
      }

      setChainId(parseChainId(nextChainId));
    }

    void syncChainId();
    provider.on?.("chainChanged", handleChainChanged);

    return () => {
      active = false;
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  return chainId;
}
