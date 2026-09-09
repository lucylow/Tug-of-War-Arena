import { useCallback } from "react";
import { withDelay, withSequence, withSpring, withTiming, type SharedValue, useSharedValue } from "react-native-reanimated";

import { DEFAULT_TIMING_MS, normalizeAnimationStep, type AnimationStep } from "@/lib/animations";

export function useAnimationSequence(initialValue = 0): {
  value: SharedValue<number>;
  createSequence: (steps: AnimationStep[]) => SharedValue<number>;
} {
  const value = useSharedValue(initialValue);

  const createSequence = useCallback(
    (steps: AnimationStep[]) => {
      if (!Array.isArray(steps) || steps.length === 0) return value;
      const animations = steps.map((step) => {
        const normalized = normalizeAnimationStep(step);
        switch (normalized.type) {
          case "spring":
            return withSpring(normalized.toValue, {
              damping: normalized.damping,
              stiffness: normalized.stiffness,
            });
          case "delay":
            return withDelay(normalized.duration, withTiming(value.value, { duration: 1 }));
          default:
            return withTiming(normalized.toValue, { duration: normalized.duration || DEFAULT_TIMING_MS });
        }
      });
      value.value = withSequence(...animations);
      return value;
    },
    [value],
  );

  return { value, createSequence };
}
