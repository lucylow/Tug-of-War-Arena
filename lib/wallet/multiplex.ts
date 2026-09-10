import type { Eip1193Like } from "@/lib/web3/types";

type Injected = Eip1193Like & {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRainbow?: boolean;
  providers?: Injected[];
};

function isProvider(value: unknown): value is Injected {
  return Boolean(value) && typeof value === "object" && typeof (value as { request?: unknown }).request === "function";
}

/**
 * Choose an injected provider deterministically.
 * Prefers MetaMask when identified, otherwise the first request() provider.
 * Does not mutate the shared global provider object.
 */
export function selectInjectedProvider(ethereum: unknown): Eip1193Like | null {
  if (!isProvider(ethereum)) return null;
  const listed = Array.isArray(ethereum.providers) ? ethereum.providers.filter(isProvider) : [];
  const candidates = [...listed, ethereum];
  return candidates.find((provider) => provider.isMetaMask) ?? candidates[0] ?? null;
}

export function describeInjectedProviders(ethereum: unknown): string[] {
  if (!isProvider(ethereum)) return [];
  const listed = Array.isArray(ethereum.providers) ? ethereum.providers.filter(isProvider) : [ethereum];
  return listed.map((provider) => {
    if (provider.isMetaMask) return "metamask";
    if (provider.isCoinbaseWallet) return "coinbase";
    if (provider.isRainbow) return "rainbow";
    return "unknown";
  });
}
