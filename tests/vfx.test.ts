import { afterEach, describe, expect, it } from "vitest";

import { QUALITY_PRESETS, QualityManager } from "../scene/src/performance/QualityManager";
import { configurePerformanceHost } from "../scene/src/performance/platform";
import {
  CONFETTI_COUNT,
  DUST_COUNT,
  FIREFLY_COUNT,
  RAIN_COUNT,
  SPARK_COUNT,
  applyQualityToCount,
  comboDuration,
  confettiPieceCount,
  firefliesEnabled,
  maintainRate,
  mapQualityLevel,
  mobileSizeBoost,
  particleBudgetFor,
  powerSurgeDuration,
  powerSurgeMaxScale,
  rainCount,
  scaleCount,
} from "../scene/src/vfx/budgets";
import {
  comboAlpha,
  currentCombo,
  getComboPopup,
  registerComboTap,
  resetCombo,
  showComboPopup,
  tickComboPopup,
} from "../scene/src/vfx/comboState";
import {
  createDustField,
  fireflyChase,
  glowFrame,
  rainResetY,
  stepConfetti,
  stepDustField,
  stepSimParticle,
  stepSparkScale,
} from "../scene/src/vfx/simulation";
import { VFXOptimizer } from "../scene/src/vfx/VFXOptimizer";

afterEach(() => {
  resetCombo();
  VFXOptimizer.resetInstance();
  QualityManager.resetInstance();
  configurePerformanceHost({ mobile: true });
});

describe("VFX budgets", () => {
  it("halves ambient counts on mobile and keeps fireflies off", () => {
    expect(scaleCount(DUST_COUNT.desktop, DUST_COUNT.mobile, true)).toBe(30);
    expect(scaleCount(FIREFLY_COUNT.desktop, FIREFLY_COUNT.mobile, true)).toBe(8);
    expect(scaleCount(SPARK_COUNT.desktop, SPARK_COUNT.mobile, true)).toBe(15);
    expect(confettiPieceCount(60, true)).toBeLessThanOrEqual(CONFETTI_COUNT.mobile);
    expect(confettiPieceCount(60, true)).toBe(Math.floor(60 * 0.4));
    expect(rainCount(true, "high")).toBe(RAIN_COUNT.mobile);
    expect(firefliesEnabled("high", true)).toBe(false);
    expect(firefliesEnabled("high", false)).toBe(true);
    expect(firefliesEnabled("low", false)).toBe(false);
  });

  it("maps quality presets onto the VFX ladder", () => {
    expect(mapQualityLevel("ultra")).toBe("high");
    expect(mapQualityLevel("medium")).toBe("medium");
    expect(mapQualityLevel("minimal")).toBe("low");
    expect(particleBudgetFor("medium", true)).toBe(30);
    expect(particleBudgetFor("high", false)).toBe(200);
    expect(applyQualityToCount(100, "low")).toBe(30);
    expect(mobileSizeBoost(0.1, true)).toBeCloseTo(0.12);
    expect(powerSurgeDuration(true)).toBe(0.6);
    expect(powerSurgeMaxScale(false)).toBe(3);
    expect(comboDuration(true)).toBe(1.2);
    expect(maintainRate(80, 10)).toBe(8);
  });
});

describe("DustParticles simulation", () => {
  it("runs a full dust field well under a 60fps frame", () => {
    const dust = createDustField(80);
    stepDustField(dust, 0.016);

    const samples: number[] = [];
    for (let i = 0; i < 8; i += 1) {
      const start = performance.now();
      stepDustField(dust, 0.016);
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)] ?? Number.POSITIVE_INFINITY;

    expect(median).toBeLessThan(8);
    expect(dust.every((particle) => particle.active)).toBe(true);
  });

  it("recycles motes that expire and keeps them inside the plaza", () => {
    const dust = createDustField(1, 18);
    const mote = dust[0]!;
    mote.life = mote.maxLife - 0.001;
    stepDustField(dust, 0.02);
    expect(mote.active).toBe(true);
    expect(mote.life).toBeLessThan(mote.maxLife);
  });
});

describe("effect motion helpers", () => {
  it("applies gravity and retires spent particles", () => {
    const particle = {
      position: { x: 0, y: 2, z: 0 },
      velocity: { x: 1, y: 0, z: 0 },
      life: 0,
      maxLife: 0.05,
      size: 0.1,
      active: true,
    };
    stepSimParticle(particle, 0.1, 0.5);
    expect(particle.active).toBe(false);
    expect(particle.position.x).toBeCloseTo(0.1);
  });

  it("shrinks sparks, expands the power-surge ring, then finishes", () => {
    expect(stepSparkScale(0.06)).toBeCloseTo(0.0588);
    const mid = glowFrame(0.4, 0.8, 3);
    expect(mid.done).toBe(false);
    expect(mid.scale).toBeGreaterThan(0.1);
    expect(glowFrame(0.8, 0.8, 3).done).toBe(true);
  });

  it("bounces confetti on the floor and wraps rain drops", () => {
    const piece = {
      position: { x: 0, y: -0.1, z: 0 },
      velocity: { x: 0, y: -1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      spin: { x: 10, y: 0, z: 0 },
      life: 0,
      maxLife: 2,
      size: 0.04,
      active: true,
    };
    stepConfetti(piece, 0.016);
    expect(piece.position.y).toBe(0);
    expect(piece.velocity.y).toBeGreaterThan(0);
    const wrapped = rainResetY(0.01, 10, 0.016);
    expect(wrapped.wrapped).toBe(true);
    expect(wrapped.y).toBeGreaterThan(5);
  });

  it("eases fireflies toward a drifting target", () => {
    const next = fireflyChase({ x: 0, y: 1, z: 0 }, { x: 4, y: 2, z: -2 }, 0.1, 0);
    expect(next.x).toBeGreaterThan(0);
    expect(next.y).toBeGreaterThan(1);
  });
});

describe("combo popup", () => {
  it("stacks taps inside the window and resets after a gap", () => {
    expect(registerComboTap(0)).toBe(1);
    expect(registerComboTap(0.4)).toBe(2);
    expect(registerComboTap(0.7)).toBe(3);
    expect(registerComboTap(2)).toBe(1);
    expect(currentCombo()).toBe(1);
  });

  it("fades the HUD popup over the mobile duration", () => {
    showComboPopup(5, true);
    expect(getComboPopup().text).toBe("5x Combo!");
    expect(getComboPopup().duration).toBe(1.2);
    tickComboPopup(0.6);
    expect(comboAlpha()).toBeCloseTo(0.5);
    tickComboPopup(0.7);
    expect(getComboPopup().active).toBe(false);
  });
});

describe("VFXOptimizer", () => {
  it("applies quality multipliers and can mute every registered effect", () => {
    configurePerformanceHost({ mobile: false });
    QualityManager.resetInstance();
    VFXOptimizer.resetInstance();
    const optimizer = VFXOptimizer.getInstance();
    let active = true;
    let count = 80;
    optimizer.registerEffect({
      name: "dust",
      maxParticles: 80,
      setActive: (next) => {
        active = next;
      },
      setParticleCount: (next) => {
        count = next;
      },
    });

    optimizer.setQuality("low", false);
    expect(optimizer.getParticleBudget()).toBe(Math.floor(200 * 0.3));
    expect(count).toBeLessThan(80);

    optimizer.disableAll();
    expect(active).toBe(false);
    optimizer.enableAll();
    expect(active).toBe(true);
  });

  it("keeps fireflies disabled on mobile medium", () => {
    configurePerformanceHost({ mobile: true });
    QualityManager.resetInstance();
    VFXOptimizer.resetInstance();
    const optimizer = VFXOptimizer.getInstance();
    optimizer.setQuality("medium", true);
    expect(optimizer.firefliesAllowed()).toBe(false);
    expect(QUALITY_PRESETS.medium.particleCount).toBeGreaterThan(0);
  });
});
