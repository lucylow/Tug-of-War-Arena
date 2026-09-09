import { memo, useEffect, useMemo, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { GraphicsErrorBoundary } from "@/components/errorBoundary/GraphicsErrorBoundary";
import { hideFromA11y } from "@/lib/a11y";
import {
  DEFAULT_FX_COUNT,
  FX_PARTICLE_COLORS,
  createFxParticles,
  fxParticlePose,
  type FxParticle,
} from "@/lib/animations";

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get("window");
const FX_DURATION_MS = 1800;

export interface ParticleSystemProps {
  active: boolean;
  count?: number;
  colors?: string[];
  areaWidth?: number;
  areaHeight?: number;
  onComplete?: () => void;
  reduceMotion?: boolean;
}

/** Reanimated View pool — Expo web + native 60fps without a Skia native module. */
const ParticleDot = memo(function ParticleDot({ particle }: { particle: FxParticle }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: FX_DURATION_MS, easing: Easing.out(Easing.quad) });
  }, [particle.id, progress]);

  const style = useAnimatedStyle(() => {
    const pose = fxParticlePose(particle, progress.value);
    return {
      left: pose.x,
      top: pose.y,
      opacity: pose.opacity * 0.85,
      width: pose.r * 2,
      height: pose.r * 2,
      borderRadius: pose.r,
      backgroundColor: particle.color,
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
});

export const ParticleSystem = memo(function ParticleSystem({
  active,
  count = DEFAULT_FX_COUNT,
  colors,
  areaWidth = WINDOW_WIDTH,
  areaHeight = WINDOW_HEIGHT,
  onComplete,
  reduceMotion = false,
}: ParticleSystemProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const particles = useMemo(() => {
    if (!active || reduceMotion) return [];
    return createFxParticles(count, areaWidth, areaHeight, colors ?? FX_PARTICLE_COLORS);
  }, [active, areaHeight, areaWidth, colors, count, reduceMotion]);

  useEffect(() => {
    if (!active) return;
    if (reduceMotion) {
      onCompleteRef.current?.();
      return;
    }
    const timer = setTimeout(() => onCompleteRef.current?.(), FX_DURATION_MS);
    return () => clearTimeout(timer);
  }, [active, reduceMotion]);

  if (!active || reduceMotion || particles.length === 0) return null;

  return (
    <GraphicsErrorBoundary componentName="ParticleSystem" fallback={null}>
      <View
        style={[styles.layer, { width: areaWidth, height: areaHeight }]}
        {...hideFromA11y()}
      >
        {particles.map((particle) => (
          <ParticleDot key={particle.id} particle={particle} />
        ))}
      </View>
    </GraphicsErrorBoundary>
  );
});

/** Spec alias used by the advanced animation suite. */
export const SkiaParticleSystem = ParticleSystem;

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25,
    pointerEvents: "none",
  },
  dot: {
    position: "absolute",
    pointerEvents: "none",
  },
});
