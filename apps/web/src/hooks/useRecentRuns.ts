import { useEffect, useState } from "react";

import { getRecentRuns, type RecentRun } from "../lib/api/blocksweeperApi";

export function useRecentRuns(walletAddress: string | null, refreshKey?: string | number) {
  const [runs, setRuns] = useState<RecentRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!walletAddress) {
      setRuns([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const safeWalletAddress = walletAddress;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getRecentRuns(safeWalletAddress);
        if (!cancelled) {
          setRuns(response.runs);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load recent runs");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [refreshKey, walletAddress]);

  return {
    runs,
    isLoading,
    error,
  };
}
