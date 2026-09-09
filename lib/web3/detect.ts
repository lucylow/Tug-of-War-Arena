import { Linking, Platform } from "react-native";

import type { Eip1193Like } from "@/lib/web3/types";

export function getInjectedProvider(): Eip1193Like | null {
  const ethereum = (globalThis as { ethereum?: Eip1193Like }).ethereum;
  if (ethereum && typeof ethereum.request === "function") return ethereum;
  return null;
}

export async function isLiveWalletAvailable(): Promise<boolean> {
  if (getInjectedProvider()) return true;
  if (Platform.OS === "web") return false;
  try {
    return await Linking.canOpenURL("metamask://");
  } catch {
    return false;
  }
}
