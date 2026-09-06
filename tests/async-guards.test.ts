import { describe, expect, it } from "vitest";

import { canStartAsyncAction, formatNativeHandoffFeedback, JUDGE_SETTINGS_TOAST_DURATION_MS, resolveAsyncActionOutcome, resolveClipboardCopyOutcome, resolveNativeHandoffOutcome, resolveNativeShareOutcome, resolveShareActionTransition, shouldCommitAsyncResult } from "../lib/async-guards";

describe("async UI guards", () => {
  it("resolves async action outcomes without committing unmounted results", () => {
    expect(resolveAsyncActionOutcome({ isMounted: true, succeeded: true, fallbackAvailable: true })).toBe("success");
    expect(resolveAsyncActionOutcome({ isMounted: true, succeeded: false, fallbackAvailable: true })).toBe("fallback");
    expect(resolveAsyncActionOutcome({ isMounted: true, succeeded: false, fallbackAvailable: false })).toBe("success");
    expect(resolveAsyncActionOutcome({ isMounted: false, succeeded: true, fallbackAvailable: true })).toBe("ignore-unmounted");
  });
  it("allows a completed async result while the screen is mounted", () => {
    expect(shouldCommitAsyncResult(true)).toBe(true);
  });

  it("rejects a completed async result after unmount", () => {
    expect(shouldCommitAsyncResult(false)).toBe(false);
  });

  it("starts only one async handoff while another operation is active", () => {
    expect(canStartAsyncAction(false)).toBe(true);
    expect(canStartAsyncAction(true)).toBe(false);
  });

  it("rejects a duplicate Demo Reset while cleanup is already active", () => {
    expect(canStartAsyncAction(false)).toBe(true);
    expect(canStartAsyncAction(true)).toBe(false);
  });

  it("does not commit a Demo Reset completion after unmount", () => {
    expect(shouldCommitAsyncResult(false)).toBe(false);
  });

  it("uses a short, deterministic Presenter toast duration", () => {
    expect(JUDGE_SETTINGS_TOAST_DURATION_MS).toBe(2200);
  });

  it("resolves Presenter settings copy outcomes safely", () => {
    expect(resolveClipboardCopyOutcome({ copied: true, isMounted: true, inFlight: false })).toBe("copied");
    expect(resolveClipboardCopyOutcome({ copied: false, isMounted: true, inFlight: false })).toBe("fallback");
    expect(resolveClipboardCopyOutcome({ copied: true, isMounted: true, inFlight: true })).toBe("ignored");
    expect(resolveClipboardCopyOutcome({ copied: true, isMounted: false, inFlight: false })).toBe("ignored");
  });

  it("blocks a second party-code copy while the first handoff is busy", () => {
    expect(canStartAsyncAction(false)).toBe(true);
    expect(canStartAsyncAction(true)).toBe(false);
    expect(resolveClipboardCopyOutcome({ copied: true, isMounted: true, inFlight: true })).toBe("ignored");
  });

  it("accepts a mounted party-code copy and falls back safely when clipboard rejects", () => {
    expect(resolveClipboardCopyOutcome({ copied: true, isMounted: true, inFlight: false })).toBe("copied");
    expect(resolveClipboardCopyOutcome({ copied: false, isMounted: true, inFlight: false })).toBe("fallback");
  });

  it("ignores a late party-code copy result after unmount", () => {
    expect(shouldCommitAsyncResult(false)).toBe(false);
    expect(resolveClipboardCopyOutcome({ copied: true, isMounted: false, inFlight: false })).toBe("ignored");
  });

  it("formats native handoff feedback with visible and announcement parity", () => {
    expect(formatNativeHandoffFeedback("shared")).toEqual({ status: "Invite shared", announcement: "The invite is ready in the native share sheet." });
    expect(formatNativeHandoffFeedback("dismissed")).toEqual({ status: "Share sheet dismissed", announcement: "The share sheet was dismissed. You can try sharing again." });
    expect(formatNativeHandoffFeedback("fallback")).toEqual({ status: "Ready to copy", announcement: "Native sharing is unavailable. The invite remains ready to copy." });
  });

  it("resolves native handoff availability and dismissal outcomes", () => {
    expect(resolveNativeHandoffOutcome({ nativeAvailable: true, action: "sharedAction", dismissedAction: "dismissedAction" })).toBe("shared");
    expect(resolveNativeHandoffOutcome({ nativeAvailable: true, action: "dismissedAction", dismissedAction: "dismissedAction" })).toBe("dismissed");
    expect(resolveNativeHandoffOutcome({ nativeAvailable: false, action: "sharedAction", dismissedAction: "dismissedAction" })).toBe("fallback");
  });

  it("treats a dismissed native share sheet as a non-success", () => {
    expect(resolveNativeShareOutcome("sharedAction", "dismissedAction")).toBe("shared");
    expect(resolveNativeShareOutcome("dismissedAction", "dismissedAction")).toBe("dismissed");
  });

  it("models share start blocking and safe completion transitions", () => {
    expect(resolveShareActionTransition({ phase: "start", inFlight: false, isMounted: true })).toBe("started");
    expect(resolveShareActionTransition({ phase: "start", inFlight: true, isMounted: true })).toBe("blocked");
    expect(resolveShareActionTransition({ phase: "finish", inFlight: true, isMounted: true })).toBe("completed");
    expect(resolveShareActionTransition({ phase: "finish", inFlight: true, isMounted: false })).toBe("unmounted");
  });
});

