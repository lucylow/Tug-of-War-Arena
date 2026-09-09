import { memo, useEffect } from "react";
import { StyleSheet, type DimensionValue, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { ARENA_COLORS } from "@/lib/animations";

export interface ShimmerLoadingProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  reduceMotion?: boolean;
}

export const ShimmerLoading = memo(function ShimmerLoading({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
  reduceMotion = false,
}: ShimmerLoadingProps) {
  const opacity = useSharedValue(reduceMotion ? 0.5 : 0.3);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.5;
      return;
    }
    opacity.value = withRepeat(withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[styles.skeleton, { width, height, borderRadius }, animatedStyle, style]}
    />
  );
});

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: ARENA_COLORS.panel,
    overflow: "hidden",
  },
});
