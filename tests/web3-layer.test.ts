import { describe, expect, it } from "vitest";

import {
  ARENA_MATCH_DURATION_SECONDS,
  ARENA_WIN_THRESHOLD,
  FRIENDZONE_ADDRESSES,
  POLYGON_AMOY_CHAIN_ID,
  getFriendzoneAddresses,
  isContractsConfigured,
} from "../lib/web3/addresses";
import { TUG_OF_WAR_ARENA_ABI } from "../lib/web3/abi";
import { hasReachedWinningLine } from "../lib/game-rules";

describe("Friendzone web3 client boundary", () => {
  it("keeps on-chain win threshold aligned with the arena rope line", () => {
    expect(ARENA_WIN_THRESHOLD).toBe(44);
    expect(hasReachedWinningLine(ARENA_WIN_THRESHOLD)).toBe(true);
    expect(ARENA_MATCH_DURATION_SECONDS).toBe(30);
  });

  it("treats unset deployment addresses as an offline-safe unconfigured state", () => {
    const amoy = getFriendzoneAddresses(POLYGON_AMOY_CHAIN_ID);
    expect(isContractsConfigured(amoy)).toBe(false);
    expect(isContractsConfigured(FRIENDZONE_ADDRESSES[31337]!)).toBe(false);
  });

  it("exposes settle and match-read ABIs for a future wallet connection", () => {
    expect(TUG_OF_WAR_ARENA_ABI.some((item) => item.includes("settleMatch"))).toBe(true);
    expect(TUG_OF_WAR_ARENA_ABI.some((item) => item.includes("createMatch"))).toBe(true);
    expect(TUG_OF_WAR_ARENA_ABI.some((item) => item.includes("getMatch"))).toBe(true);
    expect(TUG_OF_WAR_ARENA_ABI.some((item) => item.includes("error InvalidName()"))).toBe(true);
  });
});
