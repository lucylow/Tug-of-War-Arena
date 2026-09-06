import { describe, expect, it } from "vitest";

import { parseBoolean, parseHydratedValue } from "../lib/local-hydration";
import { resolveFriendzoneEventTitle } from "../lib/event-flow";

describe("local hydration", () => {
  it("distinguishes missing values from valid values", () => {
    expect(parseHydratedValue(null, (value) => value)).toEqual({ status: "missing" });
    expect(parseHydratedValue("TUG-7Q2K", (value) => value)).toEqual({ status: "valid", value: "TUG-7Q2K" });
  });

  it("marks rejected parser values and parser exceptions as malformed", () => {
    expect(parseHydratedValue("maybe", parseBoolean)).toEqual({ status: "malformed" });
    expect(parseHydratedValue("{", (value) => JSON.parse(value))).toEqual({ status: "malformed" });
    expect(parseHydratedValue("undefined", () => undefined)).toEqual({ status: "malformed" });
  });

  it("parses persisted booleans without accepting ambiguous values", () => {
    expect(parseBoolean("true")).toBe(true);
    expect(parseBoolean("false")).toBe(false);
    expect(parseBoolean("1")).toBeNull();
  });

  it("normalizes persisted RSVP events through the shared event resolver", () => {
    expect(parseHydratedValue("Plaza Sprint", resolveFriendzoneEventTitle)).toEqual({ status: "valid", value: "Plaza Sprint" });
    expect(parseHydratedValue("Wearable Rush", resolveFriendzoneEventTitle)).toEqual({ status: "valid", value: "Wearable Rush" });
    expect(parseHydratedValue("stale-event", resolveFriendzoneEventTitle)).toEqual({ status: "malformed" });
  });

  it("keeps malformed auto-advance preferences from changing the safe default", () => {
    expect(parseHydratedValue(null, parseBoolean)).toEqual({ status: "missing" });
    expect(parseHydratedValue("true", parseBoolean)).toEqual({ status: "valid", value: true });
    expect(parseHydratedValue("false", parseBoolean)).toEqual({ status: "valid", value: false });
    expect(parseHydratedValue("enabled", parseBoolean)).toEqual({ status: "malformed" });
  });
});
