import { describe, expect, it } from "vitest";

import { resolveOAuthCallbackOutcome } from "../lib/oauth-flow";

describe("OAuth callback outcomes", () => {
  it("prioritizes an explicit OAuth error", () => {
    expect(
      resolveOAuthCallbackOutcome({
        error: "access_denied",
        sessionToken: "token-1",
        code: "code-1",
        state: "state-1",
      }),
    ).toEqual({ kind: "error", message: "access_denied" });
  });

  it("uses a direct session token before requiring an exchange", () => {
    expect(resolveOAuthCallbackOutcome({ sessionToken: "token-1" })).toEqual({
      kind: "session-token",
      sessionToken: "token-1",
    });
  });

  it("returns an exchange outcome only with both code and state", () => {
    expect(resolveOAuthCallbackOutcome({ code: "code-1", state: "state-1" })).toEqual({
      kind: "exchange",
      code: "code-1",
      state: "state-1",
    });
    expect(resolveOAuthCallbackOutcome({ code: "code-1" })).toEqual({
      kind: "missing-parameters",
      message: "Missing code or state parameter",
    });
    expect(resolveOAuthCallbackOutcome({ state: "state-1" })).toEqual({
      kind: "missing-parameters",
      message: "Missing code or state parameter",
    });
  });
});
