import { describe, expect, it } from "vitest";

import { parseApiJsonBody, readApiErrorMessage } from "../lib/api-response";

describe("API response recovery", () => {
  it("parses JSON bodies and treats empty payloads as an empty object", () => {
    expect(parseApiJsonBody<{ ok: boolean }>('{"ok":true}')).toEqual({ ok: true });
    expect(parseApiJsonBody("")).toEqual({});
    expect(parseApiJsonBody("   ")).toEqual({});
  });

  it("throws a stable error for malformed JSON bodies", () => {
    expect(() => parseApiJsonBody("<html>nope</html>")).toThrow("API returned an invalid JSON response");
  });

  it("prefers structured API error text and hides oversized HTML payloads", () => {
    expect(readApiErrorMessage('{"error":"Invalid token"}', "Unauthorized")).toBe("Invalid token");
    expect(readApiErrorMessage('{"message":"Not found"}', "Not Found")).toBe("Not found");
    expect(readApiErrorMessage("plain failure", "Bad Request")).toBe("plain failure");
    expect(readApiErrorMessage("", "Bad Gateway")).toBe("API call failed: Bad Gateway");
    expect(readApiErrorMessage("<!doctype html>" + "x".repeat(400), "Internal Server Error")).toBe(
      "API call failed",
    );
  });
});
