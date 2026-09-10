import type { Express, Request, Response } from "express";

import { verifyMatchProof, type MatchProof } from "../shared/proof";
import { validateRoomJoin } from "./friendzoneRouter";

const HEX_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const HASH = /^0x[a-fA-F0-9]{16,64}$/;
const limiter = new Map<string, number>();

export function registerFriendzoneRoutes(app: Express): void {
  app.post("/api/friendzone/match-proof", (req: Request, res: Response) => {
    const matchId = String(req.body?.matchId ?? "");
    const playerId = String(req.body?.playerId ?? "");
    const walletAddress = typeof req.body?.walletAddress === "string" ? req.body.walletAddress : undefined;
    const proofHash = String(req.body?.proofHash ?? "");
    if (!matchId || !playerId || !HASH.test(proofHash)) {
      res.status(400).json({ error: "Invalid match proof input" });
      return;
    }
    if (walletAddress && !HEX_ADDRESS.test(walletAddress)) {
      res.status(400).json({ error: "Invalid wallet address" });
      return;
    }
    const last = limiter.get(playerId) ?? 0;
    if (Date.now() - last < 3_000) {
      res.status(429).json({ error: "Rate limited" });
      return;
    }
    limiter.set(playerId, Date.now());
    const proof: MatchProof = {
      id: `proof_${matchId}`,
      matchId,
      playerId,
      result: "win",
      pulls: 0,
      hash: proofHash,
      timestamp: Date.now(),
      origin: "demo",
      walletAddress,
    };
    res.json({ ok: true, verification: verifyMatchProof(proof) });
  });

  app.post("/api/friendzone/rooms/join", (req: Request, res: Response) => {
    const result = validateRoomJoin({
      roomCode: String(req.body?.roomCode ?? ""),
      playerId: String(req.body?.playerId ?? ""),
      team: String(req.body?.team ?? ""),
    });
    if (!result.ok) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  });
}
