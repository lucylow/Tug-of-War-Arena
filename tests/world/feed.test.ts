import { describe, expect, it } from "vitest";

import { createCanonicalWorldFeed, resetDemoUniverse, CANONICAL_WORLD_SEED } from "../../shared/demo-world";
import { parseFriendzoneDeepLink, isSafeExternalUrl } from "../../lib/world/deepLinks";
import {
  projectArena,
  projectEvents,
  projectMissions,
  projectPlayers,
  projectRooms,
} from "../../lib/world/projectToMobile";

describe("shared world feed", () => {
  it("is deterministic for the canonical seed", () => {
    const first = resetDemoUniverse(CANONICAL_WORLD_SEED);
    const second = createCanonicalWorldFeed(CANONICAL_WORLD_SEED);
    expect(first.players.map((player) => player.displayName)).toEqual(second.players.map((player) => player.displayName));
    expect(first.players).toHaveLength(18);
    expect(first.rooms).toHaveLength(5);
    expect(first.events).toHaveLength(8);
    expect(first.missions).toHaveLength(5);
    expect(first.matches).toHaveLength(24);
    expect(first.activity.length).toBeGreaterThanOrEqual(20);
    expect(first.origin).toBe("demo");
    expect(first.players[0]).toMatchObject({ displayName: "NovaWisp", origin: "demo", score: 1084, streak: 4 });
    expect(first.rooms[0]).toMatchObject({ title: "Friday Night Pull", code: "731XZ" });
    expect(first.scoreboard).toMatchObject({ sunScore: 428, moonScore: 381, timeLabel: "00:42" });
    expect(first.events.some((event) => event.title === "Sun vs Moon Cup")).toBe(true);
  });

  it("projects 3D coordinates into bounded 2D companion cards", () => {
    const feed = createCanonicalWorldFeed();
    expect(projectPlayers(feed).every((player) => player.origin === "demo")).toBe(true);
    expect(projectRooms(feed)[0]?.code).toBe("731XZ");
    expect(projectEvents(feed).length).toBe(8);
    expect(projectMissions(feed).some((mission) => mission.progress === 84 && mission.target === 100)).toBe(true);
    expect(projectArena(feed).roomCode).toBe("731XZ");
  });

  it("parses friendzone deep links and rejects unsafe URLs", () => {
    expect(parseFriendzoneDeepLink("friendzone://world")).toEqual({ kind: "world" });
    expect(parseFriendzoneDeepLink("friendzone://room/731XZ")).toEqual({ kind: "room", code: "731XZ" });
    expect(parseFriendzoneDeepLink("friendzone://match/demo-match-001")).toEqual({ kind: "match", matchId: "demo-match-001" });
    expect(parseFriendzoneDeepLink("friendzone://governance")).toEqual({ kind: "governance" });
    expect(parseFriendzoneDeepLink("not-a-link")).toBeNull();
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("https://play.decentraland.org/?position=0,0")).toBe(true);
    expect(isSafeExternalUrl("data:text/html,hi")).toBe(false);
  });
});
