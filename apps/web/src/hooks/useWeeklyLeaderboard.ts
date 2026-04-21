import { useEffect, useState } from "react";

import { getLeaderboard, type LeaderboardEntry } from "../lib/api/blocksweeperApi";

export function useWeeklyLeaderboard(weekId: number, refreshKey?: string | number) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getLeaderboard(weekId);
        if (!cancelled) {
          setEntries(response.entries);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load leaderboard");
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
  }, [refreshKey, weekId]);

  return {
    entries,
    isLoading,
    error,
  };
}
