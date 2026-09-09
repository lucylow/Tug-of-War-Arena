import { useMemo, type DependencyList } from "react";

export function useMemoizedAnimation<T>(factory: () => T, deps: DependencyList): T {
  // Callers own `deps`; the factory is intentionally omitted from the list.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
