import { createCanonicalWorldFeed } from "@/shared/demo-world";
import type { WorldFeed } from "@/shared/friendzone-world-protocol";
import { logger } from "@/lib/logging/logger";

export type WorldConnectionState = "connected" | "degraded" | "offline" | "demo";

export class WorldSyncClient {
  private state: WorldConnectionState = "demo";
  private cached: WorldFeed = createCanonicalWorldFeed();

  getConnectionState(): WorldConnectionState {
    return this.state;
  }

  async getFeed(): Promise<WorldFeed> {
    try {
      this.state = "demo";
      this.cached = createCanonicalWorldFeed();
      return this.cached;
    } catch (error) {
      this.state = "offline";
      logger.warn("World sync unavailable, using cached demo feed", {
        error: error instanceof Error ? error.message : "unknown",
      });
      return this.cached;
    }
  }

  async sendPresence(_playerId: string): Promise<boolean> {
    void _playerId;
    return this.state !== "offline";
  }

  async sendRoomJoin(_roomId: string): Promise<boolean> {
    void _roomId;
    return this.state !== "offline";
  }

  async sendMatchResult(_matchId: string): Promise<boolean> {
    void _matchId;
    return this.state !== "offline";
  }

  async sendReaction(_emoji: string): Promise<boolean> {
    void _emoji;
    return this.state !== "offline";
  }
}
