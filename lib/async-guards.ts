export function shouldCommitAsyncResult(isMounted: boolean): boolean {
  return isMounted;
}

export function canStartAsyncAction(inFlight: boolean): boolean {
  return !inFlight;
}

export type ShareActionTransition = "started" | "blocked" | "completed" | "unmounted";

export function resolveShareActionTransition({
  phase,
  inFlight,
  isMounted,
}: {
  phase: "start" | "finish";
  inFlight: boolean;
  isMounted: boolean;
}): ShareActionTransition {
  if (phase === "start") return inFlight ? "blocked" : "started";
  return isMounted ? "completed" : "unmounted";
}

export const JUDGE_SETTINGS_TOAST_DURATION_MS = 2200;

export type AsyncActionOutcome = "success" | "fallback" | "ignore-unmounted";

export function resolveAsyncActionOutcome({
  isMounted,
  succeeded,
  fallbackAvailable,
}: {
  isMounted: boolean;
  succeeded: boolean;
  fallbackAvailable: boolean;
}): AsyncActionOutcome {
  if (!isMounted) return "ignore-unmounted";
  if (succeeded) return "success";
  return fallbackAvailable ? "fallback" : "success";
}

export type NativeShareOutcome = "shared" | "dismissed";
export type NativeHandoffOutcome = "shared" | "dismissed" | "fallback";

export function resolveNativeHandoffOutcome({
  nativeAvailable,
  action,
  dismissedAction,
}: {
  nativeAvailable: boolean;
  action: string;
  dismissedAction: string;
}): NativeHandoffOutcome {
  if (!nativeAvailable) return "fallback";
  return action === dismissedAction ? "dismissed" : "shared";
}

export type NativeHandoffFeedback = { status: string; announcement: string };

export function formatNativeHandoffFeedback(outcome: NativeHandoffOutcome): NativeHandoffFeedback {
  if (outcome === "shared") return { status: "Invite shared", announcement: "The invite is ready in the native share sheet." };
  if (outcome === "dismissed") return { status: "Share sheet dismissed", announcement: "The share sheet was dismissed. You can try sharing again." };
  return { status: "Ready to copy", announcement: "Native sharing is unavailable. The invite remains ready to copy." };
}

export function resolveNativeShareOutcome(action: string, dismissedAction: string): NativeShareOutcome {
  return resolveNativeHandoffOutcome({ nativeAvailable: true, action, dismissedAction }) as NativeShareOutcome;
}

export type ClipboardCopyOutcome = "copied" | "fallback" | "ignored";

export function resolveClipboardCopyOutcome({
  copied,
  isMounted,
  inFlight,
}: {
  copied: boolean;
  isMounted: boolean;
  inFlight: boolean;
}): ClipboardCopyOutcome {
  if (inFlight || !isMounted) return "ignored";
  return copied ? "copied" : "fallback";
}

