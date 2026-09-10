import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { ARENA_CENTER } from "../scene/src/logic/mapping";
import {
  GRAPHICS_BUILD_ORDER,
  GRAPHICS_CLOUD_COUNT,
  GRAPHICS_CONFETTI_COUNT,
  GRAPHICS_PILLAR_COUNT,
  GRAPHICS_PORTAL_COUNT,
  GRAPHICS_STAR_COUNT,
  collectGraphicsAnchors,
  getCenterpieceOrb,
  getCloudSpecs,
  getConfettiSpecs,
  getDecorativeTileSpecs,
  getHeroEmblemSpecs,
  getHeroSignBackplate,
  getPillarSpecs,
  getPortalFrameSpecs,
  getSkyPanelSpecs,
  getStarSpecs,
  getTeamBadgeSpecs,
  isPlayableArenaCell,
} from "../scene/src/logic/graphicsLayout";
import {
  GRAPHICS_FLOAT_AMPLITUDE_MAX,
  GRAPHICS_PULSE_AMOUNT_MAX,
  graphicFloatOffset,
  graphicPulseScale,
} from "../scene/src/logic/graphicsMotion";
import {
  getCrewBasePosition,
  getEntrancePosition,
  getGovernancePlazaPosition,
  getPullPadPosition,
  isInsideParcel,
} from "../scene/src/logic/journey";

const GRAPHICS_ROOT = resolve("scene/src/graphics");

function listTsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listTsFiles(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}

describe("world graphics layout", () => {
  it("keeps every authored anchor inside the 2x2 parcel", () => {
    const anchors = collectGraphicsAnchors();
    expect(anchors.length).toBeGreaterThan(40);
    for (const point of anchors) {
      expect(isInsideParcel(point)).toBe(true);
    }
  });

  it("places sky walls on the parcel rim and clouds above the walkable plaza", () => {
    const panels = getSkyPanelSpecs();
    expect(panels).toHaveLength(3);
    expect(panels[0]!.position.z).toBeGreaterThan(ARENA_CENTER.z + 12);
    expect(panels[1]!.position.x).toBeLessThan(2);
    expect(panels[2]!.position.x).toBeGreaterThan(30);
    expect(getCloudSpecs()).toHaveLength(GRAPHICS_CLOUD_COUNT * 2);
    expect(getCloudSpecs().every((cloud) => cloud.position.y >= 8)).toBe(true);
    expect(getStarSpecs()).toHaveLength(GRAPHICS_STAR_COUNT);
  });

  it("frames spawn first, then team sides, then the rope, without covering pads or the plaza", () => {
    const sign = getHeroSignBackplate().position;
    const entrance = getEntrancePosition();
    const pull = getPullPadPosition();
    const plaza = getGovernancePlazaPosition();
    const badges = getTeamBadgeSpecs();
    const portals = getPortalFrameSpecs();
    const center = getCenterpieceOrb().position;
    const emblem = getHeroEmblemSpecs().base.position;

    expect(sign.z).toBeLessThan(entrance.z);
    expect(emblem.z).toBeLessThan(ARENA_CENTER.z);
    expect(emblem.y).toBeGreaterThan(7.2);
    expect(center.x).toBe(ARENA_CENTER.x);
    expect(center.z).toBe(ARENA_CENTER.z);
    expect(center.y).toBeLessThan(4.4);
    expect(badges[0]!.crew).toBe("sun");
    expect(badges[0]!.plate.position.x).toBeLessThan(ARENA_CENTER.x);
    expect(badges[1]!.plate.position.x).toBeGreaterThan(ARENA_CENTER.x);
    expect(Math.abs(badges[0]!.plate.position.x - getCrewBasePosition("sun").x)).toBeLessThan(2);
    expect(portals).toHaveLength(GRAPHICS_PORTAL_COUNT);
    for (const portal of portals) {
      expect(portal.core.position.z).toBeGreaterThan(entrance.z);
      expect(portal.core.position.z).toBeLessThan(pull.z);
    }
    expect(getPillarSpecs()).toHaveLength(GRAPHICS_PILLAR_COUNT);
    for (const pillar of getPillarSpecs()) {
      expect(pillar.column.position.z).toBeLessThan(plaza.z);
    }
  });

  it("keeps decorative tiles and confetti off the rope corridor", () => {
    expect(isPlayableArenaCell(ARENA_CENTER.x, ARENA_CENTER.z)).toBe(true);
    expect(getDecorativeTileSpecs().every((tile) => !isPlayableArenaCell(tile.position.x, tile.position.z))).toBe(true);
    expect(getConfettiSpecs()).toHaveLength(GRAPHICS_CONFETTI_COUNT);
    expect(
      getConfettiSpecs().every(
        (piece) => !(Math.abs(piece.position.x - ARENA_CENTER.x) < 6 && Math.abs(piece.position.z - ARENA_CENTER.z) < 1.6),
      ),
    ).toBe(true);
  });
});

describe("world graphics motion", () => {
  it("pulses scale and floats height without leaving authored bounds", () => {
    const base = { x: 0.5, y: 0.5, z: 0.5 };
    const pulsed = graphicPulseScale(base, Math.PI / 2, 1, 2, 0);
    expect(pulsed.x).toBeCloseTo(0.5 * (1 + GRAPHICS_PULSE_AMOUNT_MAX));
    expect(pulsed.y).toBeLessThanOrEqual(0.5 * (1 + GRAPHICS_PULSE_AMOUNT_MAX));

    const origin = { x: 16, y: 4, z: 16 };
    const floated = graphicFloatOffset(origin, Math.PI / 2, 8, 1, 0);
    expect(floated.x).toBe(16);
    expect(floated.z).toBe(16);
    expect(floated.y).toBeCloseTo(4 + GRAPHICS_FLOAT_AMPLITUDE_MAX);
    expect(graphicFloatOffset(origin, 0, 0.2, 1, 0).y).toBe(4);
  });
});

describe("world graphics package", () => {
  it("composes the graphics layer before gameplay systems", () => {
    const world = readFileSync(resolve("scene/src/world.ts"), "utf8");
    const config = readFileSync(resolve("scene/src/config.ts"), "utf8");
    const assembly = world.slice(world.indexOf("export function assembleWorld"));
    expect(config).toContain("ENABLE_WORLD_GRAPHICS");
    expect(assembly).toContain("buildAdvancedWorldGraphics");
    expect(assembly.indexOf("buildAdvancedWorldGraphics")).toBeLessThan(assembly.indexOf("createEntrance"));
    expect(assembly.indexOf("createEntrance")).toBeLessThan(assembly.indexOf("createCrewBases"));
    expect(assembly.indexOf("createCrewBases")).toBeLessThan(assembly.indexOf("buildGovernanceExperience"));
    expect(GRAPHICS_BUILD_ORDER).toEqual([
      "sky",
      "stars",
      "stage",
      "pillars",
      "centerpiece",
      "signage",
      "badges",
      "portals",
      "emblem",
      "rails",
      "confetti",
      "tiles",
    ]);
  });

  it("keeps the graphics folder free of gameplay, mock data, and governance imports", () => {
    const files = listTsFiles(GRAPHICS_ROOT);
    expect(files.length).toBeGreaterThanOrEqual(18);
    expect(existsSync(join(GRAPHICS_ROOT, "worldGraphics.ts"))).toBe(true);
    expect(existsSync(join(GRAPHICS_ROOT, "scene", "skyDome.ts"))).toBe(true);
    expect(existsSync(join(GRAPHICS_ROOT, "arena", "stage.ts"))).toBe(true);
    expect(existsSync(join(GRAPHICS_ROOT, "social", "teamBadges.ts"))).toBe(true);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/governance/);
      expect(source).not.toMatch(/systems\/session/);
      expect(source).not.toMatch(/entities\/rope/);
      expect(source).not.toMatch(/hybrid/);
      expect(source).not.toMatch(/lib\/mock/);
    }
  });
});
