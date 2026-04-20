import { celo, celoSepolia } from "wagmi/chains";
import type { Address } from "viem";

export const blockSweeperDeployments = {
  [celoSepolia.id]: {
    chainId: celoSepolia.id,
    proxyAddress: "0xe8701E0C2cdb6708d98343572E63CFe7118A62C8" as Address,
    implementationAddress: "0x9803BE5349EeDF7C28aC1914b743757ce043b7cC" as Address,
    deploymentTxHash:
      "0x4f9b7e5ac7485bbc4f50702b210e9bc23b06d4a9e8011b10e64e81c6252e930e" as const,
  },
  [celo.id]: {
    chainId: celo.id,
    proxyAddress: undefined,
    implementationAddress: undefined,
    deploymentTxHash: undefined,
  },
} as const;

export function getBlockSweeperRegistryAddress(chainId?: number) {
  if (!chainId) {
    return undefined;
  }

  return blockSweeperDeployments[chainId as keyof typeof blockSweeperDeployments]?.proxyAddress;
}
