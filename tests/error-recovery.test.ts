import { describe, expect, it } from "vitest";

import {
  errorRecoveryCopy,
  initialErrorRecoveryState,
  reduceErrorRecovery,
} from "../lib/error-recovery";

describe("error recovery state", () => {
  it("captures an unexpected render failure", () => {
    expect(reduceErrorRecovery(initialErrorRecoveryState, { type: "capture" })).toEqual({
      hasError: true,
    });
  });

  it("resets an error state without changing the shared initial contract", () => {
    const failedState = reduceErrorRecovery(initialErrorRecoveryState, { type: "capture" });
    expect(reduceErrorRecovery(failedState, { type: "reset" })).toEqual(initialErrorRecoveryState);
    expect(initialErrorRecoveryState).toEqual({ hasError: false });
  });

  it("keeps reset idempotent", () => {
    expect(reduceErrorRecovery(initialErrorRecoveryState, { type: "reset" })).toEqual({
      hasError: false,
    });
  });

  it("keeps recovery copy and accessibility labels stable", () => {
    expect(errorRecoveryCopy).toMatchObject({
      accessibilityLabel: "Tug of War Arena error recovery",
      buttonLabel: "Return to Arena Home",
      buttonHint: "Dismisses the error and reloads the app content",
    });
    expect(errorRecoveryCopy.body).toContain("local match is safe");
  });
});
