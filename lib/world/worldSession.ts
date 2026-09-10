export type WorldSessionStatus = "idle" | "loading" | "ready" | "offline" | "error";

export interface WorldSession {
  sessionId: string;
  worldId: string;
  roomId: string | null;
  playerId: string;
  status: WorldSessionStatus;
  joinedAt: number | null;
  lastSyncAt: number | null;
}

function id(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const idle = (): WorldSession => ({
  sessionId: "",
  worldId: "",
  roomId: null,
  playerId: "",
  status: "idle",
  joinedAt: null,
  lastSyncAt: null,
});

let current: WorldSession = idle();

export function getWorldSession(): WorldSession {
  return { ...current };
}

export function createWorldSession(input: { worldId: string; playerId: string; roomId?: string | null }): WorldSession {
  current = {
    sessionId: id("sess"),
    worldId: input.worldId,
    roomId: input.roomId ?? null,
    playerId: input.playerId,
    status: "loading",
    joinedAt: null,
    lastSyncAt: null,
  };
  return getWorldSession();
}

export function joinWorldSession(roomId?: string | null): WorldSession {
  if (!current.sessionId) {
    current = createWorldSession({ worldId: "friendzone", playerId: "local-player", roomId: roomId ?? null });
  }
  current = {
    ...current,
    roomId: roomId ?? current.roomId,
    status: "ready",
    joinedAt: Date.now(),
    lastSyncAt: Date.now(),
  };
  return getWorldSession();
}

export function leaveWorldSession(): WorldSession {
  current = {
    ...current,
    status: "idle",
    roomId: null,
    joinedAt: null,
  };
  return getWorldSession();
}

export function refreshWorldSession(status?: WorldSessionStatus): WorldSession {
  if (!current.sessionId) return getWorldSession();
  current = {
    ...current,
    status: status ?? (current.status === "error" ? "ready" : current.status),
    lastSyncAt: Date.now(),
  };
  return getWorldSession();
}

export function resetWorldSession(): WorldSession {
  current = idle();
  return getWorldSession();
}

export function markWorldSessionOffline(): WorldSession {
  if (!current.sessionId) return getWorldSession();
  current = { ...current, status: "offline" };
  return getWorldSession();
}
