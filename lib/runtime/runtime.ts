export type RuntimeKind =
  | "react-native-ios"
  | "react-native-android"
  | "react-native-web"
  | "browser"
  | "decentraland"
  | "server"
  | "unknown";

const RUNTIME_KINDS: readonly RuntimeKind[] = [
  "react-native-ios",
  "react-native-android",
  "react-native-web",
  "browser",
  "decentraland",
  "server",
  "unknown",
];

let runtimeOverride: RuntimeKind | null = null;

function isRuntimeKind(value: unknown): value is RuntimeKind {
  return typeof value === "string" && (RUNTIME_KINDS as readonly string[]).includes(value);
}

function readGlobalRuntimeFlag(): RuntimeKind | null {
  const globalObject = globalThis as { __FRIENDZONE_RUNTIME__?: unknown };
  return isRuntimeKind(globalObject.__FRIENDZONE_RUNTIME__) ? globalObject.__FRIENDZONE_RUNTIME__ : null;
}

function readNavigatorProduct(): string {
  try {
    const navigatorObject = (globalThis as { navigator?: { product?: string; userAgent?: string } }).navigator;
    return navigatorObject?.product ?? "";
  } catch {
    return "";
  }
}

function readUserAgent(): string {
  try {
    const navigatorObject = (globalThis as { navigator?: { userAgent?: string } }).navigator;
    return navigatorObject?.userAgent ?? "";
  } catch {
    return "";
  }
}

function hasDocument(): boolean {
  return typeof document !== "undefined";
}

function hasNodeProcess(): boolean {
  return typeof process !== "undefined" && Boolean(process.versions?.node);
}

/**
 * Detect the current execution environment without touching wallet providers.
 * Native iOS/Android and Decentraland must never be treated as browsers.
 */
export function getRuntimeKind(): RuntimeKind {
  if (runtimeOverride) return runtimeOverride;

  const flagged = readGlobalRuntimeFlag();
  if (flagged) return flagged;

  const env = typeof process !== "undefined" ? process.env : undefined;
  if (env?.EXPO_OS === "web" || env?.EXPO_PUBLIC_PLATFORM === "web") return "react-native-web";
  if (hasDocument() && (env?.EXPO !== undefined || env?.EXPO_OS === "web")) return "react-native-web";

  const product = readNavigatorProduct();
  if (product === "ReactNative") {
    if (hasDocument()) return "react-native-web";
    const userAgent = readUserAgent();
    if (/android/i.test(userAgent)) return "react-native-android";
    return "react-native-ios";
  }

  if (env?.EXPO_OS === "ios") return "react-native-ios";
  if (env?.EXPO_OS === "android") return "react-native-android";

  if (hasDocument()) {
    return env?.EXPO !== undefined ? "react-native-web" : "browser";
  }

  if (hasNodeProcess()) return "server";
  return "unknown";
}

export function isNativeRuntime(kind: RuntimeKind = getRuntimeKind()): boolean {
  return kind === "react-native-ios" || kind === "react-native-android";
}

export function isBrowserRuntime(kind: RuntimeKind = getRuntimeKind()): boolean {
  return kind === "browser" || kind === "react-native-web";
}

export function isDecentralandRuntime(kind: RuntimeKind = getRuntimeKind()): boolean {
  return kind === "decentraland";
}

export function isServerRuntime(kind: RuntimeKind = getRuntimeKind()): boolean {
  return kind === "server";
}

/**
 * Injected EIP-1193 providers are only safe in browser-like hosts.
 * Native and Decentraland runtimes must never read window.ethereum.
 * Node tests may inject a fake provider on globalThis.
 */
export function canAccessInjectedEthereum(kind: RuntimeKind = getRuntimeKind()): boolean {
  if (isNativeRuntime(kind) || isDecentralandRuntime(kind) || isServerRuntime(kind)) return false;
  return isBrowserRuntime(kind);
}

export function setRuntimeKindForTests(kind: RuntimeKind | null): void {
  runtimeOverride = kind;
}

export function markDecentralandRuntime(): void {
  (globalThis as { __FRIENDZONE_RUNTIME__?: RuntimeKind }).__FRIENDZONE_RUNTIME__ = "decentraland";
}
