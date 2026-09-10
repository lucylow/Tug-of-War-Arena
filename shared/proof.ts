export type ProofStatus = "demo" | "signed" | "confirmed" | "invalid";

export interface MatchProof {
  id: string;
  matchId: string;
  playerId: string;
  result: "win" | "loss";
  pulls: number;
  hash: string;
  timestamp: number;
  origin: "demo" | "live";
  walletAddress?: string;
}

export type ProofVerification = "valid" | "invalid" | "demo";

function isHexHash(value: string): boolean {
  return /^0x[a-fA-F0-9]{16,64}$/.test(value);
}

export function verifyMatchProof(proof: MatchProof): ProofVerification {
  if (!proof || typeof proof !== "object") return "invalid";
  if (!proof.matchId || !proof.playerId || !proof.hash) return "invalid";
  if (!Number.isFinite(proof.timestamp) || proof.timestamp <= 0) return "invalid";
  if (proof.result !== "win" && proof.result !== "loss") return "invalid";
  if (!Number.isFinite(proof.pulls) || proof.pulls < 0) return "invalid";
  if (!isHexHash(proof.hash)) return "invalid";
  if (proof.origin === "demo") return "demo";
  return "valid";
}

export function proofDisplayLabel(status: ProofStatus): string {
  switch (status) {
    case "confirmed":
      return "CONFIRMED ON-CHAIN";
    case "signed":
      return "SIGNED PROOF";
    case "invalid":
      return "INVALID PROOF";
    default:
      return "DEMO PROOF";
  }
}
