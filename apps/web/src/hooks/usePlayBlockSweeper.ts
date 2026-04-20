import { useMemo } from "react";
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { getBlockSweeperRegistryConfig, getCurrentWeekId } from "../lib/contracts/blockSweeper";

export function usePlayBlockSweeper() {
  const chainId = useChainId();
  const registry = useMemo(() => getBlockSweeperRegistryConfig(chainId), [chainId]);
  const { data: hash, isPending, writeContract, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: Boolean(hash),
    },
  });

  function play(weekId = getCurrentWeekId()) {
    if (!registry) {
      return;
    }

    writeContract({
      address: registry.address,
      abi: registry.abi,
      functionName: "play",
      args: [weekId],
    });
  }

  return {
    play,
    hash,
    error,
    isPending,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    reset,
    registry,
  };
}
