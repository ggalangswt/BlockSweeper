import type { EIP1193Provider } from "viem";
import { celo, celoSepolia } from "wagmi/chains";

export function getInjectedProvider(): EIP1193Provider | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.ethereum as EIP1193Provider | undefined;
}

export function hasInjectedProvider() {
  return Boolean(getInjectedProvider());
}

export function isMiniPayProvider() {
  const provider = getInjectedProvider() as (EIP1193Provider & { isMiniPay?: boolean }) | undefined;
  return Boolean(provider?.isMiniPay);
}

export function getProviderName() {
  if (isMiniPayProvider()) {
    return "MiniPay";
  }

  if (hasInjectedProvider()) {
    return "Injected wallet";
  }

  return "No wallet";
}

type AddEthereumChainParameter = {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

const chainParameters: Record<number, AddEthereumChainParameter> = {
  [celo.id]: {
    chainId: `0x${celo.id.toString(16)}`,
    chainName: "Celo",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18,
    },
    rpcUrls: ["https://forno.celo.org"],
    blockExplorerUrls: ["https://celoscan.io"],
  },
  [celoSepolia.id]: {
    chainId: `0x${celoSepolia.id.toString(16)}`,
    chainName: "Celo Sepolia",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18,
    },
    rpcUrls: ["https://forno.celo-sepolia.celo-testnet.org"],
    blockExplorerUrls: ["https://celo-sepolia.blockscout.com"],
  },
};

function isChainMissingError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const rpcError = error as Error & { code?: number };
  const normalized = error.message.toLowerCase();
  return rpcError.code === 4902 || normalized.includes("unrecognized chain") || normalized.includes("unknown chain");
}

export async function ensureInjectedChain(chainId: number) {
  const provider = getInjectedProvider();
  const params = chainParameters[chainId];

  if (!provider) {
    throw new Error("Wallet not connected.");
  }

  if (!params) {
    throw new Error(`Unsupported chain ${chainId}.`);
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: params.chainId }],
    });
    return;
  } catch (error) {
    if (!isChainMissingError(error)) {
      throw error;
    }
  }

  await provider.request({
    method: "wallet_addEthereumChain",
    params: [params],
  });

  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: params.chainId }],
  });
}
