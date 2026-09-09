import { describe, expect, it } from "vitest";

import { parsePreferredPort } from "../server/_core/listen-port";

describe("API listen port recovery", () => {
  it("uses a valid integer port from the environment", () => {
    expect(parsePreferredPort("8080")).toBe(8080);
  });

  it("falls back when the value is missing, blank, or out of range", () => {
    expect(parsePreferredPort(undefined)).toBe(3000);
    expect(parsePreferredPort("")).toBe(3000);
    expect(parsePreferredPort("not-a-port")).toBe(3000);
    expect(parsePreferredPort("0")).toBe(3000);
    expect(parsePreferredPort("70000")).toBe(3000);
    expect(parsePreferredPort("-1", 4000)).toBe(4000);
  });
});
