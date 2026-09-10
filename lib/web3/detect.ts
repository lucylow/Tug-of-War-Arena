import type { Eip1193Like } from "@/lib/web3/types";

type InjectedEthereum = Eip1193Like & {
  isMetaMask?: boolean;
  providers?: InjectedEthereum[];
};

function isRequestProvider(value: unknown): value is InjectedEthereum {
  if (!value || typeof value !== "object") return false;
  return typeof (value as { request?: unknown }).request === "function";
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

export function getInjectedProvider(): Eip1193Like | null {
  const ethereum = (globalThis as { ethereum?: InjectedEthereum }).ethereum;
  const candidates = injectedCandidates(ethereum);
  if (candidates.length === 0) return null;
  return candidates.find((provider) => provider.isMetaMask) ?? candidates[0] ?? null;
}

export function hasInjectedMetaMask(): boolean {
  return injectedCandidates((globalThis as { ethereum?: InjectedEthereum }).ethereum).some(
    (provider) => provider.isMetaMask,
  );
}

export async function isLiveWalletAvailable(): Promise<boolean> {
  if (getInjectedProvider()) return true;
  try {
    const { Linking, Platform } = await import("react-native");
    if (Platform.OS === "web") return false;
    return await Linking.canOpenURL("metamask://");
  } catch {
    return false;
  }
}
