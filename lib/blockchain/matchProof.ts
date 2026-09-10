import { keccak256, toUtf8Bytes } from "ethers";

export type MatchProofOrigin = "demo" | "live";

export interface SerializableMatch {
  matchId: string;
  roomId: string;
  winner: "sun" | "moon" | "tie";
  sunScore: number;
  moonScore: number;
  durationMs: number;
  finishedAt: number;
}

export interface MatchProofPayload {
  origin: MatchProofOrigin;
  match: SerializableMatch;
  hash: string;
  signedBy: string | null;
  signature: string | null;
}

function asFinite(value: unknown, fallback = 0): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function serializeMatch(match: SerializableMatch): string {
  return JSON.stringify({
    durationMs: asFinite(match.durationMs),
    finishedAt: asFinite(match.finishedAt),
    matchId: String(match.matchId ?? ""),
    moonScore: asFinite(match.moonScore),
    roomId: String(match.roomId ?? ""),
    sunScore: asFinite(match.sunScore),
    winner: match.winner === "moon" || match.winner === "tie" ? match.winner : "sun",
  });
}

export function hashMatch(match: SerializableMatch | string): string {
  const serialized = typeof match === "string" ? match : serializeMatch(match);
  return keccak256(toUtf8Bytes(serialized));
}

export function createProofPayload(
  match: SerializableMatch,
  options?: { signedBy?: string | null; signature?: string | null; origin?: MatchProofOrigin },
): MatchProofPayload {
  return {
    origin: options?.origin ?? (options?.signature ? "live" : "demo"),
    match: {
      matchId: String(match.matchId ?? ""),
      roomId: String(match.roomId ?? ""),
      winner: match.winner === "moon" || match.winner === "tie" ? match.winner : "sun",
      sunScore: asFinite(match.sunScore),
      moonScore: asFinite(match.moonScore),
      durationMs: asFinite(match.durationMs),
      finishedAt: asFinite(match.finishedAt),
    },
    hash: hashMatch(match),
    signedBy: options?.signedBy ?? null,
    signature: options?.signature ?? null,
  };
}

export function verifyProofPayload(payload: MatchProofPayload | null | undefined): boolean {
  if (!payload || typeof payload !== "object") return false;
  if (!payload.match || typeof payload.hash !== "string") return false;
  return payload.hash === hashMatch(payload.match);
}

export type TeamSide = "sun" | "moon";

export interface MatchProofInput {
  matchId: string;
  playerId: string;
  playerTeam: TeamSide;
  winner: TeamSide;
  pulls: number;
  durationMs: number;
  createdAt: number;
}

export function serializeMatchProof(input: MatchProofInput): string {
  if (!input.matchId || !input.playerId) {
    throw new Error("Match proof requires matchId and playerId");
  }
  if (input.playerTeam !== "sun" && input.playerTeam !== "moon") {
    throw new Error("Invalid team");
  }
  if (input.winner !== "sun" && input.winner !== "moon") {
    throw new Error("Invalid winner");
  }
  if (!Number.isFinite(input.pulls) || input.pulls < 0) {
    throw new Error("Invalid pulls");
  }
  return [
    input.matchId,
    input.playerId,
    input.playerTeam,
    input.winner,
    input.pulls,
    input.durationMs,
    input.createdAt,
  ].join("|");
}

export function hashMatchProof(input: MatchProofInput | string): string {
  const canonical = typeof input === "string" ? input : serializeMatchProof(input);
  return keccak256(toUtf8Bytes(canonical));
}

export function createMatchProof(
  input: MatchProofInput,
  options?: { signature?: string | null; signedBy?: string | null; isDemo?: boolean },
): {
  canonical: string;
  hash: string;
  signature: string;
  isDemo: boolean;
} {
  const canonical = serializeMatchProof(input);
  const isDemo = options?.isDemo ?? !options?.signature;
  return {
    canonical,
    hash: hashMatchProof(canonical),
    signature: options?.signature ?? "DEMO_SIGNATURE",
    isDemo,
  };
}
