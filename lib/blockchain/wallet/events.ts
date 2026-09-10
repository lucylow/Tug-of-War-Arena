type Handler = (...args: unknown[]) => void;

export class WalletEventBus {
  private readonly listeners = new Map<string, Set<Handler>>();

  on<T extends unknown[]>(event: string, handler: (...args: T) => void): () => void {
    const wrapped: Handler = (...args) => {
      handler(...(args as T));
    };
    const bucket = this.listeners.get(event) ?? new Set<Handler>();
    bucket.add(wrapped);
    this.listeners.set(event, bucket);
    return () => {
      bucket.delete(wrapped);
    };
  }

  emit<T extends unknown[]>(event: string, ...args: T): void {
    const bucket = this.listeners.get(event);
    if (!bucket) return;
    for (const handler of bucket) {
      try {
        handler(...args);
      } catch {
        // Listener failures must not break wallet state.
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
