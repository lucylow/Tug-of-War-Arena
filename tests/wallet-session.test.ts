import { describe, expect, it } from "vitest";

import { formatAddress, formatBalance, formatWalletModeBadge, getNativeSymbol, getNetworkName, parseChainId, toHexChainId } from "../lib/web3/format";
import { formatWalletError, shouldFallbackToDemo } from "../lib/web3/errors";
import { DEMO_ACCOUNT, resolveConnectStrategy } from "../lib/web3/session";
import { decodeMatchView, formatMatchStatus } from "../lib/web3/match";

describe("wallet presentation helpers", () => {
  it("formats a demo account as a compact chip", () => {
    expect(formatAddress(DEMO_ACCOUNT)).toBe("0x7A3F...C91D");
  });

  it("labels optional, demo, and live wallet modes", () => {
    expect(formatWalletModeBadge(false, null)).toBe("OPTIONAL");
    expect(formatWalletModeBadge(true, "demo")).toBe("DEMO");
    expect(formatWalletModeBadge(true, "live")).toBe("METAMASK");
  });

  it("falls back to a demo session when MetaMask is not injected", () => {
    expect(resolveConnectStrategy(false)).toBe("demo");
    expect(resolveConnectStrategy(true)).toBe("injected");
    expect(shouldFallbackToDemo({ code: 4001 })).toBe(false);
    expect(shouldFallbackToDemo(new Error("unavailable"))).toBe(true);
    expect(formatWalletError({ code: 4001 })).toBe("Wallet connection canceled.");
  });

  it("maps Friendzone chain ids to arcade network names", () => {
    expect(getNetworkName(80002)).toBe("Polygon Amoy");
    expect(getNativeSymbol(137)).toBe("POL");
    expect(toHexChainId(80002)).toBe("0x13882");
    expect(parseChainId("0x89")).toBe(137);
    expect(formatBalance("1.23456")).toBe("1.2346");
  });

  it("decodes a live match payload into crew-readable fields", () => {
    const match = decodeMatchView([7, ["0xabc"], 1, 2, 1, 0, "1000000000000000000", 12, 9]);
    expect(match.id).toBe("7");
    expect(match.prizePool).toBe("1.0");
    expect(formatMatchStatus(match.status)).toBe("Active");
  });
});
