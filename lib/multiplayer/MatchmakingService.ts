import { getClock, type IntervalHandle } from "@/lib/multiplayer/clock";
import { MultiplayerEmitter } from "@/lib/multiplayer/emitter";
import { getPlayerId } from "@/lib/multiplayer/identity";
import { SyncManager } from "@/lib/multiplayer/SyncManager";
import type { MatchmakingOptions, MatchmakingQueue } from "@/lib/multiplayer/types";

export class MatchmakingService extends MultiplayerEmitter {
  private static instance: MatchmakingService | undefined;
  private queue: MatchmakingQueue | null = null;
  private searchTimer: IntervalHandle | null = null;

  static getInstance(): MatchmakingService {
    if (!MatchmakingService.instance) MatchmakingService.instance = new MatchmakingService();
    return MatchmakingService.instance;
  }

  static resetInstance(): void {
    MatchmakingService.instance?.dispose();
    MatchmakingService.instance = undefined;
  }

  async startMatchmaking(options: MatchmakingOptions): Promise<void> {
    if (this.queue) throw new Error("Already in matchmaking queue");
    const playerId = await getPlayerId();
    this.queue = {
      id: `queue_${getClock().now()}`,
      players: [playerId],
      options,
      createdAt: getClock().now(),
      status: "waiting",
    };
    this.emit("queue-update", this.queue);
    this.startSearch();
  }

  cancelMatchmaking(): void {
    this.clearQueue();
    this.emit("cancelled");
  }

  getQueueStatus(): MatchmakingQueue | null {
    return this.queue;
  }

  getEstimatedWaitTime(): number {
    if (!this.queue) return 0;
    const elapsed = (getClock().now() - this.queue.createdAt) / 1000;
    return Math.max(0, Math.round(30 - elapsed));
  }

  async joinRoom(roomId: string): Promise<void> {
    const room = await SyncManager.getInstance().connectToMatch(roomId);
    this.emit("room-ready", room);
  }

  async createCustomGame(options: MatchmakingOptions): Promise<void> {
    const room = await SyncManager.getInstance().connectToMatch(undefined, { partyId: options.partyId });
    this.emit("room-ready", room);
    this.emit("custom-game-created", room.id, options);
  }

  dispose(): void {
    this.clearQueue();
    this.removeAllListeners();
  }

  private startSearch(): void {
    getClock().clearInterval(this.searchTimer);
    void this.searchForMatch();
    this.searchTimer = getClock().setInterval(() => {
      void this.searchForMatch();
    }, 1000);
  }

  private async searchForMatch(): Promise<void> {
    if (!this.queue) return;
    this.queue.status = "matching";
    const elapsed = (getClock().now() - this.queue.createdAt) / 1000;
    const minPlayers = this.queue.options.minPlayers ?? 4;
    const foundPlayers = Math.min(minPlayers, 2 + Math.floor(elapsed / 5));
    this.queue.players = Array.from({ length: Math.max(1, foundPlayers) }, (_, index) => this.queue?.players[0] ?? `seat_${index}`);
    this.emit("queue-update", this.queue);

    if (foundPlayers < minPlayers) return;

    this.queue.status = "ready";
    this.emit("match-found", this.queue);
    try {
      const room = await SyncManager.getInstance().connectToMatch();
      this.emit("room-ready", room);
    } catch (error) {
      this.emit("error", error);
    } finally {
      this.clearQueue();
    }
  }

  private clearQueue(): void {
    getClock().clearInterval(this.searchTimer);
    this.searchTimer = null;
    this.queue = null;
  }
}
