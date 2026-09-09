export function throttleAnimation<Args extends unknown[]>(
  fn: (...args: Args) => void,
  limit = 16,
): (...args: Args) => void {
  const interval = Number.isFinite(limit) && limit > 0 ? limit : 16;
  let lastCall = Number.NEGATIVE_INFINITY;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Args) => {
    const now = Date.now();
    const remaining = interval - (now - lastCall);
    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCall = now;
      fn(...args);
      return;
    }
    if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        fn(...args);
      }, remaining);
    }
  };
}
