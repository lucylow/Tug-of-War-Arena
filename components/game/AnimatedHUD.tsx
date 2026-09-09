import { memo, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { GraphicsErrorBoundary } from "@/components/errorBoundary/GraphicsErrorBoundary";
import {
  ARENA_COLORS,
  SPRING_BOUNCE,
  SPRING_SNAP,
  TYPOGRAPHY,
  formatHudScore,
  formatHudTimer,
  shouldPulseTimer,
} from "@/lib/animations";

export interface AnimatedHUDProps {
  time: number;
  scoreRed: number;
  scoreBlue: number;
  status?: string;
  reduceMotion?: boolean;
}

export const AnimatedHUD = memo(function AnimatedHUD({
  time,
  scoreRed,
  scoreBlue,
  status,
  reduceMotion = false,
}: AnimatedHUDProps) {
  const timeScale = useSharedValue(1);
  const scoreScale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion || !shouldPulseTimer(time)) {
      timeScale.value = 1;
      return;
    }
    timeScale.value = withSpring(1.18, SPRING_BOUNCE);
    const reset = setTimeout(() => {
      timeScale.value = withSpring(1, SPRING_SNAP);
    }, 180);
    return () => clearTimeout(reset);
  }, [reduceMotion, time, timeScale]);

  useEffect(() => {
    if (reduceMotion) {
      scoreScale.value = 1;
      return;
    }
    scoreScale.value = withSpring(1.22, SPRING_BOUNCE);
    const reset = setTimeout(() => {
      scoreScale.value = withSpring(1, SPRING_SNAP);
    }, 160);
    return () => clearTimeout(reset);
  }, [reduceMotion, scoreBlue, scoreRed, scoreScale]);

  const timerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timeScale.value }],
  }));

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const warning = shouldPulseTimer(time);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Animated.Text style={[styles.score, scoreStyle]}>{formatHudScore(scoreRed, scoreBlue)}</Animated.Text>
        <Animated.Text style={[styles.timer, timerStyle, warning && styles.warning]}>{formatHudTimer(time)}</Animated.Text>
      </View>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
});

export const AnimatedTimerText = memo(function AnimatedTimerText({
  time,
  reduceMotion = false,
  style,
}: {
  time: number;
  reduceMotion?: boolean;
  style?: object;
}) {
  return (
    <GraphicsErrorBoundary
      componentName="AnimatedTimerText"
      fallback={
        <Text style={[style, shouldPulseTimer(time) && styles.warning]}>{formatHudTimer(time)}</Text>
      }
    >
      <AnimatedTimerTextView time={time} reduceMotion={reduceMotion} style={style} />
    </GraphicsErrorBoundary>
  );
});

const AnimatedTimerTextView = memo(function AnimatedTimerTextView({
  time,
  reduceMotion = false,
  style,
}: {
  time: number;
  reduceMotion?: boolean;
  style?: object;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion || !shouldPulseTimer(time)) {
      scale.value = 1;
      return;
    }
    scale.value = withSpring(1.16, SPRING_BOUNCE);
    const reset = setTimeout(() => {
      scale.value = withSpring(1, SPRING_SNAP);
    }, 180);
    return () => clearTimeout(reset);
  }, [reduceMotion, scale, time]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.Text style={[style, animatedStyle, shouldPulseTimer(time) && styles.warning]}>{formatHudTimer(time)}</Animated.Text>;
});

const styles = StyleSheet.create({
  container: { paddingHorizontal: 4, paddingTop: 4 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  score: { ...TYPOGRAPHY.h2, color: ARENA_COLORS.cloud },
  timer: { ...TYPOGRAPHY.h2, color: ARENA_COLORS.ink },
  warning: { color: ARENA_COLORS.error },
  status: { ...TYPOGRAPHY.body, color: ARENA_COLORS.fog, textAlign: "center", marginTop: 4 },
});
