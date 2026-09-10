import { z } from "zod";

import { verifyMatchProof, type MatchProof } from "../shared/proof";
import { publicProcedure, router } from "./_core/trpc";

const HEX_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const ROOM_CODE = /^[A-Z0-9]{5}$/;
const TEAMS = ["sun", "moon"] as const;

const demoRooms = [
  { id: "room_friday", code: "731XZ", players: ["p1", "p2", "p3", "p4", "p5"], maxPlayers: 8, expiresAt: Date.now() + 86_400_000 },
  { id: "room_warmup", code: "92KQF", players: ["p6", "p7", "p8"], maxPlayers: 8, expiresAt: Date.now() + 86_400_000 },
  { id: "room_champion", code: "4JTZ2", players: ["a", "b", "c", "d", "e", "f", "g"], maxPlayers: 8, expiresAt: Date.now() + 86_400_000 },
];

const proofLimiter = new Map<string, number>();

export function validateRoomJoin(input: { roomCode: string; playerId: string; team: string }) {
  if (!ROOM_CODE.test(input.roomCode)) return { ok: false as const, reason: "invalid_room" };
  const room = demoRooms.find((item) => item.code === input.roomCode);
  if (!room) return { ok: false as const, reason: "missing" };
  if (room.expiresAt < Date.now()) return { ok: false as const, reason: "expired" };
  if (room.players.length >= room.maxPlayers) return { ok: false as const, reason: "full" };
  if (room.players.includes(input.playerId)) return { ok: false as const, reason: "duplicate" };
  if (!TEAMS.includes(input.team as (typeof TEAMS)[number])) return { ok: false as const, reason: "invalid_team" };
  return { ok: true as const, room };
}

export const friendzoneRouter = router({
  matchProof: publicProcedure
    .input(
      z.object({
        matchId: z.string().min(1).max(64),
        playerId: z.string().min(1).max(64),
        walletAddress: z.string().regex(HEX_ADDRESS).optional(),
        proofHash: z.string().regex(/^0x[a-fA-F0-9]{16,64}$/),
      }),
    )
    .mutation(({ input }) => {
      const last = proofLimiter.get(input.playerId) ?? 0;
      if (Date.now() - last < 3_000) {
        return { ok: false, reason: "rate_limited" as const };
      }
      proofLimiter.set(input.playerId, Date.now());
      const proof: MatchProof = {
        id: `proof_${input.matchId}`,
        matchId: input.matchId,
        playerId: input.playerId,
        result: "win",
        pulls: 0,
        hash: input.proofHash,
        timestamp: Date.now(),
        origin: "demo",
        walletAddress: input.walletAddress,
      };
      return { ok: true as const, verification: verifyMatchProof(proof) };
    }),
  joinRoom: publicProcedure
    .input(
      z.object({
        roomCode: z.string(),
        playerId: z.string().min(1),
        team: z.enum(TEAMS),
      }),
    )
    .mutation(({ input }) => validateRoomJoin(input)),
});
