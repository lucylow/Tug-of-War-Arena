export type PersistenceGateState = Record<string, boolean>;

/**
 * Returns whether a state change should be written. The first observation for
 * each key is reserved for hydration; later observations are safe to persist.
 */
export function shouldWritePersistedState(state: PersistenceGateState, key: string): boolean {
  if (!key.trim()) return false;
  if (state[key]) return true;
  state[key] = true;
  return false;
}

export function createPersistenceGateState(): PersistenceGateState {
  return {};
}
