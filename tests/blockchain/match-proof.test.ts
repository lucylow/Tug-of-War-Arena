import { describe, expect, it } from "vitest";

import { createMatchProof, hashMatchProof, serializeMatchProof } from "../../lib/blockchain/matchProof";
import { BlockchainPublisher } from "../../lib/blockchain/publisher";

const match = {
  matchId: "demo-match-001",
  playerId: "demo-player-001",
  playerTeam: "sun" as const,
  winner: "sun" as const,
  pulls: 42,
  durationMs: 42000,
  createdAt: 20260910,
};

describe("match proofs", () => {
  it("hashes the same match the same way regardless of object key order", () => {
    const first = hashMatchProof(match);
    const second = hashMatchProof({
      createdAt: match.createdAt,
      durationMs: match.durationMs,
      matchId: match.matchId,
      playerId: match.playerId,
      playerTeam: match.playerTeam,
      pulls: match.pulls,
      winner: match.winner,
    });
    expect(first).toBe(second);
    expect(serializeMatchProof(match)).toBe("demo-match-001|demo-player-001|sun|sun|42|42000|20260910");
  });

  it("changes hash when a field changes", () => {
    expect(hashMatchProof({ ...match, pulls: 43 })).not.toBe(hashMatchProof(match));
  });

  it("rejects invalid fields", () => {
    expect(() => serializeMatchProof({ ...match, pulls: -1 })).toThrow("Invalid pulls");
    expect(() => serializeMatchProof({ ...match, playerTeam: "star" as never })).toThrow("Invalid team");
  });

  it("marks demo signatures as demo and never stores secrets", () => {
    const proof = createMatchProof(match);
    expect(proof.isDemo).toBe(true);
    expect(proof.signature).toBe("DEMO_SIGNATURE");
    expect(JSON.stringify(proof)).not.toMatch(/PRIVATE_KEY|MNEMONIC|SEED_PHRASE/i);
  });

  it("keeps live publishing behind the feature flag", () => {
    const publisher = new BlockchainPublisher();
    const published = publisher.publishMatchProof(match, { isDemo: true });
    expect(published.isDemo).toBe(true);
    expect(published.explorerUrl).toBeNull();
    expect(publisher.getProof("demo-match-001")?.hash).toBe(published.hash);
  });
});
