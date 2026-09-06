import { afterEach, describe, expect, it } from "vitest";

import type { LocalStorageKey } from "../lib/local-persistence";
import { readHydratedValue } from "../lib/local-hydration";

import {
  CURRENT_STORAGE_SCHEMA_VERSION,
  DEMO_STORAGE_KEYS,
  formatPersistenceFailureCategory,
  formatStorageSchemaEvent,
  parseStorageSchemaVersion,
  readLocalValue,
  resolveStorageSchemaVersion,
  removeLocalValues,
  resetLocalStorageDriver,
  setLocalStorageDriver,
  writeLocalValue,
} from "../lib/local-persistence";

const failingDriver = {
  getItem: async () => {
    throw new Error("read failed");
  },
  setItem: async () => {
    throw new Error("write failed");
  },
  multiRemove: async () => {
    throw new Error("remove failed");
  },
};

afterEach(() => resetLocalStorageDriver());

const compileTimePersistenceKeyContract = (): void => {
  const validKey: LocalStorageKey = DEMO_STORAGE_KEYS[0];
  void readLocalValue(validKey);
  void writeLocalValue(validKey, "value");
  void readHydratedValue(validKey, () => null);
  void removeLocalValues([validKey]);

  // @ts-expect-error Persistence APIs must reject identifiers outside the allow-list.
  void readLocalValue("unknown-persistence-key");
  // @ts-expect-error Persistence APIs must reject identifiers outside the allow-list.
  void writeLocalValue("unknown-persistence-key", "value");
  // @ts-expect-error Persistence APIs must reject identifiers outside the allow-list.
  void readHydratedValue("unknown-persistence-key", () => null);
  // @ts-expect-error Persistence APIs must reject identifiers outside the allow-list.
  void removeLocalValues(["unknown-persistence-key"]);
};

void compileTimePersistenceKeyContract;

describe("local persistence recovery", () => {
  it("keeps every persisted demo key in the reset contract", () => {
    expect(DEMO_STORAGE_KEYS).toEqual([
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
      "tug-of-war-storage-schema-version",
      "tug-of-war-judge-pacing-preset",
      "tug-of-war-judge-auto-advance",
    ]);
  });

  it("parses schema versions without accepting malformed or unsupported values", () => {
    expect(parseStorageSchemaVersion(String(CURRENT_STORAGE_SCHEMA_VERSION))).toBe(CURRENT_STORAGE_SCHEMA_VERSION);
    expect(parseStorageSchemaVersion(null)).toBeNull();
    expect(parseStorageSchemaVersion("0")).toBe(0);
    expect(parseStorageSchemaVersion("v1")).toBeNull();
    expect(resolveStorageSchemaVersion(null)).toBe("missing");
    expect(resolveStorageSchemaVersion("0")).toBe("migratable");
    expect(resolveStorageSchemaVersion("1")).toBe("current");
    expect(resolveStorageSchemaVersion("2")).toBe("unsupported");
    expect(resolveStorageSchemaVersion("v1")).toBe("invalid");
    expect(formatStorageSchemaEvent("missing")).toBe("Storage schema initialized.");
    expect(formatStorageSchemaEvent("migratable")).toBe("Legacy storage upgraded safely.");
    expect(formatStorageSchemaEvent("current")).toBe("Storage schema is current.");
    expect(formatStorageSchemaEvent("unsupported")).toBe("Storage schema is newer than this build.");
    expect(formatStorageSchemaEvent("invalid")).toBe("Storage schema metadata is invalid.");
  });

  it("formats each persistence failure category for Diagnostics", () => {
    expect(formatPersistenceFailureCategory("read")).toBe("Read / hydration");
    expect(formatPersistenceFailureCategory("write")).toBe("State write");
    expect(formatPersistenceFailureCategory("cleanup")).toBe("Reset cleanup");
    expect(formatPersistenceFailureCategory(null)).toBe("None recorded");
  });

  it("returns null when a read is unavailable", async () => {
    setLocalStorageDriver(failingDriver);
    await expect(readLocalValue(DEMO_STORAGE_KEYS[0])).resolves.toBeNull();
  });

  it("returns false when a write or cleanup is unavailable", async () => {
    setLocalStorageDriver(failingDriver);
    await expect(writeLocalValue(DEMO_STORAGE_KEYS[0], "{}")).resolves.toBe(false);
    await expect(removeLocalValues([DEMO_STORAGE_KEYS[0]])).resolves.toBe(false);
  });

  it("supports a deterministic in-memory driver for successful writes", async () => {
    const values = new Map<string, string>();
    setLocalStorageDriver({
      getItem: async (key) => values.get(key) ?? null,
      setItem: async (key, value) => {
        values.set(key, value);
      },
      multiRemove: async (keys) => {
        keys.forEach((key) => values.delete(key));
      },
    });
    await expect(writeLocalValue(DEMO_STORAGE_KEYS[0], "{\"wins\":2}")).resolves.toBe(true);
    await expect(writeLocalValue("tug-of-war-bridge-checked-at", "2026-08-21T21:00:00.000Z")).resolves.toBe(true);
    await expect(readLocalValue(DEMO_STORAGE_KEYS[0])).resolves.toBe('{"wins":2}');
    await expect(readLocalValue("tug-of-war-bridge-checked-at")).resolves.toBe("2026-08-21T21:00:00.000Z");
    await expect(removeLocalValues([DEMO_STORAGE_KEYS[0]])).resolves.toBe(true);
    await expect(readLocalValue(DEMO_STORAGE_KEYS[0])).resolves.toBeNull();
  });
});
