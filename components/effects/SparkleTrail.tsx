import { memo, useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { hideFromA11y } from "@/lib/a11y";
import { ARENA_COLORS, DEFAULT_SPARKLE_COUNT, createSparkles, fxParticlePose, type FxParticle } from "@/lib/animations";

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get("window");
const SPARKLE_MS = 700;

const SparkleDot = memo(function SparkleDot({ particle }: { particle: FxParticle }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: SPARKLE_MS, easing: Easing.out(Easing.quad) });
  }, [particle.id, progress]);

  const style = useAnimatedStyle(() => {
    const pose = fxParticlePose(particle, progress.value);
    return {
      left: pose.x,
      top: pose.y,
      opacity: pose.opacity,
      width: pose.r * 2,
      height: pose.r * 2,
      borderRadius: pose.r,
      backgroundColor: particle.color,
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
});

export interface SparkleTrailProps {
  active: boolean;
  position: { x: number; y: number };
  color?: string;
  reduceMotion?: boolean;
}

export const SparkleTrail = memo(function SparkleTrail({
  active,
  position,
  color = ARENA_COLORS.primary,
  reduceMotion = false,
}: SparkleTrailProps) {
  const sparkles = useMemo(() => {
    if (!active || reduceMotion) return [];
    const seed = Math.floor(position.x * 13 + position.y * 17) || 1;
    return createSparkles(DEFAULT_SPARKLE_COUNT, position.x, position.y, color, seed);
  }, [active, color, position.x, position.y, reduceMotion]);

  if (!active || reduceMotion || sparkles.length === 0) return null;

  return (
    <View style={styles.layer} {...hideFromA11y()}>
      {sparkles.map((sparkle) => (
        <SparkleDot key={sparkle.id} particle={sparkle} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    zIndex: 26,
    pointerEvents: "none",
  },
  dot: {
    position: "absolute",
    pointerEvents: "none",
  },
});
