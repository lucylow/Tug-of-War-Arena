import { MultiplayerEmitter } from "@/lib/multiplayer/emitter";
import { getClock, type TimeoutHandle, type IntervalHandle } from "@/lib/multiplayer/clock";
import { getPlayerId, getPlayerName } from "@/lib/multiplayer/identity";
import { MAX_RECONNECT_ATTEMPTS, reconnectDelay } from "@/lib/multiplayer/reconnect";
import { createGameTransport, type GameRoomHandle, type GameTransport } from "@/lib/multiplayer/transport";
import type { ArenaAction, ChatChannel, MatchState, RoomJoinOptions } from "@/lib/multiplayer/types";

export class SyncManager extends MultiplayerEmitter {
  private static instance: SyncManager | undefined;
  private transport: GameTransport;
  private room: GameRoomHandle | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: TimeoutHandle | null = null;
  private pingInterval: IntervalHandle | null = null;
  private lastRoomId: string | null = null;
  private lastJoin: RoomJoinOptions | null = null;
  private lastPing = 0;
  private currentPing = 0;
  private reconnecting = false;

  private constructor(transport?: GameTransport) {
    super();
    this.transport = transport ?? createGameTransport();
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) SyncManager.instance = new SyncManager();
    return SyncManager.instance;
  }

  static resetInstance(): void {
    SyncManager.instance?.dispose();
    SyncManager.instance = undefined;
  }

  async connectToMatch(roomId?: string, extras: Partial<RoomJoinOptions> = {}): Promise<GameRoomHandle> {
    const options: RoomJoinOptions = {
      realm: extras.realm ?? "friendzone",
      playerId: extras.playerId ?? (await getPlayerId()),
      playerName: extras.playerName ?? (await getPlayerName()),
      spectator: extras.spectator,
      partyId: extras.partyId,
      team: extras.team,
    };
    this.lastJoin = options;

    if (this.room) {
      const current = this.room;
      this.room = null;
      current.leave();
    }

    try {
      this.room = roomId
        ? await this.transport.joinById(roomId, options)
        : await this.transport.joinOrCreate("tug-of-war", options);
      this.lastRoomId = this.room.id;
      this.reconnectAttempts = 0;
      this.reconnecting = false;
      this.bindRoom(this.room);
      this.startPing();
      this.emit("connected", this.room.id);
      return this.room;
    } catch (error) {
      this.emit("error", error);
      if (this.reconnecting) this.scheduleReconnect();
      throw error;
    }
  }

  sendAction(type: ArenaAction, data: Record<string, unknown> = {}): void {
    this.room?.send(type, data);
  }

  sendChat(message: string, channel: ChatChannel = "global"): void {
    this.room?.send("chat", { message, channel });
  }

  sendEmote(emoteId: string): void {
    this.room?.send("emote", { emoteId });
  }

  setReady(isReady: boolean): void {
    this.room?.send("ready", { isReady });
  }

  leaveMatch(): void {
    this.clearTimers();
    this.room?.leave();
    this.room = null;
    this.reconnecting = false;
    this.emit("disconnected");
  }

  getState(): MatchState | null {
    return this.room?.state ?? null;
  }

  getRoomId(): string | null {
    return this.room?.id ?? this.lastRoomId;
  }

  getPing(): number {
    return this.currentPing;
  }

  isConnected(): boolean {
    return this.room != null && this.room.connection.isOpen;
  }

  dispose(): void {
    this.leaveMatch();
    this.transport.dispose();
    this.removeAllListeners();
  }

  private bindRoom(room: GameRoomHandle): void {
    room.onStateChange((state) => this.emit("state-change", state));
    room.onMessage("countdown", (data) => this.emit("countdown", isCount(data) ? data.count : data));
    room.onMessage("match-start", (data) => this.emit("match-start", data));
    room.onMessage("match-end", (data) => this.emit("match-end", data));
    room.onMessage("player-joined", (data) => this.emit("player-joined", data));
    room.onMessage("player-left", (data) => this.emit("player-left", data));
    room.onMessage("power-update", (data) => this.emit("power-update", data));
    room.onMessage("emote", (data) => this.emit("emote", data));
    room.onMessage("chat", (data) => this.emit("chat", data));
    room.onMessage("ping", (data) => {
      const timestamp = isTimestamp(data) ? data.timestamp : getClock().now();
      this.lastPing = getClock().now();
      this.currentPing = Math.max(0, this.lastPing - timestamp);
      this.emit("ping", this.currentPing);
    });
    room.onError((error) => {
      this.emit("error", error);
      this.beginReconnect();
    });
    room.onLeave(() => {
      if (this.room === room) this.beginReconnect();
    });
  }

  private startPing(): void {
    this.clearPing();
    this.pingInterval = getClock().setInterval(() => {
      this.room?.send("ping", { timestamp: getClock().now() });
    }, 5000);
  }

  private beginReconnect(): void {
    if (!this.lastJoin) {
      this.emit("disconnected");
      return;
    }
    this.room = null;
    this.reconnecting = true;
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.reconnecting = false;
      this.emit("disconnected", "Max reconnect attempts reached");
      return;
    }
    getClock().clearTimeout(this.reconnectTimer);
    const delay = reconnectDelay(this.reconnectAttempts);
    this.reconnectTimer = getClock().setTimeout(() => {
      this.reconnectAttempts += 1;
      this.emit("reconnect-attempt", this.reconnectAttempts);
      this.connectToMatch(this.lastRoomId ?? undefined, this.lastJoin ?? {}).catch(() => undefined);
    }, delay);
  }

  private clearPing(): void {
    getClock().clearInterval(this.pingInterval);
    this.pingInterval = null;
  }

  private clearTimers(): void {
    this.clearPing();
    getClock().clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}

function isCount(value: unknown): value is { count: number } {
  return typeof value === "object" && value !== null && "count" in value && typeof (value as { count: unknown }).count === "number";
}

function isTimestamp(value: unknown): value is { timestamp: number } {
  return typeof value === "object" && value !== null && "timestamp" in value && typeof (value as { timestamp: unknown }).timestamp === "number";
}
