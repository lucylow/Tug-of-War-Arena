import { memo, useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { ARENA_COLORS, SPRING_BOUNCE, SPRING_SOFT, TYPOGRAPHY, comboMultiplier, isComboVisible } from "@/lib/animations";

export interface ComboDisplayProps {
  combo: number;
  multiplier?: number;
  reduceMotion?: boolean;
}

export const ComboDisplay = memo(function ComboDisplay({
  combo,
  multiplier,
  reduceMotion = false,
}: ComboDisplayProps) {
  const scale = useSharedValue(isComboVisible(combo) ? 1 : 0.5);
  const opacity = useSharedValue(isComboVisible(combo) ? 1 : 0);
  const visible = isComboVisible(combo);
  const factor = multiplier ?? comboMultiplier(combo);

  useEffect(() => {
    if (!visible) {
      opacity.value = withTiming(0, { duration: reduceMotion ? 0 : 220 });
      return;
    }
    opacity.value = withTiming(1, { duration: reduceMotion ? 0 : 180 });
    if (reduceMotion) {
      scale.value = 1;
      return;
    }
    scale.value = withSequence(withSpring(1.35, SPRING_BOUNCE), withSpring(1, SPRING_SOFT));
  }, [combo, opacity, reduceMotion, scale, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      accessibilityRole="summary"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${combo} times combo, multiplier ${factor.toFixed(1)}`}
      style={[styles.container, animatedStyle]}
    >
      <Text style={styles.comboText}>{combo}x COMBO!</Text>
      <Text style={styles.multiplierText}>×{factor.toFixed(1)}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 18,
    alignSelf: "center",
    backgroundColor: "rgba(17,20,43,0.86)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: ARENA_COLORS.primary,
    alignItems: "center",
    zIndex: 12,
  },
  comboText: { ...TYPOGRAPHY.h2, color: ARENA_COLORS.primary },
  multiplierText: { ...TYPOGRAPHY.body, color: ARENA_COLORS.fog },
});
