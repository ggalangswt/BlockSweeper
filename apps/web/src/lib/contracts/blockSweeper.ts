import type { Address } from "viem";

import { blockSweeperRegistryAbi } from "./blocksweeperRegistryAbi";
import { getBlockSweeperRegistryAddress } from "./deployments";

export { blockSweeperRegistryAbi };

export function getCurrentWeekId(timestamp = Date.now()) {
  return BigInt(Math.floor(timestamp / 1000 / (7 * 24 * 60 * 60)));
}

export function getBlockSweeperRegistryConfig(chainId?: number) {
  const address = getBlockSweeperRegistryAddress(chainId);

  if (!address) {
    return undefined;
  }

  return {
    address: address as Address,
    abi: blockSweeperRegistryAbi,
  } as const;
}
