import { useCallback } from "react";
import { InteractionManager } from "react-native";

export function useAfterInteractions() {
  return useCallback((task: () => void) => {
    const handle = InteractionManager.runAfterInteractions(task);
    return { cancel: () => handle.cancel() };
  }, []);
}
