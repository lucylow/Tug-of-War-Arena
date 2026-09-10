import { describe, expect, it } from "vitest";

import {
  createCanonicalWorldFeed,
  parseWorldFeed,
  parseWorldFeedOrFallback,
  serializeWorldFeed,
} from "../../shared/demo-world";
import { projectWorldFeedToMobile, projectWorldToMinimapPoints } from "../../lib/world/projection";

describe("canonical demo world", () => {
  it("seeds the featured Friendzone demo state", () => {
    const feed = createCanonicalWorldFeed();
    expect(feed.origin).toBe("demo");
    expect(feed.players).toHaveLength(18);
    expect(feed.rooms).toHaveLength(5);
    expect(feed.matches).toHaveLength(24);
    expect(feed.missions).toHaveLength(5);
    expect(feed.events).toHaveLength(8);
    expect(feed.activity).toHaveLength(24);
    expect(feed.reactions).toHaveLength(20);
    expect(feed.players[0]?.displayName).toBe("NovaWisp");
    expect(feed.rooms[0]).toMatchObject({ title: "Friday Night Pull", code: "731XZ", phase: "active" });
    expect(feed.scoreboard).toMatchObject({ sunScore: 428, moonScore: 381, timeLabel: "00:42" });
    expect(feed.missions[0]).toMatchObject({ title: "Pull Together", progress: 84, target: 100 });
    expect(feed.events.some((event) => event.title === "Sun vs Moon Cup")).toBe(true);
    expect(feed.governance.proposalTitle).toContain("DEMO");
  });

  it("round-trips WorldFeed JSON", () => {
    const feed = createCanonicalWorldFeed();
    const parsed = parseWorldFeed(serializeWorldFeed(feed));
    expect(parsed?.rooms[0]?.code).toBe("731XZ");
    expect(parseWorldFeed("not-json")).toBeNull();
    expect(parseWorldFeedOrFallback("nope").origin).toBe("demo");
  });
});

describe("mobile projection", () => {
  it("projects players, rooms, events, and missions from the same feed", () => {
    const projection = projectWorldFeedToMobile(createCanonicalWorldFeed());
    expect(projection.origin).toBe("demo");
    expect(projection.presence.every((player) => player.presence !== "offline")).toBe(true);
    expect(projection.rooms[0]?.code).toBe("731XZ");
    expect(projection.missions[0]?.title).toBe("Pull Together");
    expect(projection.events.some((event) => event.title === "Sun vs Moon Cup")).toBe(true);
    expect(projection.onlineDemoCount).toBeGreaterThan(0);
    expect(projection.onlineDemoCount).toBeLessThanOrEqual(18);
  });

  it("maps 3D coordinates onto the mini-map", () => {
    const points = projectWorldToMinimapPoints(createCanonicalWorldFeed());
    expect(points.some((point) => point.kind === "player" && point.x > 0)).toBe(true);
    expect(points.some((point) => point.kind === "event")).toBe(true);
  });
});
