import { memo, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, Easing } from "react-native-reanimated";

import { ARENA_COLORS, COUNTDOWN_EXIT_MS, COUNTDOWN_HOLD_MS, SPRING_BOUNCE, TYPOGRAPHY, countdownLabel } from "@/lib/animations";
import { HapticService } from "@/lib/haptics";

export interface CountdownOverlayProps {
  count: number;
  onComplete: () => void;
  reduceMotion?: boolean;
}

export const CountdownOverlay = memo(function CountdownOverlay({
  count,
  onComplete,
  reduceMotion = false,
}: CountdownOverlayProps) {
  const scale = useSharedValue(reduceMotion ? 1 : 0.5);
  const opacity = useSharedValue(1);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    HapticService.play(count === 0 ? "success" : "medium");
    if (reduceMotion) {
      scale.value = 1;
      opacity.value = 1;
      const timer = setTimeout(() => onCompleteRef.current(), COUNTDOWN_HOLD_MS);
      return () => clearTimeout(timer);
    }

    scale.value = 0.5;
    opacity.value = 1;
    scale.value = withSpring(1.15, SPRING_BOUNCE);

    const hold = setTimeout(() => {
      scale.value = withTiming(1.45, { duration: COUNTDOWN_EXIT_MS, easing: Easing.out(Easing.ease) });
      opacity.value = withTiming(0, { duration: COUNTDOWN_EXIT_MS });
    }, COUNTDOWN_HOLD_MS);

    const done = setTimeout(() => onCompleteRef.current(), COUNTDOWN_HOLD_MS + COUNTDOWN_EXIT_MS);
    return () => {
      clearTimeout(hold);
      clearTimeout(done);
    };
  }, [count, opacity, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const text = countdownLabel(count);
  if (!text) return null;

  return (
    <View
      accessibilityRole="timer"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={count === 0 ? "Go" : `Countdown ${text}`}
      style={styles.overlay}
    >
      <Animated.Text style={[styles.text, animatedStyle]}>{text}</Animated.Text>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ARENA_COLORS.overlay,
    zIndex: 20,
    pointerEvents: "none",
  },
  text: {
    ...TYPOGRAPHY.display,
    color: ARENA_COLORS.primary,
  },
});
