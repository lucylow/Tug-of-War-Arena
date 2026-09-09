export type MultiplayerHandler = (...args: unknown[]) => void;

/** React Native-safe emitter; avoids Node's `events` module. */
export class MultiplayerEmitter {
  private listeners = new Map<string, Set<MultiplayerHandler>>();

  on(eventName: string, callback: MultiplayerHandler): this {
    const bucket = this.listeners.get(eventName) ?? new Set<MultiplayerHandler>();
    bucket.add(callback);
    this.listeners.set(eventName, bucket);
    return this;
  }

  off(eventName: string, callback: MultiplayerHandler): this {
    this.listeners.get(eventName)?.delete(callback);
    return this;
  }

  once(eventName: string, callback: MultiplayerHandler): this {
    const wrapped: MultiplayerHandler = (...args) => {
      this.off(eventName, wrapped);
      callback(...args);
    };
    return this.on(eventName, wrapped);
  }

  emit(eventName: string, ...args: unknown[]): boolean {
    const bucket = this.listeners.get(eventName);
    if (!bucket || bucket.size === 0) return false;
    for (const callback of [...bucket]) {
      callback(...args);
    }
    return true;
  }

  removeAllListeners(eventName?: string): this {
    if (eventName) this.listeners.delete(eventName);
    else this.listeners.clear();
    return this;
  }

  listenerCount(eventName: string): number {
    return this.listeners.get(eventName)?.size ?? 0;
  }
}
