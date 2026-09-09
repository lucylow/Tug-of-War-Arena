import { memo, useEffect, useRef } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { ARENA_COLORS, SPRING_BOUNCE, SPRING_SOFT, TYPOGRAPHY, matchResultCopy } from "@/lib/animations";
import { ParticleSystem } from "@/components/effects/ParticleSystem";
import { HapticService } from "@/lib/haptics";

export interface VictoryAnimationProps {
  isWin: boolean;
  onComplete?: () => void;
  reduceMotion?: boolean;
  showParticles?: boolean;
}

export const VictoryAnimation = memo(function VictoryAnimation({
  isWin,
  onComplete,
  reduceMotion = false,
  showParticles = true,
}: VictoryAnimationProps) {
  const scale = useSharedValue(reduceMotion ? 1 : 0.5);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(reduceMotion ? 0 : 80);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const copy = matchResultCopy(isWin);
  const color = isWin ? ARENA_COLORS.mint : ARENA_COLORS.error;

  useEffect(() => {
    HapticService.play(isWin ? "success" : "error");
    if (reduceMotion) {
      scale.value = 1;
      opacity.value = 1;
      translateY.value = 0;
      const timer = setTimeout(() => onCompleteRef.current?.(), 1200);
      return () => clearTimeout(timer);
    }

    scale.value = withSequence(withSpring(1.16, SPRING_BOUNCE), withSpring(1, SPRING_SOFT));
    opacity.value = withTiming(1, { duration: 320 });
    translateY.value = withSpring(0, SPRING_SOFT);

    const hide = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 280 });
      translateY.value = withTiming(-80, { duration: 360 });
    }, 2500);
    const done = setTimeout(() => onCompleteRef.current?.(), 3000);
    return () => {
      clearTimeout(hide);
      clearTimeout(done);
    };
  }, [isWin, opacity, reduceMotion, scale, translateY]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, overlayStyle]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={copy.accessibilityLabel}
    >
      {showParticles ? (
        <ParticleSystem active={isWin && !reduceMotion} count={64} reduceMotion={reduceMotion} />
      ) : null}
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Text style={styles.emoji}>{copy.emoji}</Text>
          <Text style={[styles.title, { color }]}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ARENA_COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: ARENA_COLORS.panel,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    minWidth: 260,
  },
  emoji: { fontSize: 72, marginBottom: 8 },
  title: { ...TYPOGRAPHY.h2 },
  subtitle: { ...TYPOGRAPHY.body, color: ARENA_COLORS.fog, marginTop: 4 },
});
