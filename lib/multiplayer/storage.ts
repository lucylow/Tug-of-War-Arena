import AsyncStorage from "@react-native-async-storage/async-storage";

export const MULTIPLAYER_STORAGE_KEYS = [
  "tug-of-war-player-id",
  "tug-of-war-player-name",
  "tug-of-war-current-party",
  "tug-of-war-match-history",
  "tug-of-war-emote-favorites",
  "tug-of-war-friends-list",
  "tug-of-war-leaderboard-state",
] as const;

export type MultiplayerStorageKey = (typeof MULTIPLAYER_STORAGE_KEYS)[number];

export type MultiplayerStorageDriver = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

let driver: MultiplayerStorageDriver = AsyncStorage;

export function setMultiplayerStorageDriver(next: MultiplayerStorageDriver): void {
  driver = next;
}

export function resetMultiplayerStorageDriver(): void {
  driver = AsyncStorage;
}

export async function readMultiplayerValue(key: MultiplayerStorageKey): Promise<string | null> {
  try {
    return await driver.getItem(key);
  } catch {
    return null;
  }
}

export async function writeMultiplayerValue(key: MultiplayerStorageKey, value: string): Promise<boolean> {
  try {
    await driver.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export async function readMultiplayerJson<T>(key: MultiplayerStorageKey): Promise<T | null> {
  const raw = await readMultiplayerValue(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeMultiplayerJson(key: MultiplayerStorageKey, value: unknown): Promise<boolean> {
  try {
    return await writeMultiplayerValue(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export async function clearMultiplayerStorage(): Promise<void> {
  await Promise.all(
    MULTIPLAYER_STORAGE_KEYS.map(async (key) => {
      try {
        await driver.removeItem(key);
      } catch {
        // Best-effort cleanup; demo reset still continues.
      }
    }),
  );
}
