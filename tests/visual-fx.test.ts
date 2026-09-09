import { describe, expect, it } from "vitest";

import {
  ambientVolume,
  advancedPropBudget,
  bannerSwayDegrees,
  createFireParticle,
  createPowerSurgeState,
  emissiveScrollProxy,
  fireParticleAlpha,
  glowPulseIntensity,
  godRayCount,
  isComboActive,
  lodTier,
  powerSurgeDone,
  scatterVegetation,
  scrollUvOffset,
  sfxVolume,
  skyboxEnabled,
  stepFireParticle,
  stepPowerSurge,
  torchFlicker,
  vegetationBudget,
  wrap01,
} from "../scene/src/logic/visualFx";
import { createGlowMaterial, createUvAnimation, stepUvAnimation, updateGlowIntensity } from "../scene/src/materials";
import { ARENA_CENTER } from "../scene/src/logic/mapping";

describe("glow and UV materials", () => {
  it("builds an emissive glow config and pulses inside the requested range", () => {
    const glow = createGlowMaterial({ r: 1, g: 0.2, b: 0.2, a: 1 }, 1.4);
    expect(glow.emissiveIntensity).toBe(1.4);
    expect(glow.emissiveColor).toEqual(glow.albedoColor);
    expect(glow.roughness).toBe(0.2);

    for (let t = 0; t < 8; t += 0.25) {
      const intensity = glowPulseIntensity(t, 0.5, 2);
      expect(intensity).toBeGreaterThanOrEqual(0.5);
      expect(intensity).toBeLessThanOrEqual(2);
      expect(updateGlowIntensity(t)).toBe(intensity);
    }
  });

  it("wraps UV offsets and exposes an emissive stand-in for SDK7", () => {
    expect(wrap01(1.25)).toBeCloseTo(0.25);
    const next = scrollUvOffset({ x: 0.95, y: 0.99 }, 1, { x: 0.1, y: 0.05 });
    expect(next.x).toBeCloseTo(0.05);
    expect(next.y).toBeCloseTo(0.04);

    let animation = createUvAnimation(0.2, 0.1);
    animation = stepUvAnimation(animation, 0.5);
    expect(animation.offset.x).toBeCloseTo(0.1);
    expect(emissiveScrollProxy(1)).toBeGreaterThan(0);
    expect(torchFlicker(0.3, 1)).toBeGreaterThan(0.7);
  });
});

describe("vegetation scatter and quality budgets", () => {
  it("keeps plants off the arena floor and is deterministic", () => {
    const first = scatterVegetation({
      grass: 8,
      rocks: 4,
      trees: 3,
      spread: 26,
      keepout: 11,
      seed: 42,
      center: ARENA_CENTER,
    });
    const second = scatterVegetation({
      grass: 8,
      rocks: 4,
      trees: 3,
      spread: 26,
      keepout: 11,
      seed: 42,
      center: ARENA_CENTER,
    });
    expect(first).toHaveLength(15);
    expect(second).toEqual(first);
    for (const plant of first) {
      const onFloor = Math.abs(plant.position.x - ARENA_CENTER.x) < 11 && Math.abs(plant.position.z - ARENA_CENTER.z) < 11;
      expect(onFloor).toBe(false);
    }
  });

  it("scales prop counts down on mobile quality bands", () => {
    expect(vegetationBudget("ultra").grass).toBeGreaterThan(vegetationBudget("medium").grass);
    expect(vegetationBudget("minimal")).toEqual({ grass: 0, rocks: 0, trees: 0 });
    expect(advancedPropBudget("low").torches).toBe(2);
    expect(advancedPropBudget("minimal").torches).toBe(0);
    expect(godRayCount("high")).toBe(2);
    expect(godRayCount("low")).toBe(0);
    expect(skyboxEnabled("high", true)).toBe(false);
    expect(skyboxEnabled("high", false)).toBe(true);
  });
});

describe("fire, surge, combo, and LOD", () => {
  it("recycles a fire particle at the origin after max life", () => {
    const origin = { x: 3, y: 1, z: 3 };
    const rand = () => 0.5;
    let particle = createFireParticle(origin, rand);
    particle = { ...particle, life: particle.maxLife - 0.01 };
    const stepped = stepFireParticle(particle, 0.05, rand);
    expect(stepped.life).toBeLessThan(particle.maxLife);
    expect(Math.abs(stepped.position.x - origin.x)).toBeLessThan(1);
    expect(fireParticleAlpha({ ...particle, life: 0 })).toBe(1);
    expect(fireParticleAlpha({ ...particle, life: particle.maxLife })).toBe(0);
  });

  it("expands a power-surge ring then reports done", () => {
    let surge = createPowerSurgeState("red");
    expect(surge.team).toBe("sun");
    surge = stepPowerSurge(surge, 0.5);
    expect(surge.scale).toBeGreaterThan(0.12);
    expect(surge.alpha).toBeLessThan(1);
    surge = stepPowerSurge(surge, 4);
    expect(powerSurgeDone(surge)).toBe(true);
  });

  it("detects combos, sways banners, and picks LOD by distance", () => {
    expect(isComboActive(60, 60)).toBe(true);
    expect(isComboActive(59, 90)).toBe(false);
    expect(Math.abs(bannerSwayDegrees(0))).toBe(0);
    expect(Math.abs(bannerSwayDegrees(Math.PI / 2, 1, 9))).toBeCloseTo(9);
    expect(lodTier(4)).toBe("high");
    expect(lodTier(12)).toBe("medium");
    expect(lodTier(22)).toBe("low");
    expect(ambientVolume(1)).toBeLessThanOrEqual(0.45);
    expect(sfxVolume("combo")).toBeGreaterThan(sfxVolume("pull"));
  });
});
