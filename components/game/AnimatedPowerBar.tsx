import { memo, useEffect } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { GraphicsErrorBoundary } from "@/components/errorBoundary/GraphicsErrorBoundary";
import { ARENA_COLORS, SPRING_SOFT, TYPOGRAPHY, powerProgress, shouldGlow, withAlpha } from "@/lib/animations";

export interface AnimatedPowerBarProps {
  team: "red" | "blue";
  power: number;
  maxPower: number;
  label?: string;
  glow?: boolean;
  reduceMotion?: boolean;
  showCenterMarker?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

function StaticPowerBar({
  team,
  power,
  maxPower,
  label,
  showCenterMarker = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: AnimatedPowerBarProps) {
  const color = team === "red" ? ARENA_COLORS.teamRed : ARENA_COLORS.teamBlue;
  const now = Math.round(powerProgress(power, maxPower) * 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? label ?? "Power"}
      accessibilityHint={accessibilityHint}
      accessibilityValue={{ min: 0, max: 100, now, text: `${now} percent` }}
      style={[styles.container, style]}
    >
      {label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
      <View style={styles.barWrapper}>
        <View style={[styles.barBackground, { backgroundColor: withAlpha(color, "22") }]}>
          <View style={[styles.barFill, { width: `${now}%`, backgroundColor: color }]} />
          {showCenterMarker ? <View style={styles.centerMarker} /> : null}
        </View>
      </View>
      {label ? (
        <Text style={styles.powerText}>
          {Math.round(power)} / {maxPower}
        </Text>
      ) : null}
    </View>
  );
}

function AnimatedPowerBarView({
  team,
  power,
  maxPower,
  label,
  glow = false,
  reduceMotion = false,
  showCenterMarker = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: AnimatedPowerBarProps) {
  const progress = useSharedValue(powerProgress(power, maxPower));
  const glowOpacity = useSharedValue(0);
  const trackWidth = useSharedValue(0);

  useEffect(() => {
    const next = powerProgress(power, maxPower);
    if (reduceMotion) {
      progress.value = next;
    } else {
      progress.value = withSpring(next, SPRING_SOFT);
    }

    const glowing = shouldGlow(power, maxPower, glow);
    cancelAnimation(glowOpacity);
    if (glowing && !reduceMotion) {
      glowOpacity.value = withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      glowOpacity.value = glowing ? 0.45 : 0;
    }

    return () => {
      cancelAnimation(glowOpacity);
    };
  }, [glow, glowOpacity, maxPower, power, progress, reduceMotion]);

  const barStyle = useAnimatedStyle(() => ({
    width: trackWidth.value * progress.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const color = team === "red" ? ARENA_COLORS.teamRed : ARENA_COLORS.teamBlue;
  const glowColor = withAlpha(color, "44");
  const now = Math.round(powerProgress(power, maxPower) * 100);

  const onLayout = (event: LayoutChangeEvent) => {
    trackWidth.value = event.nativeEvent.layout.width;
  };

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? label ?? "Power"}
      accessibilityHint={accessibilityHint}
      accessibilityValue={{ min: 0, max: 100, now, text: `${now} percent` }}
      style={[styles.container, style]}
    >
      {label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
      <View style={styles.barWrapper}>
        <View
          onLayout={onLayout}
          style={[styles.barBackground, { backgroundColor: withAlpha(color, "22") }]}
        >
          <Animated.View style={[styles.barFill, { backgroundColor: color }, barStyle]} />
          {showCenterMarker ? <View style={styles.centerMarker} /> : null}
        </View>
        <Animated.View style={[styles.glowOverlay, { backgroundColor: glowColor }, glowStyle]} />
      </View>
      {label ? (
        <Text style={styles.powerText}>
          {Math.round(power)} / {maxPower}
        </Text>
      ) : null}
    </View>
  );
}

export const AnimatedPowerBar = memo(function AnimatedPowerBar(props: AnimatedPowerBarProps) {
  return (
    <GraphicsErrorBoundary componentName="AnimatedPowerBar" fallback={<StaticPowerBar {...props} />}>
      <AnimatedPowerBarView {...props} />
    </GraphicsErrorBoundary>
  );
});

const styles = StyleSheet.create({
  container: { width: "100%", marginVertical: 4 },
  label: { ...TYPOGRAPHY.caption, fontWeight: "bold", marginBottom: 2 },
  barWrapper: { width: "100%", position: "relative" },
  barBackground: { height: 12, borderRadius: 10, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 10 },
  glowOverlay: {
    position: "absolute",
    top: -4,
    bottom: -4,
    left: 0,
    right: 0,
    borderRadius: 12,
  },
  centerMarker: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 3,
    marginLeft: -1.5,
    backgroundColor: ARENA_COLORS.cloud,
  },
  powerText: { ...TYPOGRAPHY.caption, color: ARENA_COLORS.fog, marginTop: 2 },
});
