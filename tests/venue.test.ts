import { describe, expect, it } from "vitest";

import {
  VenueOptimizer,
  createBannerLayout,
  createColumnLayout,
  createDecorationPlan,
  createFloorTiles,
  createStandLayout,
  createVenueLights,
  estimateVenueBudget,
  formatPracticeDummyPresentation,
  formatVenueScoreboard,
  hitPracticeDummy,
  pickVenueModel,
  projectParticle,
  resolveVenueFeatures,
  resolveVenueLod,
  spawnParticles,
  stepParticle,
  stepParticles,
} from "../lib/venue";

describe("venue LOD and mobile optimization", () => {
  it("uses a low-detail layer set for compact previews", () => {
    expect(resolveVenueLod({ compact: true })).toBe("low");
    const features = resolveVenueFeatures({ compact: true });
    expect(features.columnCount).toBe(6);
    expect(features.fireflyCount).toBe(0);
    expect(features.showCheckerboard).toBe(false);
    expect(features.animateParticles).toBe(false);
    expect(features.animateFlags).toBe(false);
  });

  it("keeps native phones on a medium budget with no fireflies", () => {
    const features = resolveVenueFeatures({ mobile: true });
    expect(features.lod).toBe("medium");
    expect(features.dustCount).toBe(16);
    expect(features.showFireflies).toBe(false);
    expect(features.showTorchGlow).toBe(true);
    expect(features.showStatues).toBe(true);
  });

  it("unlocks the high-detail plaza on desktop without reduced motion", () => {
    const features = resolveVenueFeatures({});
    expect(features.lod).toBe("high");
    expect(features.columnCount).toBe(12);
    expect(features.fireflyCount).toBe(12);
    expect(features.showShadows).toBe(true);
  });

  it("disables motion systems when the client asks for reduced motion", () => {
    const features = resolveVenueFeatures({ reduceMotion: true, mobile: true });
    expect(features.lod).toBe("low");
    expect(features.animateFlags).toBe(false);
    expect(features.animateParticles).toBe(false);
  });

  it("stays inside the Decentraland mobile entity budget", () => {
    const high = estimateVenueBudget(resolveVenueFeatures({}));
    const mobile = estimateVenueBudget(resolveVenueFeatures({ mobile: true }));
    expect(high.withinMobileBudget).toBe(true);
    expect(mobile.withinMobileBudget).toBe(true);
    expect(high.entities).toBeLessThan(4800);
    expect(high.triangles).toBeLessThan(1_000_000);
    expect(mobile.entities).toBeLessThan(high.entities);
  });

  it("picks low-poly models on mobile and high-poly models on desktop", () => {
    expect(pickVenueModel({ mobile: true }, "assets/models/column.glb", "assets/models/column_low.glb")).toBe(
      "assets/models/column_low.glb",
    );
    expect(pickVenueModel({}, "assets/models/column.glb", "assets/models/column_low.glb")).toBe("assets/models/column.glb");
    const optimizer = new VenueOptimizer({ compact: true });
    expect(optimizer.getModel("assets/models/statue.glb", "assets/models/statue_low.glb")).toBe("assets/models/statue_low.glb");
    expect(optimizer.getBudget().entities).toBeGreaterThan(0);
  });
});

describe("venue layout", () => {
  it("places columns on a closed ellipse around the plaza", () => {
    const columns = createColumnLayout(12);
    expect(columns).toHaveLength(12);
    expect(columns[0]?.x).toBeCloseTo(180, 5);
    expect(columns[0]?.y).toBeLessThan(50);
    expect(new Set(columns.map((column) => `${column.x.toFixed(2)},${column.y.toFixed(2)}`)).size).toBe(12);
  });

  it("builds a decoration plan that respects LOD flags", () => {
    const low = createDecorationPlan(resolveVenueFeatures({ compact: true }));
    const high = createDecorationPlan(resolveVenueFeatures({}));
    expect(low.columns).toHaveLength(6);
    expect(low.statues).toHaveLength(0);
    expect(low.tiles).toHaveLength(0);
    expect(low.torches).toHaveLength(4);
    expect(low.banners).toHaveLength(4);
    expect(high.columns).toHaveLength(12);
    expect(high.statues).toHaveLength(4);
    expect(high.tiles.length).toBeGreaterThan(0);
    expect(high.stands).toHaveLength(3);
  });

  it("keeps banners and stands aligned to crew sides", () => {
    const banners = createBannerLayout();
    expect(banners.filter((banner) => banner.team === "red")).toHaveLength(2);
    expect(banners.filter((banner) => banner.team === "blue")).toHaveLength(2);
    expect(createStandLayout(1)).toEqual([{ x: 180, y: 16, side: "back" }]);
    expect(createStandLayout(3).map((stand) => stand.side)).toEqual(["back", "left", "right"]);
    expect(createFloorTiles(false)).toEqual([]);
  });
});

describe("venue lighting", () => {
  it("always includes sun, ambient, and rope spot lights", () => {
    const lights = createVenueLights(resolveVenueFeatures({ compact: true }));
    expect(lights.map((light) => light.id)).toEqual(["sun", "ambient", "spot"]);
    expect(lights.some((light) => light.type === "torch")).toBe(false);
  });

  it("adds torch glows only when the LOD allows them", () => {
    const lights = createVenueLights(resolveVenueFeatures({}));
    expect(lights.filter((light) => light.type === "torch")).toHaveLength(4);
    expect(lights.find((light) => light.id === "sun")?.shadow).toBe(true);
  });
});

describe("ambient particles", () => {
  it("replays the same spawn stream for a given seed", () => {
    const first = spawnParticles(8, "dust", 42);
    const second = spawnParticles(8, "dust", 42);
    expect(first).toEqual(second);
    expect(first).toHaveLength(8);
    expect(spawnParticles(0, "firefly", 1)).toEqual([]);
  });

  it("keeps stepped and projected particles inside the arena bounds", () => {
    const dust = spawnParticles(12, "dust", 7);
    const fireflies = spawnParticles(6, "firefly", 11);
    const stepped = stepParticles(dust, 0.5, 8);
    const projected = fireflies.map((particle) => projectParticle(particle, 12));

    for (const particle of [...stepped, ...projected]) {
      expect(particle.x).toBeGreaterThanOrEqual(18);
      expect(particle.x).toBeLessThanOrEqual(342);
      expect(particle.y).toBeGreaterThanOrEqual(14);
      expect(particle.y).toBeLessThanOrEqual(154);
    }

    const moved = stepParticle(dust[0]!, 0.16, 3);
    expect(moved.id).toBe(dust[0]?.id);
  });
});

describe("interactive venue props", () => {
  it("counts dummy hits and brightens the glow", () => {
    expect(hitPracticeDummy(0)).toEqual({ hits: 1, glow: 0.35 });
    expect(hitPracticeDummy(4).hits).toBe(5);
    expect(hitPracticeDummy(20).glow).toBe(1);
    expect(formatPracticeDummyPresentation(0).meta).toBe("Tap to warm up");
    expect(formatPracticeDummyPresentation(1).meta).toContain("1 hit");
    expect(formatPracticeDummyPresentation(3).hoverText).toBe("Hit me!");
  });

  it("clamps scoreboard values and labels both crews", () => {
    expect(formatVenueScoreboard({ crewLabel: "Sun Crew", opponentLabel: "Moon Crew", crewScore: 62.4, opponentScore: 37.6 })).toEqual({
      title: "ARENA",
      crewText: "62",
      opponentText: "38",
      accessibilityLabel: "Sun Crew 62, Moon Crew 38",
    });
    expect(formatVenueScoreboard({ crewLabel: "  ", opponentLabel: "", crewScore: 140, opponentScore: -8 }).accessibilityLabel).toBe(
      "Crew 100, Opponent 0",
    );
  });
});
