import type { Address } from "viem";

import { blockSweeperRegistryAbi } from "./blocksweeperRegistryAbi";
import { getBlockSweeperRegistryAddress } from "./deployments";

export { blockSweeperRegistryAbi };

const CUSTOM_WEEK_START_MS = Date.parse("2026-04-18T17:00:00.000Z");
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getCurrentWeekId(timestamp = Date.now()) {
  const elapsedWeeks = Math.floor((timestamp - CUSTOM_WEEK_START_MS) / WEEK_MS);
  return BigInt(Math.max(1, elapsedWeeks + 1));
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
