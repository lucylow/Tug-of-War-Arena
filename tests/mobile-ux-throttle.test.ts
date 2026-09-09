import { describe, expect, it } from "vitest";

import {
  HAPTIC_MAX_PER_WINDOW,
  HAPTIC_MIN_INTERVAL_MS,
  PULL_MIN_INTERVAL_MS,
  REACTION_MIN_INTERVAL_MS,
  applyThrottledPull,
  applyThrottledReaction,
  applyThrottledSurge,
  canAcceptAt,
  createHapticBudget,
  createMobileMatchState,
  createPullGate,
  createReactionGate,
  remainingCooldown,
  shouldPlayHaptic,
  tickOpponent,
} from "../lib/mobile-ux";

describe("pull and reaction rate limits", () => {
  it("accepts the first pull and rejects a burst inside the interval", () => {
    const gate = createPullGate(() => 1_000);
    expect(gate.tryConsume(1_000)).toBe(true);
    expect(gate.tryConsume(1_000 + PULL_MIN_INTERVAL_MS - 1)).toBe(false);
    expect(gate.tryConsume(1_000 + PULL_MIN_INTERVAL_MS)).toBe(true);
  });

  it("keeps reactions slower than pulls", () => {
    expect(REACTION_MIN_INTERVAL_MS).toBeGreaterThan(PULL_MIN_INTERVAL_MS);
    const reaction = createReactionGate();
    expect(reaction.tryConsume(0)).toBe(true);
    expect(reaction.tryConsume(REACTION_MIN_INTERVAL_MS - 1)).toBe(false);
    expect(remainingCooldown(0, REACTION_MIN_INTERVAL_MS, 40)).toBe(REACTION_MIN_INTERVAL_MS - 40);
    expect(canAcceptAt(0, PULL_MIN_INTERVAL_MS, PULL_MIN_INTERVAL_MS)).toBe(true);
  });

  it("applies Friendzone pull rules only when the gate opens", () => {
    let state = createMobileMatchState("sun");
    const first = applyThrottledPull(state, 0);
    expect(first.accepted).toBe(true);
    expect(first.state.taps).toBe(1);
    expect(first.state.pull).toBeGreaterThan(0);
    const burst = applyThrottledPull(first.state, 10);
    expect(burst.accepted).toBe(false);
    expect(burst.state.taps).toBe(1);
    const next = applyThrottledPull(first.state, PULL_MIN_INTERVAL_MS);
    expect(next.accepted).toBe(true);
    expect(next.state.taps).toBe(2);
  });

  it("rate-limits reactions and surges without replacing scoring", () => {
    let state = createMobileMatchState("moon");
    for (let i = 0; i < 7; i += 1) {
      state = applyThrottledPull(state, i * PULL_MIN_INTERVAL_MS).state;
    }
    expect(state.surgeReady).toBe(true);
    const earlySurge = applyThrottledSurge(state, state.lastPullAt);
    expect(earlySurge.accepted).toBe(true);
    expect(earlySurge.state.surgeReady).toBe(false);
    const blocked = applyThrottledSurge(earlySurge.state, earlySurge.state.lastSurgeAt + 10);
    expect(blocked.accepted).toBe(false);
    const react = applyThrottledReaction(state, 10_000);
    expect(react.accepted).toBe(true);
    expect(applyThrottledReaction(react.state, 10_010).accepted).toBe(false);
  });

  it("still applies opponent pressure on a tick", () => {
    const pulled = applyThrottledPull(createMobileMatchState("sun"), 0).state;
    const ticked = tickOpponent(pulled);
    expect(ticked.pull).toBeLessThan(pulled.pull);
    expect(ticked.timeRemaining).toBe(29);
  });
});

describe("haptic throttling", () => {
  it("drops impacts inside the minimum interval and above the per-second cap", () => {
    const played: string[] = [];
    const budget = createHapticBudget({
      clock: () => 0,
      play: (kind) => played.push(kind),
    });
    expect(budget.tryPlay("light", 0)).toBe(true);
    expect(budget.tryPlay("light", HAPTIC_MIN_INTERVAL_MS - 1)).toBe(false);
    expect(played).toEqual(["light"]);

    let now = 0;
    const capped = createHapticBudget({
      play: (kind) => played.push(kind),
    });
    for (let i = 0; i < HAPTIC_MAX_PER_WINDOW + 3; i += 1) {
      now += HAPTIC_MIN_INTERVAL_MS;
      capped.tryPlay("medium", now);
    }
    expect(capped.snapshot().accepted).toBe(HAPTIC_MAX_PER_WINDOW);
    expect(capped.snapshot().dropped).toBe(3);
  });

  it("disables haptics on web and when reduce-motion is on", () => {
    expect(shouldPlayHaptic("ios", false)).toBe(true);
    expect(shouldPlayHaptic("web", false)).toBe(false);
    expect(shouldPlayHaptic("ios", true)).toBe(false);
  });
});
