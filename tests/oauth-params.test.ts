import { describe, expect, it } from "vitest";

import {
  decodeOAuthUserPayload,
  parseOAuthFallbackParams,
  readOAuthErrorParam,
  readSingleSearchParam,
} from "../lib/oauth-params";

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
    expect(readOAuthErrorParam("?error=%20")).toBeNull();
    expect(readOAuthErrorParam("http://[")).toBeNull();
    expect(readOAuthErrorParam(null)).toBeNull();
  });

  it("normalizes duplicated or blank search params without throwing", () => {
    expect(readSingleSearchParam("token-1")).toBe("token-1");
    expect(readSingleSearchParam(["", " token-2 "])).toBe("token-2");
    expect(readSingleSearchParam(["  ", ""])).toBeNull();
    expect(readSingleSearchParam(undefined)).toBeNull();
  });

  it("decodes a valid user payload and ignores malformed base64", () => {
    const encoded = Buffer.from(JSON.stringify({ openId: "player-1", name: "Sun Crew" })).toString(
      "base64",
    );
    expect(decodeOAuthUserPayload(encoded)).toEqual({ openId: "player-1", name: "Sun Crew" });
    expect(decodeOAuthUserPayload("%%%not-base64%%%")).toBeNull();
    expect(decodeOAuthUserPayload("{")).toBeNull();
  });
});
