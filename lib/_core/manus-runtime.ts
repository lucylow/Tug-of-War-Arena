/**
 * Manus Runtime - Communication layer between Expo web app and parent container (next-agent-webapp)
 *
 * Simplified flow:
 * 1. initManusRuntime() called
 * 2. Send 'appDevServerReady' to parent to signal app is ready
 *
 * User will manually login via the app's login page - no automatic cookie injection.
 */

import { Platform } from "react-native";
import type { Metrics } from "react-native-safe-area-context";

// Debug logging with timestamps
const DEBUG = true;
const log = (msg: string) => {
  if (!DEBUG) return;
  const ts = new Date().toISOString();
  console.log(`[ManusRuntime ${ts}] ${msg}`);
};

type MessageType = "appDevServerReady";
type SafeAreaInsets = { top: number; right: number; bottom: number; left: number };
type SafeAreaCallback = (metrics: Metrics) => void;

interface SpacePreviewerMessage {
  type: "SpacePreviewerChannel";
  payload: {
    type: string;
    from: "container" | "content";
    to: "container" | "content";
    payload: Record<string, unknown>;
  };
}

function isInIframe(): boolean {
  if (Platform.OS !== "web") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isWeb(): boolean {
  return Platform.OS === "web";
}

function sendToParent(type: MessageType, payload: Record<string, unknown> = {}): void {
  // NOTE: Validate parent origin if we need to transfer sensitive data
  if (!isWeb() || !isInIframe()) return;

  const message: SpacePreviewerMessage = {
    type: "SpacePreviewerChannel",
    payload: { type, from: "content", to: "container", payload },
  };
  try {
    window.parent.postMessage(message, "*");
    log(`Sent to parent: ${type}`);
  } catch (error) {
    // Preview messaging is optional; never let an unavailable parent crash the app.
    log(`Unable to notify parent: ${error instanceof Error ? error.message : String(error)}`);
  }
}

let initialized = false;
let safeAreaCallback: SafeAreaCallback | null = null;

function isValidInsets(payload: Record<string, unknown>): payload is SafeAreaInsets {
  return (
    typeof payload.top === "number" &&
    typeof payload.bottom === "number" &&
    typeof payload.left === "number" &&
    typeof payload.right === "number"
  );
}

function handleMessage(event: MessageEvent<unknown>): void {
  // NOTE: Validate event.origin if we need to transfer sensitive data
  const data = event.data as SpacePreviewerMessage | undefined;
  if (!data || data.type !== "SpacePreviewerChannel") return;

  const { payload } = data;
  if (!payload || payload.to !== "content") return;

  if (payload.type === "setSafeAreaInsets" && isValidInsets(payload.payload) && safeAreaCallback) {
    const insets = payload.payload;
    const frame = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
    try {
      safeAreaCallback({ insets, frame });
    } catch (error) {
      // A consumer may unmount between message delivery and callback execution.
      // Keep the runtime alive even if that consumer rejects the update.
      log(`Safe-area callback failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    log(
      `Received safe area insets from parent: top=${insets.top}, bottom=${insets.bottom}, left=${insets.left}, right=${insets.right}`,
    );
  }
}

/**
 * Subscribe to safe area updates from the parent container.
 */
export function subscribeSafeAreaInsets(callback: SafeAreaCallback): () => void {
  safeAreaCallback = callback;
  return () => {
    if (safeAreaCallback === callback) {
      safeAreaCallback = null;
    }
  };
}

/**
 * Initialize Manus Runtime - just notifies parent that app is ready
 */
export function initManusRuntime(): void {
  if (!isWeb() || !isInIframe()) return;
  if (initialized) return;
  initialized = true;

  try {
    log("initManusRuntime called");
    window.addEventListener("message", handleMessage);
    sendToParent("appDevServerReady", {});
  } catch (error) {
    // Initialization is a best-effort integration with the preview shell.
    // Remove a partially registered listener before allowing a clean retry.
    try {
      window.removeEventListener("message", handleMessage);
    } catch {
      // Ignore secondary cleanup failures while recovering from initialization.
    }
    initialized = false;
    log(`Runtime initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Remove preview listeners so StrictMode remounts and hot reloads do not
 * accumulate handlers or leave stale callbacks behind.
 */
export function disposeManusRuntime(): void {
  if (!isWeb()) return;
  try {
    window.removeEventListener("message", handleMessage);
  } catch (error) {
    log(`Runtime cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    initialized = false;
    safeAreaCallback = null;
  }
}

/**
 * Check if running inside preview iframe
 */
export function isRunningInPreviewIframe(): boolean {
  return isWeb() && isInIframe();
}
