import { memo } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";

import { ARENA_COLORS, DEFAULT_PARALLAX_HEADER, DEFAULT_PARALLAX_MIN, TYPOGRAPHY, parallaxHeaderMetrics } from "@/lib/animations";

export interface ParallaxHeaderProps {
  title: string;
  scrollY: SharedValue<number>;
  minHeight?: number;
  headerHeight?: number;
}

export const ParallaxHeader = memo(function ParallaxHeader({
  title,
  scrollY,
  minHeight = DEFAULT_PARALLAX_MIN,
  headerHeight = DEFAULT_PARALLAX_HEADER,
}: ParallaxHeaderProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const metrics = parallaxHeaderMetrics(scrollY.value, headerHeight, minHeight);
    return {
      height: metrics.height,
      transform: [{ scale: metrics.scale }, { translateY: metrics.translateY }],
    };
  });

  return (
    <Animated.View style={[styles.header, animatedStyle]}>
      <Text style={styles.title}>{title}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  header: {
    backgroundColor: ARENA_COLORS.ink,
    justifyContent: "flex-end",
    paddingBottom: 20,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  title: { ...TYPOGRAPHY.h2, color: ARENA_COLORS.cloud },
});
