import { readMultiplayerValue, writeMultiplayerValue } from "@/lib/multiplayer/storage";

let overrideId: string | null = null;
let overrideName: string | null = null;
let cachedId: string | null = null;
let cachedName: string | null = null;

function randomToken(length: number): string {
  return Math.random().toString(36).slice(2, 2 + length);
}

export function setPlayerIdentity(id: string, name: string): void {
  overrideId = id;
  overrideName = name;
  cachedId = id;
  cachedName = name;
}

export function resetPlayerIdentity(): void {
  overrideId = null;
  overrideName = null;
  cachedId = null;
  cachedName = null;
}

export async function getPlayerId(): Promise<string> {
  if (overrideId) return overrideId;
  if (cachedId) return cachedId;
  const stored = await readMultiplayerValue("tug-of-war-player-id");
  if (stored) {
    cachedId = stored;
    return stored;
  }
  const id = `player_${Date.now()}_${randomToken(6)}`;
  cachedId = id;
  await writeMultiplayerValue("tug-of-war-player-id", id);
  return id;
}

export async function getPlayerName(): Promise<string> {
  if (overrideName) return overrideName;
  if (cachedName) return cachedName;
  const stored = await readMultiplayerValue("tug-of-war-player-name");
  if (stored) {
    cachedName = stored;
    return stored;
  }
  const name = `Player_${randomToken(4).toUpperCase()}`;
  cachedName = name;
  await writeMultiplayerValue("tug-of-war-player-name", name);
  return name;
}

export function getPlayerAvatar(seed = "1"): string {
  const index = Number.parseInt(seed.replace(/\D/g, "").slice(-2) || "1", 10) % 70 || 1;
  return `https://i.pravatar.cc/150?img=${index}`;
}
