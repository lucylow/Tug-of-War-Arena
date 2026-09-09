import { describe, expect, it } from "vitest";

import { hasReachedWinningLine } from "../lib/game-rules";
import { ARENA_MATCH_DURATION_SECONDS, ARENA_WIN_THRESHOLD } from "../lib/web3/addresses";
import {
  ARENA_CENTER,
  MATCH_DURATION_SECONDS,
  MAX_SCENE_PARTICLES,
  PULL_MAX,
  WIN_THRESHOLD,
  clampPull,
  formatScore,
  formatTimer,
  getSpawnPosition,
  getWinZonePosition,
  hasVisualWin,
  mapPullToStretch,
  mapPullToTiltDegrees,
  mapPullToWorldX,
  normalizeTeam,
  powerBarWidth,
  remainingParticleBudget,
  ropeControlPoints,
  segmentTransform,
  weatherParticleBudget,
  winningCrew,
} from "../scene/src/logic/mapping";
import { applyVisualSnapshot, createDemoSnapshot, demoSinePull, stepDemoSnapshot } from "../scene/src/logic/snapshot";
import { packetFromSyncedMatch, visualInputFromPacket } from "../scene/src/logic/remote";

describe("Decentraland arena visual mapping", () => {
  it("keeps the 3D win line aligned with the mobile and contract threshold", () => {
    expect(WIN_THRESHOLD).toBe(ARENA_WIN_THRESHOLD);
    expect(MATCH_DURATION_SECONDS).toBe(ARENA_MATCH_DURATION_SECONDS);
    expect(hasVisualWin(WIN_THRESHOLD)).toBe(true);
    expect(hasReachedWinningLine(WIN_THRESHOLD)).toBe(true);
    expect(winningCrew(44)).toBe("sun");
    expect(winningCrew(-44)).toBe("moon");
    expect(winningCrew(0)).toBeNull();
  });

  it("maps mobile pull onto the plaza X axis and a readable tilt", () => {
    expect(mapPullToWorldX(0)).toBe(ARENA_CENTER.x);
    expect(mapPullToWorldX(PULL_MAX)).toBeGreaterThan(ARENA_CENTER.x);
    expect(mapPullToWorldX(-PULL_MAX)).toBeLessThan(ARENA_CENTER.x);
    expect(mapPullToTiltDegrees(PULL_MAX)).toBe(15);
    expect(mapPullToTiltDegrees(-PULL_MAX)).toBe(-15);
    expect(mapPullToStretch(0)).toBe(1);
    expect(mapPullToStretch(20)).toBeGreaterThan(1);
    expect(clampPull(90)).toBe(PULL_MAX);
  });

  it("places Sun west of center and Moon east, with stable win pads", () => {
    expect(normalizeTeam("red")).toBe("sun");
    expect(normalizeTeam("blue")).toBe("moon");
    const sun = getSpawnPosition("sun", 0);
    const moon = getSpawnPosition("moon", 0);
    expect(sun.x).toBeLessThan(ARENA_CENTER.x);
    expect(moon.x).toBeGreaterThan(ARENA_CENTER.x);
    expect(getWinZonePosition("sun").x).toBeLessThan(getWinZonePosition("moon").x);
  });

  it("builds a monotonic spline and segment length for the live rope", () => {
    const points = ropeControlPoints(12, 8, 0.5);
    expect(points).toHaveLength(9);
    for (let i = 1; i < points.length; i += 1) {
      expect(points[i]!.x).toBeGreaterThan(points[i - 1]!.x);
    }
    const laid = segmentTransform(points[0]!, points[1]!);
    expect(laid.length).toBeGreaterThan(0.2);
  });

  it("formats HUD values and caps particle budgets", () => {
    expect(formatTimer(30)).toBe("0:30");
    expect(formatTimer(90)).toBe("1:30");
    expect(formatScore(2, 1)).toBe("2 – 1");
    expect(powerBarWidth(0, 200)).toBe(4);
    expect(powerBarWidth(50, 200)).toBe(100);
    expect(powerBarWidth(200, 200)).toBe(200);
    expect(weatherParticleBudget("clear", 1)).toBe(0);
    expect(weatherParticleBudget("rain", 1)).toBeLessThanOrEqual(MAX_SCENE_PARTICLES);
    expect(remainingParticleBudget(180) + 180).toBe(MAX_SCENE_PARTICLES);
  });
});

describe("Decentraland arena demo snapshot", () => {
  it("accepts red/blue aliases and remote packets without dropping score", () => {
    const snapshot = createDemoSnapshot({
      players: [
        { id: "a", team: "red", index: 0 },
        { id: "b", team: "blue", index: 0 },
      ],
    });
    expect(snapshot.players[0]?.team).toBe("sun");
    expect(snapshot.players[1]?.team).toBe("moon");
    const next = applyVisualSnapshot(snapshot, { pull: 8, score: [1, 0], sunPower: 40 });
    expect(next.pull).toBe(8);
    expect(next.score).toEqual([1, 0]);
    expect(next.sunPower).toBe(40);
    const packet = packetFromSyncedMatch({
      ropePosition: 8,
      teamPower: [40, 12],
      matchTime: 18,
      scores: [1, 0],
      matchStatus: "playing",
    });
    const fromPacket = applyVisualSnapshot(snapshot, visualInputFromPacket(packet));
    expect(fromPacket.pull).toBe(8);
    expect(fromPacket.sunPower).toBe(40);
    expect(fromPacket.phase).toBe("live");
  });

  it("applies tap force and opponent pressure like the mobile loop", () => {
    const live = createDemoSnapshot({ pull: 0, timeRemaining: 10 });
    const afterTaps = stepDemoSnapshot(live, 0.1, 4);
    expect(afterTaps.pull).toBeGreaterThan(live.pull);
    const idle = stepDemoSnapshot(createDemoSnapshot({ pull: 10, timeRemaining: 10 }), 0.25, 0);
    expect(idle.pull).toBeLessThan(10);
  });

  it("ends the match at the win line or on timeout", () => {
    const won = stepDemoSnapshot(createDemoSnapshot({ pull: 43.5, timeRemaining: 5 }), 0.016, 2);
    expect(won.phase === "results" || won.pull >= 44).toBe(true);
    const timedOut = stepDemoSnapshot(createDemoSnapshot({ pull: -3, timeRemaining: 0.01 }), 0.05, 0);
    expect(timedOut.phase).toBe("results");
    expect(timedOut.winner).toBe("moon");
  });

  it("keeps the idle sine pull inside the legal rope range", () => {
    for (let t = 0; t < 20; t += 0.5) {
      expect(Math.abs(demoSinePull(t))).toBeLessThanOrEqual(PULL_MAX);
    }
  });
});
