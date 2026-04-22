import type { EIP1193Provider } from "viem";

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
