import { describe, expect, it } from "vitest";

import { parseOAuthFallbackParams, readOAuthErrorParam } from "../lib/oauth-params";

describe("OAuth fallback parameters", () => {
  it("decodes supported callback parameters from a relative URL", () => {
    expect(
      parseOAuthFallbackParams("/oauth/callback?code=abc%20123&state=friendzone&sessionToken=token-7"),
    ).toEqual({ code: "abc 123", state: "friendzone", sessionToken: "token-7" });
  });

  it("ignores incomplete and unknown parameters", () => {
    expect(parseOAuthFallbackParams("?code=&state&unexpected=value&sessionToken=ok")).toEqual({
      sessionToken: "ok",
    });
  });

  it("ignores malformed percent encoding without throwing", () => {
    expect(parseOAuthFallbackParams("?code=%E0%A4%A&state=valid")).toEqual({ state: "valid" });
    expect(parseOAuthFallbackParams("/oauth/callback")).toEqual({});
  });

  it("reads error parameters without throwing on malformed URLs", () => {
    expect(readOAuthErrorParam("https://example.com/oauth/callback?error=access_denied")).toBe(
      "access_denied",
    );
    expect(readOAuthErrorParam("?error=cancelled")).toBe("cancelled");
    expect(readOAuthErrorParam("http://[")).toBeNull();
    expect(readOAuthErrorParam(null)).toBeNull();
  });
});
