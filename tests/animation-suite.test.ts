import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ARENA_EMOTES,
  DEFAULT_DELAY_MS,
  DEFAULT_FX_COUNT,
  DEFAULT_TILT_AMOUNT,
  TOAST_DURATION_MS,
  WAVEFORM_MIN_HEIGHT,
  createFxParticles,
  createSparkles,
  emoteAt,
  FrameRateSampler,
  fxParticlePose,
  isToastType,
  listItemEnterDelay,
  matchResultCopy,
  normalizeAnimationStep,
  parallaxHeaderMetrics,
  particleOpacity,
  particleRadius,
  sequenceDuration,
  staggerDelay,
  stepFxParticle,
  throttleAnimation,
  tiltFromDelta,
  toastPalette,
  waveformBarTarget,
} from "../lib/animations";

afterEach(() => {
  vi.useRealTimers();
});

describe("animation sequencing", () => {
  it("staggers children by index and sums step durations", () => {
    expect(staggerDelay(0, 80)).toBe(0);
    expect(staggerDelay(3, 80)).toBe(240);
    expect(staggerDelay(-2, 80)).toBe(0);
    expect(sequenceDuration([])).toBe(0);
    expect(sequenceDuration([{ type: "delay", duration: 250 }, { type: "timing", duration: 300 }])).toBe(550);
    expect(normalizeAnimationStep({ type: "spring" }).damping).toBe(15);
    expect(normalizeAnimationStep({ type: "delay" }).duration).toBe(DEFAULT_DELAY_MS);
  });
});

describe("particle systems", () => {
  it("spawns a capped burst and fades particles out", () => {
    const particles = createFxParticles(12, 360, 640, undefined, 9);
    expect(particles).toHaveLength(12);
    const first = particles[0];
    expect(first).toBeDefined();
    if (!first) return;
    const start = fxParticlePose(first, 0);
    const end = fxParticlePose(first, 1);
    expect(start.opacity).toBe(1);
    expect(end.opacity).toBe(0);
    expect(end.y).toBeGreaterThan(start.y);
    expect(particleOpacity(first.maxLife, first.maxLife)).toBe(0);
    expect(particleRadius({ ...first, life: first.maxLife })).toBe(0);
  });

  it("steps particles until their life expires", () => {
    const [particle] = createFxParticles(1, 100, 100, ["#FF0000"], 2);
    expect(particle).toBeDefined();
    if (!particle) return;
    const next = stepFxParticle(particle, 0.2, () => 0.5);
    expect(next?.life).toBe(1);
    expect(next?.x).toBe(particle.x + particle.vx);
    const dead = stepFxParticle({ ...particle, life: particle.maxLife }, 0.2, () => 0.5);
    expect(dead).toBeNull();
  });

  it("spawns sparkles around an origin", () => {
    const sparkles = createSparkles(8, 50, 80, "#FFD700", 4);
    expect(sparkles).toHaveLength(8);
    expect(sparkles[0]?.x).toBeGreaterThan(40);
    expect(sparkles[0]?.x).toBeLessThan(60);
    expect(createFxParticles(200, 10, 10)).toHaveLength(80);
    expect(DEFAULT_FX_COUNT).toBe(48);
  });
});

describe("toasts, emotes, and match copy", () => {
  it("maps toast types onto palettes", () => {
    expect(isToastType("success")).toBe(true);
    expect(isToastType("nope")).toBe(false);
    expect(toastPalette("error").bg).toBe("#FF6B6B");
    expect(toastPalette("info").bg).toBe("#4DE7F2");
    expect(TOAST_DURATION_MS).toBe(3000);
  });

  it("wraps emote indexes and writes victory copy", () => {
    expect(emoteAt(0)).toBe("👋");
    expect(emoteAt(ARENA_EMOTES.length)).toBe("👋");
    expect(emoteAt(-1)).toBe("👾");
    expect(matchResultCopy(true).title).toBe("Victory!");
    expect(matchResultCopy(false).title).toBe("Defeat!");
  });
});

describe("parallax, tilt, lists, and waveform", () => {
  it("collapses a parallax header as scroll increases", () => {
    const rest = parallaxHeaderMetrics(0, 200, 60);
    const scrolled = parallaxHeaderMetrics(80, 200, 60);
    expect(rest.height).toBe(200);
    expect(scrolled.height).toBe(120);
    expect(scrolled.scale).toBeGreaterThan(rest.scale);
  });

  it("tilts a card from gesture deltas and clamps the amount", () => {
    const tilt = tiltFromDelta(150, -80, 300, 200, DEFAULT_TILT_AMOUNT);
    expect(tilt.rotateY).toBeGreaterThan(0);
    expect(tilt.rotateX).toBeGreaterThan(0);
    expect(Math.abs(tilt.rotateX)).toBeLessThanOrEqual(DEFAULT_TILT_AMOUNT);
    expect(listItemEnterDelay(4, 50)).toBe(200);
  });

  it("builds waveform bar targets", () => {
    const idle = waveformBarTarget(0, false);
    const live = waveformBarTarget(3, true);
    expect(idle.to).toBe(WAVEFORM_MIN_HEIGHT);
    expect(live.to).toBeGreaterThan(WAVEFORM_MIN_HEIGHT);
    expect(live.delay).toBe(270);
  });
});

describe("performance toolkit", () => {
  it("throttles animation callbacks to the frame budget", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const calls: number[] = [];
    const throttled = throttleAnimation((value: number) => {
      calls.push(value);
    }, 16);
    throttled(1);
    throttled(2);
    expect(calls).toEqual([1]);
    vi.setSystemTime(20);
    vi.advanceTimersByTime(20);
    expect(calls).toEqual([1, 2]);
  });

  it("samples FPS once per second", () => {
    const sampler = new FrameRateSampler(0);
    expect(sampler.tick(16)).toBeNull();
    expect(sampler.tick(500)).toBeNull();
    expect(sampler.tick(1000)).toBe(3);
    expect(sampler.getLastFps()).toBe(3);
  });
});
