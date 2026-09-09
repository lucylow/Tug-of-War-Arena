import { useMemo, type DependencyList } from "react";
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export function useMemoizedStyle<T extends NamedStyles>(factory: () => T, deps: DependencyList): T {
  // Callers own `deps`; the factory is intentionally omitted from the list.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory()), deps);
}

export function useMemoizedViewStyle(factory: () => ViewStyle, deps: DependencyList): ViewStyle {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
