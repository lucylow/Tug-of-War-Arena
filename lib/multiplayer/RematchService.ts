import { getClock } from "@/lib/multiplayer/clock";
import { MultiplayerEmitter } from "@/lib/multiplayer/emitter";
import { getPlayerId } from "@/lib/multiplayer/identity";
import { readMultiplayerJson, writeMultiplayerJson } from "@/lib/multiplayer/storage";
import { SyncManager } from "@/lib/multiplayer/SyncManager";
import type { MatchRecord } from "@/lib/multiplayer/types";

const HISTORY_LIMIT = 50;

export class RematchService extends MultiplayerEmitter {
  private static instance: RematchService | undefined;
  private rematchRequests = new Map<string, boolean>();
  private matchHistory: MatchRecord[] = [];
  private loaded = false;

  static getInstance(): RematchService {
    if (!RematchService.instance) RematchService.instance = new RematchService();
    return RematchService.instance;
  }

  static resetInstance(): void {
    RematchService.instance?.dispose();
    RematchService.instance = undefined;
  }

  async requestRematch(matchId: string): Promise<void> {
    await this.castRematchVote(matchId, await getPlayerId(), "requested");
  }

  async acceptRematch(matchId: string): Promise<void> {
    await this.castRematchVote(matchId, await getPlayerId(), "accepted");
  }

  async castRematchVote(matchId: string, playerId: string, kind: "requested" | "accepted" = "accepted"): Promise<void> {
    this.rematchRequests.set(playerId, true);
    this.emit(kind === "requested" ? "rematch-requested" : "rematch-accepted", { matchId, playerId });
    if (this.rematchRequests.size >= 2) this.emit("rematch-ready", matchId);
  }

  async startRematch(matchId: string): Promise<void> {
    this.rematchRequests.clear();
    this.emit("rematch-starting", matchId);
    await SyncManager.getInstance().connectToMatch();
  }

  async saveMatchRecord(record: MatchRecord): Promise<void> {
    await this.ensureLoaded();
    this.matchHistory = [record, ...this.matchHistory.filter((entry) => entry.id !== record.id)].slice(0, HISTORY_LIMIT);
    await writeMultiplayerJson("tug-of-war-match-history", this.matchHistory);
    this.emit("match-saved", record);
  }

  async getMatchHistory(): Promise<MatchRecord[]> {
    await this.ensureLoaded();
    return this.matchHistory;
  }

  async getMatchRecord(matchId: string): Promise<MatchRecord | undefined> {
    await this.ensureLoaded();
    return this.matchHistory.find((entry) => entry.id === matchId);
  }

  async replayMatch(matchId: string): Promise<void> {
    const record = await this.getMatchRecord(matchId);
    if (!record) {
      this.emit("error", "Match not found");
      return;
    }
    this.emit("replay-start", record);
  }

  clearRematchVotes(): void {
    this.rematchRequests.clear();
  }

  rematchVoteCount(): number {
    return this.rematchRequests.size;
  }

  dispose(): void {
    this.rematchRequests.clear();
    this.matchHistory = [];
    this.loaded = false;
    this.removeAllListeners();
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    this.matchHistory = (await readMultiplayerJson<MatchRecord[]>("tug-of-war-match-history")) ?? [];
  }
}

export async function recordFinishedMatch(input: {
  won: boolean;
  team: "sun" | "moon";
  taps: number;
  duration: number;
  rope: number;
  playerId?: string;
}): Promise<MatchRecord> {
  const playerId = input.playerId ?? (await getPlayerId());
  const record: MatchRecord = {
    id: `match_${getClock().now()}`,
    players: [playerId],
    winner: input.won ? input.team : input.team === "sun" ? "moon" : "sun",
    score: input.won ? (input.team === "sun" ? [1, 0] : [0, 1]) : input.team === "sun" ? [0, 1] : [1, 0],
    mvp: playerId,
    duration: input.duration,
    date: getClock().now(),
    ropeHistory: [input.rope],
    events: [{ at: getClock().now(), type: "result", payload: { taps: input.taps, won: input.won } }],
  };
  await RematchService.getInstance().saveMatchRecord(record);
  return record;
}
