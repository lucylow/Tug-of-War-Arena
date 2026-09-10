import { selectInjectedProvider } from "@/lib/wallet/multiplex";
import { canAccessInjectedEthereum } from "@/lib/runtime/runtime";
import type { Eip1193Provider } from "./types";

type InjectedEthereum = Eip1193Provider & {
  isMetaMask?: boolean;
  providers?: InjectedEthereum[];
};

function isRequestProvider(value: unknown): value is InjectedEthereum {
  if (!value || typeof value !== "object") return false;
  return typeof (value as { request?: unknown }).request === "function";
}

function readWindowEthereum(): unknown {
  if (!canAccessInjectedEthereum()) return undefined;
  try {
    if (typeof window === "undefined") {
      return (globalThis as { ethereum?: unknown }).ethereum;
    }
    const candidate = (window as Window & { ethereum?: unknown }).ethereum;
    if (candidate) return candidate;
    return (globalThis as { ethereum?: unknown }).ethereum;
  } catch {
    return undefined;
  }
}

function injectedCandidates(ethereum: InjectedEthereum | undefined): InjectedEthereum[] {
  if (!ethereum) return [];
  const listed = Array.isArray(ethereum.providers) ? ethereum.providers : [];
  const candidates: InjectedEthereum[] = [];
  for (const provider of [...listed, ethereum]) {
    if (isRequestProvider(provider)) candidates.push(provider);
  }
  return candidates;
}

export function getBrowserEthereumProvider(): Eip1193Provider | null {
  if (!canAccessInjectedEthereum()) return null;

  const candidate = readWindowEthereum();
  if (!candidate) return null;
  if (typeof candidate !== "object" || candidate === null) return null;
  if (!isRequestProvider(candidate) && !Array.isArray((candidate as InjectedEthereum).providers)) {
    return null;
  }

  return selectInjectedProvider(candidate) as Eip1193Provider | null;
}

export function hasInjectedMetaMask(): boolean {
  if (!canAccessInjectedEthereum()) return false;
  return injectedCandidates(readWindowEthereum() as InjectedEthereum | undefined).some((provider) => provider.isMetaMask);
}
