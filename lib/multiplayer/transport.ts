import { ARENA_MATCH_DURATION_SECONDS, ARENA_WIN_THRESHOLD } from "@/lib/web3/addresses";
import { getClock } from "@/lib/multiplayer/clock";
import type { MatchState, PlayerState, RoomJoinOptions } from "@/lib/multiplayer/types";

export type GameRoomHandle = {
  id: string;
  connection: { isOpen: boolean };
  state: MatchState;
  send: (type: string, data?: unknown) => void;
  leave: () => void;
  onStateChange: (callback: (state: MatchState) => void) => void;
  onMessage: (type: string, callback: (data: unknown) => void) => void;
  onError: (callback: (error: unknown) => void) => void;
  onLeave: (callback: () => void) => void;
};

export type GameTransport = {
  joinOrCreate: (roomName: string, options: RoomJoinOptions) => Promise<GameRoomHandle>;
  joinById: (roomId: string, options: RoomJoinOptions) => Promise<GameRoomHandle>;
  dispose: () => void;
};

type MessageMap = Map<string, Set<(data: unknown) => void>>;

type LocalRoom = {
  id: string;
  state: MatchState;
  bots: number;
  tick: ReturnType<typeof setInterval> | null;
  listeners: Set<(state: MatchState) => void>;
  messages: Map<string, MessageMap>;
  errors: Map<string, Set<(error: unknown) => void>>;
  leaves: Map<string, Set<() => void>>;
};

function emptyState(roomId: string): MatchState {
  return {
    roomId,
    players: {},
    teamPower: [0, 0],
    ropePosition: 0,
    matchTime: ARENA_MATCH_DURATION_SECONDS,
    matchStatus: "waiting",
    round: 0,
    scores: [0, 0],
    mvp: "",
    startTime: 0,
    endTime: 0,
    version: 0,
    viewers: 0,
  };
}

function cloneState(state: MatchState): MatchState {
  return {
    ...state,
    teamPower: [state.teamPower[0], state.teamPower[1]],
    scores: [state.scores[0], state.scores[1]],
    players: Object.fromEntries(Object.entries(state.players).map(([id, player]) => [id, { ...player }])),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export class LocalGameTransport implements GameTransport {
  private rooms = new Map<string, LocalRoom>();

  async joinOrCreate(_roomName: string, options: RoomJoinOptions): Promise<GameRoomHandle> {
    const open = [...this.rooms.values()].find((room) => room.state.matchStatus === "waiting");
    if (open) return this.attach(open, options);
    return this.attach(this.createRoom(), options);
  }

  async joinById(roomId: string, options: RoomJoinOptions): Promise<GameRoomHandle> {
    const existing = this.rooms.get(roomId);
    if (!existing) {
      const created = this.createRoom(roomId);
      return this.attach(created, options);
    }
    return this.attach(existing, options);
  }

  dispose(): void {
    for (const room of this.rooms.values()) {
      if (room.tick) getClock().clearInterval(room.tick);
    }
    this.rooms.clear();
  }

  private createRoom(roomId = `room_${getClock().now()}`): LocalRoom {
    const room: LocalRoom = {
      id: roomId,
      state: emptyState(roomId),
      bots: 0,
      tick: null,
      listeners: new Set(),
      messages: new Map(),
      errors: new Map(),
      leaves: new Map(),
    };
    this.rooms.set(roomId, room);
    return room;
  }

  private attach(room: LocalRoom, options: RoomJoinOptions): GameRoomHandle {
    const playerId = options.playerId;
    const now = getClock().now();
    const seated = Object.values(room.state.players).filter((player) => !player.isSpectator);
    const team = options.team ?? seated.length % 2;

    if (options.spectator) {
      room.state.viewers += 1;
    } else {
      room.state.players[playerId] = {
        id: playerId,
        name: options.playerName,
        team,
        power: 0,
        taps: 0,
        latency: 0,
        isReady: false,
        isConnected: true,
        isSpectator: false,
        lastUpdate: now,
      };
      this.seedBots(room);
      this.emitMessage(room, "player-joined", { playerId, name: options.playerName, team });
    }

    this.bump(room);
    this.ensureTicker(room);

    const handle: GameRoomHandle = {
      id: room.id,
      connection: { isOpen: true },
      get state() {
        return cloneState(room.state);
      },
      send: (type, data) => this.handleMessage(room, playerId, type, data),
      leave: () => this.leave(room, playerId, handle, options.spectator === true),
      onStateChange: (callback) => {
        room.listeners.add(callback);
        callback(cloneState(room.state));
      },
      onMessage: (type, callback) => {
        const byPlayer = room.messages.get(playerId) ?? new Map();
        const bucket = byPlayer.get(type) ?? new Set<(data: unknown) => void>();
        bucket.add(callback);
        byPlayer.set(type, bucket);
        room.messages.set(playerId, byPlayer);
      },
      onError: (callback) => {
        const bucket = room.errors.get(playerId) ?? new Set<(error: unknown) => void>();
        bucket.add(callback);
        room.errors.set(playerId, bucket);
      },
      onLeave: (callback) => {
        const bucket = room.leaves.get(playerId) ?? new Set<() => void>();
        bucket.add(callback);
        room.leaves.set(playerId, bucket);
      },
    };

    return handle;
  }

  private seedBots(room: LocalRoom): void {
    const humans = Object.values(room.state.players).filter((player) => !player.isSpectator && !player.id.startsWith("bot_"));
    const needed = Math.max(0, 4 - (humans.length + room.bots));
    for (let i = 0; i < needed; i += 1) {
      room.bots += 1;
      const id = `bot_${room.id}_${room.bots}`;
      const team = Object.keys(room.state.players).length % 2;
      room.state.players[id] = {
        id,
        name: `Bot ${room.bots}`,
        team,
        power: 0,
        taps: 0,
        latency: 24,
        isReady: true,
        isConnected: true,
        isSpectator: false,
        lastUpdate: getClock().now(),
      };
    }
  }

  private handleMessage(room: LocalRoom, playerId: string, type: string, data: unknown): void {
    const player = room.state.players[playerId];
    if (type === "ping") {
      const timestamp = isRecord(data) && typeof data.timestamp === "number" ? data.timestamp : getClock().now();
      this.emitTo(room, playerId, "ping", { timestamp });
      return;
    }
    if (!player || player.isSpectator) return;

    if (type === "ready") {
      player.isReady = isRecord(data) ? Boolean(data.isReady) : !player.isReady;
      player.lastUpdate = getClock().now();
      this.maybeStart(room);
      this.bump(room);
      return;
    }

    if (type === "tap" || type === "swipe") {
      if (room.state.matchStatus !== "playing") return;
      const amount = isRecord(data) && typeof data.amount === "number" ? data.amount : type === "swipe" ? 3.1 : 2.3;
      player.taps += 1;
      player.power += Math.abs(amount);
      player.lastUpdate = getClock().now();
      const signed = player.team === 0 ? Math.abs(amount) : -Math.abs(amount);
      room.state.ropePosition = Math.max(-ARENA_WIN_THRESHOLD, Math.min(ARENA_WIN_THRESHOLD, room.state.ropePosition + signed));
      room.state.teamPower[player.team === 0 ? 0 : 1] += Math.abs(amount);
      this.emitMessage(room, "power-update", {
        playerId,
        power: player.power,
        taps: player.taps,
        ropePosition: room.state.ropePosition,
        teamPower: room.state.teamPower,
      });
      this.maybeFinish(room);
      this.bump(room);
      return;
    }

    if (type === "chat") {
      const message = isRecord(data) && typeof data.message === "string" ? data.message.slice(0, 180) : "";
      const channel = isRecord(data) && data.channel === "team" ? "team" : isRecord(data) && data.channel === "party" ? "party" : "global";
      if (!message) return;
      this.emitMessage(room, "chat", { playerId, playerName: player.name, message, channel, at: getClock().now() });
      return;
    }

    if (type === "emote") {
      const emoteId = isRecord(data) && typeof data.emoteId === "string" ? data.emoteId : "";
      if (!emoteId) return;
      this.emitMessage(room, "emote", { playerId, playerName: player.name, emoteId, at: getClock().now() });
    }
  }

  private maybeStart(room: LocalRoom): void {
    const seated = Object.values(room.state.players).filter((player) => !player.isSpectator);
    if (room.state.matchStatus !== "waiting" || seated.length < 2) return;
    if (!seated.every((player) => player.isReady || player.id.startsWith("bot_"))) return;
    room.state.matchStatus = "countdown";
    this.emitMessage(room, "countdown", { count: 3 });
    getClock().setTimeout(() => {
      if (room.state.matchStatus !== "countdown") return;
      room.state.matchStatus = "playing";
      room.state.startTime = getClock().now();
      room.state.matchTime = ARENA_MATCH_DURATION_SECONDS;
      room.state.round += 1;
      this.emitMessage(room, "match-start", { roomId: room.id, startTime: room.state.startTime });
      this.bump(room);
    }, 300);
  }

  private maybeFinish(room: LocalRoom, timedOut = false): void {
    if (room.state.matchStatus !== "playing") return;
    const pulled = Math.abs(room.state.ropePosition) >= ARENA_WIN_THRESHOLD;
    if (!pulled && !timedOut) return;
    const winnerTeam = room.state.ropePosition >= 0 ? 0 : 1;
    room.state.matchStatus = "ended";
    room.state.endTime = getClock().now();
    room.state.scores[winnerTeam] += 1;
    const winners = Object.values(room.state.players).filter((player) => player.team === winnerTeam && !player.isSpectator);
    room.state.mvp = winners.sort((a, b) => b.power - a.power)[0]?.id ?? "";
    this.emitMessage(room, "match-end", {
      roomId: room.id,
      winner: winnerTeam === 0 ? "sun" : "moon",
      mvp: room.state.mvp,
      scores: room.state.scores,
      ropePosition: room.state.ropePosition,
    });
  }

  private ensureTicker(room: LocalRoom): void {
    if (room.tick) return;
    room.tick = getClock().setInterval(() => {
      if (room.state.matchStatus !== "playing") return;
      room.state.matchTime = Math.max(0, room.state.matchTime - 1);
      if (room.state.matchTime <= 0) this.maybeFinish(room, true);
      this.bump(room);
    }, 1000);
  }

  private bump(room: LocalRoom): void {
    room.state.version += 1;
    const snapshot = cloneState(room.state);
    for (const listener of room.listeners) listener(snapshot);
  }

  private emitMessage(room: LocalRoom, type: string, data: unknown): void {
    for (const byType of room.messages.values()) {
      for (const callback of byType.get(type) ?? []) callback(data);
    }
  }

  private emitTo(room: LocalRoom, playerId: string, type: string, data: unknown): void {
    for (const callback of room.messages.get(playerId)?.get(type) ?? []) callback(data);
  }

  private leave(room: LocalRoom, playerId: string, handle: GameRoomHandle, spectator: boolean): void {
    handle.connection.isOpen = false;
    if (spectator) room.state.viewers = Math.max(0, room.state.viewers - 1);
    delete room.state.players[playerId];
    this.emitMessage(room, "player-left", { playerId });
    for (const callback of room.leaves.get(playerId) ?? []) callback();
    room.messages.delete(playerId);
    room.errors.delete(playerId);
    room.leaves.delete(playerId);
    this.bump(room);
    if (Object.keys(room.state.players).length === 0 && room.state.viewers === 0) {
      if (room.tick) getClock().clearInterval(room.tick);
      this.rooms.delete(room.id);
    }
  }
}

type SocketLike = {
  readyState: number;
  send: (data: string) => void;
  close: () => void;
  addEventListener: (type: string, listener: (event: { data?: unknown }) => void) => void;
};

export class WebSocketGameTransport implements GameTransport {
  constructor(private readonly url: string) {}

  async joinOrCreate(roomName: string, options: RoomJoinOptions): Promise<GameRoomHandle> {
    return this.connect({ roomName, options });
  }

  async joinById(roomId: string, options: RoomJoinOptions): Promise<GameRoomHandle> {
    return this.connect({ roomId, options });
  }

  dispose(): void {
    // Sockets are closed per-room via leave().
  }

  private connect(input: { roomName?: string; roomId?: string; options: RoomJoinOptions }): Promise<GameRoomHandle> {
    if (typeof WebSocket === "undefined") {
      return Promise.reject(new Error("WebSocket is not available in this runtime"));
    }

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.url) as unknown as SocketLike;
      let opened = false;
      let state: MatchState = emptyState(input.roomId ?? "pending");
      const stateListeners = new Set<(next: MatchState) => void>();
      const messageListeners: MessageMap = new Map();
      const errorListeners = new Set<(error: unknown) => void>();
      const leaveListeners = new Set<() => void>();

      const handle: GameRoomHandle = {
        id: state.roomId,
        connection: { isOpen: false },
        get state() {
          return cloneState(state);
        },
        send: (type, data) => {
          if (socket.readyState === 1) socket.send(JSON.stringify({ type, data }));
        },
        leave: () => {
          handle.connection.isOpen = false;
          socket.close();
        },
        onStateChange: (callback) => stateListeners.add(callback),
        onMessage: (type, callback) => {
          const bucket = messageListeners.get(type) ?? new Set<(data: unknown) => void>();
          bucket.add(callback);
          messageListeners.set(type, bucket);
        },
        onError: (callback) => errorListeners.add(callback),
        onLeave: (callback) => leaveListeners.add(callback),
      };

      socket.addEventListener("open", () => {
        opened = true;
        handle.connection.isOpen = true;
        socket.send(
          JSON.stringify({
            type: "join",
            roomName: input.roomName ?? "tug-of-war",
            roomId: input.roomId,
            options: input.options,
          }),
        );
      });

      socket.addEventListener("message", (event) => {
        if (typeof event.data !== "string") return;
        try {
          const parsed = JSON.parse(event.data) as { type?: string; state?: MatchState; name?: string; data?: unknown; roomId?: string };
          if (parsed.type === "joined" && parsed.roomId) {
            handle.id = parsed.roomId;
            if (parsed.state) state = parsed.state;
            resolve(handle);
            return;
          }
          if (parsed.type === "state" && parsed.state) {
            state = parsed.state;
            handle.id = state.roomId;
            for (const callback of stateListeners) callback(cloneState(state));
            return;
          }
          if (parsed.type === "message" && parsed.name) {
            for (const callback of messageListeners.get(parsed.name) ?? []) callback(parsed.data);
          }
        } catch (error) {
          for (const callback of errorListeners) callback(error);
        }
      });

      socket.addEventListener("error", () => {
        const error = new Error("Game server socket error");
        for (const callback of errorListeners) callback(error);
        if (!opened) reject(error);
      });

      socket.addEventListener("close", () => {
        handle.connection.isOpen = false;
        for (const callback of leaveListeners) callback();
        if (!opened) reject(new Error("Game server connection closed"));
      });
    });
  }
}

let overrideTransport: GameTransport | null = null;

export function setGameTransport(next: GameTransport | null): void {
  overrideTransport = next;
}

export function createGameTransport(serverUrl = process.env.EXPO_PUBLIC_GAME_SERVER_URL): GameTransport {
  if (overrideTransport) return overrideTransport;
  const url = serverUrl?.trim();
  if (url) return new WebSocketGameTransport(url);
  return new LocalGameTransport();
}

export function playerList(state: MatchState): PlayerState[] {
  return Object.values(state.players);
}
