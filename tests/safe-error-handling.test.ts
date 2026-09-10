import { describe, expect, it } from "vitest";

import { getUserFacingMessage, normalizeError, runSafely, runSync, toUserMessage } from "../lib/errors/appError";

describe("app error normalization", () => {
  it("does not leak wallet extension URLs into user-facing copy", () => {
    const message = toUserMessage(new Error("Failed chrome-extension://abc123/inpage.js handshake"));
    expect(message).not.toMatch(/chrome-extension:/i);
    expect(message).toContain("demo mode");
  });

  it("maps wallet rejection codes to recoverable copy", () => {
    const normalized = normalizeError({ code: 4001, message: "User rejected the request" });
    expect(normalized.code).toBe("USER_REJECTED");
    expect(normalized.recoverable).toBe(true);
    expect(normalized.message).toBe("Wallet connection canceled.");
  });

  it("keeps generic errors readable after sanitizing", () => {
    expect(getUserFacingMessage(new Error("Demo universe failed to generate"))).toBe("Demo universe failed to generate");
    expect(toUserMessage(null)).toBeTruthy();
  });
});

describe("safe runners", () => {
  it("returns the fallback when async work throws", async () => {
    const result = await runSafely(async () => {
      throw new Error("boom");
    }, "offline");
    expect(result).toBe("offline");
  });

  it("returns the fallback when sync work throws", () => {
    expect(
      runSync(() => {
        throw new Error("boom");
      }, 42),
    ).toBe(42);
  });

  it("returns the successful value when work completes", async () => {
    await expect(runSafely(async () => "ok", "offline")).resolves.toBe("ok");
  });
});
