import { arbitrum, arbitrumSepolia, celo, celoSepolia, mainnet } from "wagmi/chains";

import { env } from "../env";

export const supportedChains = [celo, celoSepolia] as const;
export const SUPPORTED_CHAINS = supportedChains.map((chain) => chain.name);
const displayChains = [celo, celoSepolia, mainnet, arbitrum, arbitrumSepolia] as const;

export function getTargetChainId() {
  return env.registryAddressCelo ? celo.id : celoSepolia.id;
}

export function getTargetChainName() {
  return getChainName(getTargetChainId());
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

  return displayChains.find((chain) => chain.id === chainId)?.name ?? `Chain ${chainId}`;
}
