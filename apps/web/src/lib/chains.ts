import { celo, celoSepolia } from "wagmi/chains";

import { env } from "../env";

export const supportedChains = [celo, celoSepolia] as const;
export const SUPPORTED_CHAINS = supportedChains.map((chain) => chain.name);

export function getTargetChainId() {
  return env.registryAddressCelo ? celo.id : celoSepolia.id;
}

export function isSupportedChain(chainId?: number) {
  if (!chainId) {
    return false;
  }

  return supportedChains.some((chain) => chain.id === chainId);
}

export function getChainName(chainId?: number) {
  if (!chainId) {
    return "Unknown";
  }

  return supportedChains.find((chain) => chain.id === chainId)?.name ?? `Chain ${chainId}`;
}
