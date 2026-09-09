import { NETWORKS } from "@/lib/web3/config";
import type { ConnectionMode } from "@/lib/web3/types";

export function formatAddress(address: string | null | undefined): string {
  if (!address) return "";
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function toHexChainId(chainId: number): `0x${string}` {
  return `0x${chainId.toString(16)}`;
}

export function parseChainId(value: string | number | bigint | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = /^0x/i.test(trimmed) ? Number.parseInt(trimmed, 16) : Number.parseInt(trimmed, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function getNetworkName(chainId: number | null | undefined): string {
  if (chainId == null) return "Not connected";
  return NETWORKS[chainId]?.name ?? "Unknown";
}

export function getNativeSymbol(chainId: number | null | undefined): string {
  if (chainId == null) return "ETH";
  return NETWORKS[chainId]?.nativeCurrency.symbol ?? "ETH";
}

export function formatWalletModeBadge(connected: boolean, mode: ConnectionMode | null): string {
  if (!connected) return "OPTIONAL";
  return mode === "live" ? "METAMASK" : "DEMO";
}

export function formatBalance(balance: string | null | undefined, decimals = 4): string {
  if (!balance) return (0).toFixed(decimals);
  const value = Number.parseFloat(balance);
  if (!Number.isFinite(value)) return (0).toFixed(decimals);
  return value.toFixed(decimals);
}

export function isConfiguredContractAddress(address: string | null | undefined): boolean {
  return Boolean(address && /^0x[a-fA-F0-9]{40}$/.test(address));
}
