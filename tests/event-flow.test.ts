import { describe, expect, it } from "vitest";

import { formatFriendzoneEventShareMessage, recoverFriendzoneModalSelection, resolveFriendzoneEventModalAction, resolveFriendzoneEventTitle, toggleFriendzoneRsvp } from "../lib/event-flow";

describe("Friendzone event selection", () => {
  it("accepts the supported Plaza and wearable events", () => {
    expect(resolveFriendzoneEventTitle("Plaza Sprint")).toBe("Plaza Sprint");
    expect(resolveFriendzoneEventTitle("Wearable Rush")).toBe("Wearable Rush");
  });

  it("rejects missing and stale event selections", () => {
    expect(resolveFriendzoneEventTitle(null)).toBeNull();
    expect(resolveFriendzoneEventTitle(undefined)).toBeNull();
    expect(resolveFriendzoneEventTitle(42)).toBeNull();
    expect(resolveFriendzoneEventTitle({ title: "Plaza Sprint" })).toBeNull();
    expect(resolveFriendzoneEventTitle("Old Event")).toBeNull();
    expect(resolveFriendzoneEventTitle("")).toBeNull();
  });

  it("toggles RSVP selection without changing unrelated party state", () => {
    expect(toggleFriendzoneRsvp(null, "Plaza Sprint")).toBe("Plaza Sprint");
    expect(toggleFriendzoneRsvp("Plaza Sprint", "Plaza Sprint")).toBeNull();
    expect(toggleFriendzoneRsvp("Plaza Sprint", "Wearable Rush")).toBe("Wearable Rush");
  });

  it("recovers valid selections and closes stale modal selections", () => {
    expect(recoverFriendzoneModalSelection("Plaza Sprint")).toEqual({ eventTitle: "Plaza Sprint", shouldClose: false });
    expect(recoverFriendzoneModalSelection("Wearable Rush")).toEqual({ eventTitle: "Wearable Rush", shouldClose: false });
    expect(recoverFriendzoneModalSelection(undefined)).toEqual({ eventTitle: null, shouldClose: true });
    expect(recoverFriendzoneModalSelection("stale-event")).toEqual({ eventTitle: null, shouldClose: true });
  });

  it("resolves modal actions from current RSVP and waitlist state", () => {
    expect(resolveFriendzoneEventModalAction("Plaza Sprint", null, false)).toBe("rsvp");
    expect(resolveFriendzoneEventModalAction("Plaza Sprint", "Plaza Sprint", false)).toBe("cancel-rsvp");
    expect(resolveFriendzoneEventModalAction("Wearable Rush", null, false)).toBe("join-waitlist");
    expect(resolveFriendzoneEventModalAction("Wearable Rush", "Wearable Rush", true)).toBe("leave-waitlist");
    expect(resolveFriendzoneEventModalAction("Plaza Sprint", "Wearable Rush", true)).toBe("rsvp");
  });

  it("keeps event share copy aligned with each reward path", () => {
    const plazaShare = formatFriendzoneEventShareMessage("Plaza Sprint", "TUG-7Q2K");
    const wearableShare = formatFriendzoneEventShareMessage("Wearable Rush", "TUG-7Q2K");
    expect(plazaShare).toContain("Top crews earn a Plaza leaderboard finish.");
    expect(wearableShare).toContain("Top pullers unlock the Friendzone Plaza Band preview.");
    expect(plazaShare).toContain("code TUG-7Q2K");
    expect(wearableShare).toContain("https://play.decentraland.org/?position=0,0");
    expect(formatFriendzoneEventShareMessage("Plaza Match Recap", "TUG-7Q2K")).toContain("Bring your crew back to Plaza 0,0");
  });
});
