import { useEffect, useState } from "react";

import { getWeeklyStats, type WeeklyStatsResponse } from "../lib/api/blocksweeperApi";

export function useWeeklyStats(walletAddress: string | null, weekId: number, refreshKey?: string | number) {
  const [stats, setStats] = useState<WeeklyStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!walletAddress) {
      setStats(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const safeWalletAddress = walletAddress;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getWeeklyStats(safeWalletAddress, weekId);
        if (!cancelled) {
          setStats(response);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load player stats");
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
  }, [refreshKey, walletAddress, weekId]);

  return {
    stats,
    isLoading,
    error,
  };
}
