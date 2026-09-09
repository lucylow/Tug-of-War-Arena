import { describe, expect, it } from "vitest";

import {
  formatAddress,
  formatBalance,
  formatWalletModeBadge,
  getNativeSymbol,
  getNetworkName,
  isConfiguredContractAddress,
  parseChainId,
  toHexChainId,
} from "../../lib/web3/format";

describe("wallet format helpers", () => {
  it("shortens a full account while preserving short fallbacks", () => {
    expect(formatAddress("0x7A3F00000000000000000000000000000000C91D")).toBe("0x7A3F...C91D");
    expect(formatAddress("0x7A3F")).toBe("0x7A3F");
    expect(formatAddress(null)).toBe("");
  });

  it("converts and parses chain IDs without treating invalid values as connected", () => {
    expect(toHexChainId(137)).toBe("0x89");
    expect(toHexChainId(80002)).toBe("0x13882");
    expect(parseChainId("0x89")).toBe(137);
    expect(parseChainId("137")).toBe(137);
    expect(parseChainId(80002n)).toBe(80002);
    expect(parseChainId("not-a-chain")).toBeNull();
    expect(parseChainId("")).toBeNull();
  });

  it("maps known networks and keeps unknown chains explicit", () => {
    expect(getNetworkName(137)).toBe("Polygon");
    expect(getNetworkName(80002)).toBe("Polygon Amoy");
    expect(getNetworkName(1)).toBe("Ethereum");
    expect(getNetworkName(null)).toBe("Not connected");
    expect(getNetworkName(999)).toBe("Unknown");
    expect(getNativeSymbol(137)).toBe("POL");
    expect(getNativeSymbol(1)).toBe("ETH");
  });

  it("keeps the home wallet badge honest across live, demo, and disconnected states", () => {
    expect(formatWalletModeBadge(false, null)).toBe("OPTIONAL");
    expect(formatWalletModeBadge(true, "demo")).toBe("DEMO");
    expect(formatWalletModeBadge(true, "live")).toBe("METAMASK");
  });

  it("formats balances and rejects placeholder contract addresses", () => {
    expect(formatBalance("1.23456")).toBe("1.2346");
    expect(formatBalance(null)).toBe("0.0000");
    expect(formatBalance("not-a-number")).toBe("0.0000");
    expect(isConfiguredContractAddress("0xYourGameContract")).toBe(false);
    expect(isConfiguredContractAddress("0x0000000000000000000000000000000000000000")).toBe(false);
    expect(isConfiguredContractAddress("0x0000000000000000000000000000000000000001")).toBe(true);
  });
});
