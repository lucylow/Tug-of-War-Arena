export type MockEventHandler = (...args: unknown[]) => void;

/** Lightweight emitter so mock chain events work without Node's `events` module. */
export class MockEventEmitter {
  private listeners = new Map<string, Set<MockEventHandler>>();

  on(eventName: string, callback: MockEventHandler): void {
    const bucket = this.listeners.get(eventName) ?? new Set<MockEventHandler>();
    bucket.add(callback);
    this.listeners.set(eventName, bucket);
  }

  off(eventName: string, callback: MockEventHandler): void {
    this.listeners.get(eventName)?.delete(callback);
  }

  emit(eventName: string, ...args: unknown[]): void {
    const bucket = this.listeners.get(eventName);
    if (!bucket) return;
    for (const callback of bucket) {
      callback(...args);
    }
  }
}
