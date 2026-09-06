import { describe, expect, it } from "vitest";

import { createPersistenceGateState, shouldWritePersistedState } from "../lib/persistence-gates";

describe("persistence gates", () => {
  it("suppresses the first write for each key and allows later writes", () => {
    const state = createPersistenceGateState();

    expect(shouldWritePersistedState(state, "rsvp-event")).toBe(false);
    expect(shouldWritePersistedState(state, "rsvp-event")).toBe(true);
  });

  it("models hydration followed by a user change", () => {
    const state = createPersistenceGateState();

    const hydrationObservation = shouldWritePersistedState(state, "party-code");
    const userChangeObservation = shouldWritePersistedState(state, "party-code");

    expect(hydrationObservation).toBe(false);
    expect(userChangeObservation).toBe(true);
  });

  it("starts a fresh lifecycle with a new gate state", () => {
    const previous = createPersistenceGateState();
    shouldWritePersistedState(previous, "history");
    expect(shouldWritePersistedState(previous, "history")).toBe(true);

    const remounted = createPersistenceGateState();
    expect(shouldWritePersistedState(remounted, "history")).toBe(false);
  });

  it("ignores blank keys without mutating gate state", () => {
    const state = createPersistenceGateState();

    expect(shouldWritePersistedState(state, "")).toBe(false);
    expect(shouldWritePersistedState(state, "   ")).toBe(false);
    expect(state).toEqual({});
  });

  it("tracks keys independently", () => {
    const state = createPersistenceGateState();

    expect(shouldWritePersistedState(state, "waitlisted")).toBe(false);
    expect(shouldWritePersistedState(state, "wearable-equipped")).toBe(false);
    expect(shouldWritePersistedState(state, "waitlisted")).toBe(true);
    expect(shouldWritePersistedState(state, "wearable-equipped")).toBe(true);
  });
});
