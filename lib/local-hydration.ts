import AsyncStorage from "@react-native-async-storage/async-storage";

import type { LocalStorageKey } from "@/lib/local-persistence";

export type HydrationResult<T> =
  | { status: "missing" }
  | { status: "valid"; value: T }
  | { status: "malformed" }
  | { status: "unavailable" };

export function parseHydratedValue<T>(raw: string | null, parser: (value: string) => T | null | undefined): HydrationResult<T> {
  if (raw === null) return { status: "missing" };
  try {
    const value = parser(raw);
    return value == null ? { status: "malformed" } : { status: "valid", value };
  } catch {
    return { status: "malformed" };
  }
}

export async function readHydratedValue<T>(key: LocalStorageKey, parser: (value: string) => T | null | undefined): Promise<HydrationResult<T>> {
  try {
    return parseHydratedValue(await AsyncStorage.getItem(key), parser);
  } catch {
    return { status: "unavailable" };
  }
}

export const parseBoolean = (value: string): boolean | null => {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};
