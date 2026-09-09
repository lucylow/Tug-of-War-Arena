import { describe, expect, it } from "vitest";

import {
  HYBRID_WORLD_SEED,
  MAX_EVENTS,
  MAX_QUESTS,
  MAX_ROOMS_ON_BOARD,
  MAX_SOCIAL_SIGNALS,
  MAX_VISIBLE_PLAYERS,
  SeededWorldRandom,
  applyDemoScenario,
  applyWorldSyncPacket,
  createHybridWorldDataset,
  createWorldSyncPacket,
  discoverWorld,
  formatEventBoard,
  formatRoomDiscoveryBoard,
  formatRoomHud,
  formatScoreboardText,
  parseWorldFeed,
  parseWorldSyncPacket,
  projectWorldToMobile2D,
  resolveDecentralandWorldUrl,
  isDecentralandWorldUrl,
  createEmptyHybridWorldDataset,
  scaleMapX,
  scaleMapY,
  serializeWorldFeed,
  simulationFromDataset,
  tickHybridSimulation,
} from "../lib/hybrid-world";
import { createHybridWorldDataset as createSceneHybridWorldDataset } from "../scene/src/hybrid/generator";

describe("SeededWorldRandom", () => {
  it("replays the same stream for the hybrid seed", () => {
    const first = new SeededWorldRandom(HYBRID_WORLD_SEED);
    const second = new SeededWorldRandom(HYBRID_WORLD_SEED);
    expect([first.int(0, 20), first.next()]).toEqual([second.int(0, 20), second.next()]);
  });
});

describe("createHybridWorldDataset", () => {
  it("builds a recognizable synthetic universe from the shared seed", () => {
    const dataset = createHybridWorldDataset();
    expect(dataset.mode).toBe("demo");
    expect(dataset.origin.origin).toBe("demo");
    expect(dataset.players[0]?.displayName).toBe("NovaWisp");
    expect(dataset.rooms[0]).toMatchObject({
      title: "Friday Night Pull",
      code: "731XZ",
      featured: true,
      phase: "active",
      sunScore: 428,
      moonScore: 381,
    });
    expect(dataset.events.map((event) => event.title)).toEqual(
      expect.arrayContaining(["Friendzone Friday", "Sun vs Moon Cup", "Crew Clash"]),
    );
  });

  it("stays within the 3D entity budgets", () => {
    const dataset = createHybridWorldDataset();
    expect(dataset.players.length).toBeLessThanOrEqual(MAX_VISIBLE_PLAYERS);
    expect(dataset.rooms.length).toBeLessThanOrEqual(MAX_ROOMS_ON_BOARD);
    expect(dataset.events.length).toBeLessThanOrEqual(MAX_EVENTS);
    expect(dataset.missions.length).toBeLessThanOrEqual(MAX_QUESTS);
    expect(dataset.socialSignals.length).toBeLessThanOrEqual(MAX_SOCIAL_SIGNALS);
  });

  it("matches the World-side generator for player names and room codes", () => {
    const mobile = createHybridWorldDataset(HYBRID_WORLD_SEED);
    const world = createSceneHybridWorldDataset(HYBRID_WORLD_SEED);
    expect(world.players.map((player) => player.displayName)).toEqual(mobile.players.map((player) => player.displayName));
    expect(world.rooms.map((room) => `${room.code}:${room.title}`)).toEqual(
      mobile.rooms.map((room) => `${room.code}:${room.title}`),
    );
  });
});

describe("mobile projection and discovery", () => {
  it("projects a compact 2D companion view without requiring a World connection", () => {
    const projection = projectWorldToMobile2D(createHybridWorldDataset());
    expect(projection.heroRoom?.code).toBe("731XZ");
    expect(projection.nearbyPlayers.length).toBeGreaterThan(0);
    expect(projection.nearbyPlayers.every((player) => player.presence !== "offline")).toBe(true);
    expect(projection.upcomingEvents.length).toBeGreaterThan(0);
    expect(projection.mode).toBe("demo");
  });

  it("recommends the featured public room", () => {
    const discovery = discoverWorld(createHybridWorldDataset(), "sun");
    expect(discovery.recommendedRoom?.featured).toBe(true);
    expect(discovery.reason).toContain("active");
    expect(discovery.nearbyPlayers.length).toBeGreaterThan(0);
  });
});

describe("protocol and simulation", () => {
  it("round-trips a world feed envelope", () => {
    const dataset = createHybridWorldDataset();
    const parsed = parseWorldFeed(serializeWorldFeed(dataset, "mobile-2d"));
    expect(parsed?.protocolVersion).toBe(1);
    expect(parsed?.source).toBe("mobile-2d");
    expect(parsed?.dataset.rooms[0]?.code).toBe("731XZ");
    expect(parseWorldFeed("not-json")).toBeNull();
    expect(parseWorldFeed("")).toBeNull();
    expect(parseWorldFeed(JSON.stringify({ protocolVersion: 99, source: "mobile-2d", dataset }))).toBeNull();
    expect(parseWorldFeed(JSON.stringify({ protocolVersion: 1, source: "mobile-2d" }))).toBeNull();
  });

  it("rejects malformed sync packets and sanitizes rope/score values", () => {
    const dataset = createHybridWorldDataset();
    const state = simulationFromDataset(dataset);
    expect(parseWorldSyncPacket("{")).toBeNull();
    expect(parseWorldSyncPacket({ protocolVersion: 1, roomId: "", source: "shared", phase: "active" })).toBeNull();
    expect(applyWorldSyncPacket(dataset, { ...createWorldSyncPacket(state), phase: "nope" as never })).toEqual(dataset);

    const sanitized = parseWorldSyncPacket({
      protocolVersion: 1,
      source: "world-3d",
      roomId: state.roomId,
      phase: "active",
      ropePosition: 4,
      sunScore: -12,
      moonScore: Number.NaN,
      highlightedPlayerId: "player_0",
    });
    expect(sanitized?.ropePosition).toBe(1);
    expect(sanitized?.sunScore).toBe(0);
    expect(sanitized?.moonScore).toBe(0);
  });

  it("applies a tiny sync packet onto room and scoreboard state", () => {
    const dataset = createHybridWorldDataset();
    const state = simulationFromDataset(dataset);
    const packet = createWorldSyncPacket({ ...state, sunScore: 500, moonScore: 410, ropePosition: 0.4 }, "world-3d");
    const next = applyWorldSyncPacket(dataset, packet);
    expect(next.scoreboard.sunScore).toBe(500);
    expect(next.rooms.find((room) => room.id === packet.roomId)?.ropePosition).toBe(0.4);
  });

  it("drifts the rope deterministically while the match is active", () => {
    const dataset = createHybridWorldDataset();
    const started = simulationFromDataset(dataset);
    const first = tickHybridSimulation(started, dataset, 1);
    const second = tickHybridSimulation(started, dataset, 1);
    expect(first).toEqual(second);
    expect(first.elapsedSeconds).toBe(1);
    expect(first.ropePosition).not.toBe(started.ropePosition);
    expect(tickHybridSimulation(started, dataset, Number.NaN)).toEqual(started);
  });
});

describe("scenarios, map, and boards", () => {
  it("keeps offline companion data populated", () => {
    const offline = applyDemoScenario(createHybridWorldDataset(), "offline-companion");
    const projection = projectWorldToMobile2D(offline);
    expect(offline.players.length).toBeGreaterThan(0);
    expect(projection.heroRoom).not.toBeNull();
    expect(projection.missions.length).toBeGreaterThan(0);
  });

  it("projects 3D spawn onto the 2D mini-map", () => {
    expect(scaleMapX(0)).toBe(7);
    expect(scaleMapX(32)).toBe(93);
    expect(scaleMapY(16)).toBeGreaterThan(8);
    expect(scaleMapY(16)).toBeLessThan(92);
  });

  it("formats the same room and event copy used in the 3D boards", () => {
    const dataset = createHybridWorldDataset();
    expect(formatRoomHud(dataset.rooms[0]!)).toContain("731XZ");
    expect(formatRoomDiscoveryBoard(dataset.rooms)).toContain("ROOM DISCOVERY");
    expect(formatEventBoard(dataset.events)).toContain("Friendzone Friday");
    expect(formatScoreboardText(dataset.scoreboard)).toContain("SUN CREW");
  });

  it("falls back to the public plaza URL when no World URL is set", () => {
    expect(resolveDecentralandWorldUrl("")).toContain("play.decentraland.org");
    expect(resolveDecentralandWorldUrl("https://worlds.example/tug")).toBe("https://worlds.example/tug");
    expect(isDecentralandWorldUrl("javascript:alert(1)")).toBe(false);
    expect(resolveDecentralandWorldUrl("javascript:alert(1)")).toContain("play.decentraland.org");
    expect(createEmptyHybridWorldDataset().rooms).toEqual([]);
  });
});
