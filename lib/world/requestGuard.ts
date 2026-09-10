export function createRequestGuard() {
  let latestRequestId = 0;

  return {
    next(): number {
      latestRequestId += 1;
      return latestRequestId;
    },
    isCurrent(requestId: number): boolean {
      return requestId === latestRequestId;
    },
    reset(): void {
      latestRequestId = 0;
    },
  };
}

export async function withAbort<T>(
  factory: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await factory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
