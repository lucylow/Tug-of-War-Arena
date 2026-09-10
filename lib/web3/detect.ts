import { canAccessBrowserEthereum } from "@/lib/runtime";
import { canAccessInjectedEthereum } from "@/lib/runtime/runtime";
import { getBrowserEthereumProvider, hasInjectedMetaMask as hasMetaMask } from "@/lib/blockchain/wallet/provider";
import type { Eip1193Like } from "@/lib/web3/types";

export function getInjectedProvider(): Eip1193Like | null {
  if (!canAccessBrowserEthereum() || !canAccessInjectedEthereum()) return null;
  return getBrowserEthereumProvider();
}

export function hasInjectedMetaMask(): boolean {
  if (!canAccessBrowserEthereum() || !canAccessInjectedEthereum()) return false;
  return hasMetaMask();
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
