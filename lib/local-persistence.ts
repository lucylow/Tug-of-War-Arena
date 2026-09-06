import AsyncStorage from "@react-native-async-storage/async-storage";

export type LocalStorageDriver = Pick<typeof AsyncStorage, "getItem" | "setItem" | "multiRemove">;
export type PersistenceFailureCategory = "read" | "write" | "cleanup";
export const CURRENT_STORAGE_SCHEMA_VERSION = 1;
export const DEMO_STORAGE_SCHEMA_KEY = "tug-of-war-storage-schema-version";
export const JUDGE_PACING_PRESET_KEY = "tug-of-war-judge-pacing-preset";
export const JUDGE_AUTO_ADVANCE_KEY = "tug-of-war-judge-auto-advance";
export type StorageSchemaResolution = "missing" | "current" | "migratable" | "unsupported" | "invalid";
export type StorageMigration = { from: number; to: number; description: string };

export const STORAGE_MIGRATIONS: readonly StorageMigration[] = [
  { from: 0, to: CURRENT_STORAGE_SCHEMA_VERSION, description: "Adopt the initial metadata contract" },
];

export function parseStorageSchemaVersion(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const version = Number(value);
  return Number.isSafeInteger(version) && version >= 0 ? version : null;
}

export function resolveStorageSchemaVersion(value: string | null): StorageSchemaResolution {
  if (value === null) return "missing";
  const parsed = parseStorageSchemaVersion(value);
  if (parsed === null) return "invalid";
  if (parsed === CURRENT_STORAGE_SCHEMA_VERSION) return "current";
  if (parsed > CURRENT_STORAGE_SCHEMA_VERSION) return "unsupported";
  return STORAGE_MIGRATIONS.some((migration) => migration.from === parsed && migration.to === CURRENT_STORAGE_SCHEMA_VERSION)
    ? "migratable"
    : "unsupported";
}

export function formatStorageSchemaEvent(resolution: StorageSchemaResolution): string {
  if (resolution === "migratable") return "Legacy storage upgraded safely.";
  if (resolution === "missing") return "Storage schema initialized.";
  if (resolution === "current") return "Storage schema is current.";
  if (resolution === "unsupported") return "Storage schema is newer than this build.";
  return "Storage schema metadata is invalid.";
}

export function formatPersistenceFailureCategory(category: PersistenceFailureCategory | null): string {
  if (category === "read") return "Read / hydration";
  if (category === "write") return "State write";
  if (category === "cleanup") return "Reset cleanup";
  return "None recorded";
}

let storageDriver: LocalStorageDriver = AsyncStorage;

export const DEMO_STORAGE_KEYS = [
  "tug-of-war-stats",
  "tug-of-war-receipts",
  "tug-of-war-history",
  "tug-of-war-party-code",
  "tug-of-war-event-waitlisted",
  "tug-of-war-wearable-equipped",
  "tug-of-war-recent-crew",
  "tug-of-war-rsvp-event",
  "tug-of-war-tutorial-seen",
  "tug-of-war-bridge-checked-at",
  "tug-of-war-bridge-recovery-reason",
  DEMO_STORAGE_SCHEMA_KEY,
  JUDGE_PACING_PRESET_KEY,
  JUDGE_AUTO_ADVANCE_KEY,
] as const;
export type LocalStorageKey = (typeof DEMO_STORAGE_KEYS)[number];

export function setLocalStorageDriver(driver: LocalStorageDriver): void {
  storageDriver = driver;
}

export function resetLocalStorageDriver(): void {
  storageDriver = AsyncStorage;
}

export async function readLocalValue(key: LocalStorageKey): Promise<string | null> {
  try {
    return await storageDriver.getItem(key);
  } catch {
    return null;
  }
}

export async function writeLocalValue(key: LocalStorageKey, value: string): Promise<boolean> {
  try {
    await storageDriver.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export async function removeLocalValues(keys: LocalStorageKey[]): Promise<boolean> {
  try {
    await storageDriver.multiRemove(keys);
    return true;
  } catch {
    return false;
  }
}
