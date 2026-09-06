import { describe, expect, it } from "vitest";

import { parseJsonArray, parseRecentCrew, parseStoredStats, resolveBooleanRecovery, resolvePartyCodeRecovery, resolveRecentCrewRecovery, resolveRsvpEventRecovery, resolveWaitlistRecovery } from "../lib/persisted-parsers";

type MatchStub = { id: string };
const isMatchStub = (value: unknown): value is MatchStub => typeof value === "object" && value !== null && "id" in value && typeof value.id === "string";

describe("persisted parsers", () => {
  it("accepts only arrays whose items pass validation", () => {
    expect(parseJsonArray('[{"id":"match-1"}]', isMatchStub)).toEqual([{ id: "match-1" }]);
    expect(parseJsonArray('[{"id":7}]', isMatchStub)).toBeNull();
  });

  it("rejects malformed JSON and invalid history payloads", () => {
    expect(() => parseJsonArray("{", isMatchStub)).toThrow();
    expect(parseJsonArray("{}", isMatchStub)).toBeNull();
  });

  it("recovers party codes safely across hydration outcomes", () => {
    expect(resolvePartyCodeRecovery("valid", "TUG-AB12", "TUG-7Q2K")).toEqual({ value: "TUG-AB12", shouldPersist: false, warning: false });
    expect(resolvePartyCodeRecovery("malformed", null, "TUG-7Q2K")).toEqual({ value: "TUG-7Q2K", shouldPersist: true, warning: true });
    expect(resolvePartyCodeRecovery("missing", null, "TUG-7Q2K")).toEqual({ value: "TUG-7Q2K", shouldPersist: true, warning: false });
    expect(resolvePartyCodeRecovery("unavailable", null, "TUG-7Q2K")).toEqual({ value: "TUG-7Q2K", shouldPersist: false, warning: true });
  });

  it("normalizes recent crew and caps the persisted list", () => {
    expect(parseRecentCrew('["NovaNina","NovaNina","PixelPuller","RopeRanger","ManaMax"]')).toEqual(["NovaNina", "PixelPuller", "RopeRanger", "ManaMax"]);
    expect(parseRecentCrew('["NovaNina",7]')).toBeNull();
    expect(resolveRecentCrewRecovery("valid", ["NovaNina", "NovaNina", "PixelPuller", "RopeRanger", "ManaMax"])).toEqual({ value: ["NovaNina", "PixelPuller", "RopeRanger", "ManaMax"], warning: false });
    expect(resolveRecentCrewRecovery("malformed", null)).toEqual({ value: [], warning: true });
    expect(resolveRecentCrewRecovery("unavailable", null)).toEqual({ value: [], warning: true });
  });

  it("recovers RSVP and waitlist state without committing invalid values", () => {
    expect(resolveRsvpEventRecovery("valid", "Plaza Sprint")).toEqual({ value: "Plaza Sprint", warning: false });
    expect(resolveRsvpEventRecovery("missing", null)).toEqual({ value: null, warning: false });
    expect(resolveRsvpEventRecovery("malformed", null)).toEqual({ value: null, warning: true });
    expect(resolveRsvpEventRecovery("unavailable", null)).toEqual({ value: null, warning: true });
    expect(resolveWaitlistRecovery("valid", true)).toEqual({ value: true, warning: false });
    expect(resolveWaitlistRecovery("missing", null)).toEqual({ value: false, warning: false });
    expect(resolveWaitlistRecovery("malformed", null)).toEqual({ value: false, warning: true });
    expect(resolveWaitlistRecovery("unavailable", null)).toEqual({ value: false, warning: true });
  });

  it("recovers persisted boolean preferences with safe defaults", () => {
    expect(resolveBooleanRecovery("valid", true)).toEqual({ value: true, warning: false });
    expect(resolveBooleanRecovery("valid", false)).toEqual({ value: false, warning: false });
    expect(resolveBooleanRecovery("missing", null)).toEqual({ value: false, warning: false });
    expect(resolveBooleanRecovery("malformed", null)).toEqual({ value: false, warning: true });
    expect(resolveBooleanRecovery("unavailable", null, true)).toEqual({ value: true, warning: true });
  });

  it("accepts complete non-negative statistics and rejects partial data", () => {
    expect(parseStoredStats('{"wins":3,"totalPulls":44,"bestStreak":7}')).toEqual({ wins: 3, totalPulls: 44, bestStreak: 7 });
    expect(parseStoredStats('{"wins":3,"totalPulls":44}')).toBeNull();
    expect(parseStoredStats('{"wins":-1,"totalPulls":44,"bestStreak":7}')).toBeNull();
  });
});
