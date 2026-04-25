import { useCallback, useState, useSyncExternalStore } from "react";
import { celo, celoSepolia } from "wagmi/chains";

import { env } from "../env";
import { getChainName } from "../lib/chains";
import { ensureInjectedChain, hasInjectedProvider } from "../lib/ethereum";

const STORAGE_KEY = "blocksweeper_target_chain";

type TargetChainId = typeof celo.id | typeof celoSepolia.id;

const VALID_IDS = new Set<number>([celo.id, celoSepolia.id]);

function getStoredChainId(): TargetChainId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = Number(raw);
      if (VALID_IDS.has(parsed)) {
        return parsed as TargetChainId;
      }
    }
  } catch {
    // ignore
  }

  // Default: celo mainnet if env has it, else sepolia
  return env.registryAddressCelo ? celo.id : celoSepolia.id;
}

// Subscribers for useSyncExternalStore
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function useTargetChain() {
  const targetChainId = useSyncExternalStore(subscribe, getStoredChainId, getStoredChainId);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const setTargetChainId = useCallback((chainId: TargetChainId) => {
    localStorage.setItem(STORAGE_KEY, String(chainId));
    notifyListeners();
  }, []);

  const toggleChain = useCallback(async () => {
    const current = getStoredChainId();
    const next: TargetChainId = current === celo.id ? celoSepolia.id : celo.id;

    setSwitchError(null);
    setIsSwitching(true);

    try {
      // Switch the app's target chain
      setTargetChainId(next);

      // Also switch the wallet network if a provider is available
      if (hasInjectedProvider()) {
        await ensureInjectedChain(next);
      }
    } catch (error) {
      // Revert app target chain if wallet switch failed
      setTargetChainId(current);

      const message =
        error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("user rejected") || message.includes("user denied")) {
        setSwitchError("Network switch cancelled.");
      } else {
        setSwitchError("Failed to switch network. Try manually in your wallet.");
      }
    } finally {
      setIsSwitching(false);
    }
  }, [setTargetChainId]);

  const isMainnet = targetChainId === celo.id;
  const targetChainName = getChainName(targetChainId);

  return {
    targetChainId,
    targetChainName,
    isMainnet,
    isSwitching,
    switchError,
    setTargetChainId,
    toggleChain,
    clearSwitchError: () => setSwitchError(null),
  };
}

