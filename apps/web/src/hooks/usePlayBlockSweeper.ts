import { useMemo } from "react";
import { useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { getBlockSweeperRegistryConfig, getCurrentWeekId } from "../lib/contracts/blockSweeper";
import { getTargetChainId } from "../lib/chains";

export function usePlayBlockSweeper() {
  const chainId = useChainId();
  const targetChainId = getTargetChainId();
  const registry = useMemo(
    () => getBlockSweeperRegistryConfig(targetChainId),
    [targetChainId],
  );
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { data: hash, isPending, writeContract, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: Boolean(hash),
    },
  });

  async function play(weekId = getCurrentWeekId()) {
    if (!registry) {
      return;
    }

    if (chainId !== targetChainId) {
      await switchChainAsync({ chainId: targetChainId });
    }

    writeContract({
      chainId: targetChainId,
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
    isPending: isPending || isSwitchingChain,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    reset,
    registry,
    targetChainId,
  };
}
