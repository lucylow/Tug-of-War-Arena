import { describe, expect, it } from "vitest";

import { assertSupportedChain, createProofPayload, formatChainId, hashMatch, serializeMatch, verifyProofPayload } from "../../lib/blockchain";
import { isWrongNetwork } from "../../lib/blockchain/network";

describe("match proof", () => {
  it("hashes a canonical match without requiring a wallet", () => {
    const match = {
      matchId: "match_friday",
      roomId: "room_friday",
      winner: "sun" as const,
      sunScore: 428,
      moonScore: 381,
      durationMs: 42000,
      finishedAt: 20260909,
    };
    const serialized = serializeMatch(match);
    const hash = hashMatch(match);
    expect(serialized).toContain("room_friday");
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(hashMatch(serialized)).toBe(hash);
    const payload = createProofPayload(match);
    expect(payload.origin).toBe("demo");
    expect(payload.signedBy).toBeNull();
    expect(verifyProofPayload(payload)).toBe(true);
    expect(verifyProofPayload({ ...payload, hash: "0x00" })).toBe(false);
  });
});

describe("chain handling", () => {
  it("formats and rejects unsupported chains without throwing from formatters", () => {
    expect(formatChainId(80002)).toBe("0x13882");
    expect(isWrongNetwork(999999)).toBe(true);
    expect(() => assertSupportedChain(999999)).toThrow(/not supported/);
    expect(() => assertSupportedChain(80002)).not.toThrow();
  });
});
