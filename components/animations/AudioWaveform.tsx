import { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";

import { ARENA_COLORS, WAVEFORM_BAR_COUNT, WAVEFORM_MIN_HEIGHT, waveformBarTarget } from "@/lib/animations";

export interface AudioWaveformProps {
  active: boolean;
  barCount?: number;
  color?: string;
  reduceMotion?: boolean;
}

const WaveBar = memo(function WaveBar({
  index,
  active,
  color,
  reduceMotion,
}: {
  index: number;
  active: boolean;
  color: string;
  reduceMotion: boolean;
}) {
  const height = useSharedValue(WAVEFORM_MIN_HEIGHT);
  const target = waveformBarTarget(index, active);

  useEffect(() => {
    if (reduceMotion) {
      height.value = active ? target.to : WAVEFORM_MIN_HEIGHT;
      return;
    }
    if (active) {
      height.value = withDelay(
        target.delay,
        withRepeat(withTiming(target.to, { duration: target.duration, easing: Easing.inOut(Easing.sin) }), -1, true),
      );
    } else {
      height.value = withTiming(WAVEFORM_MIN_HEIGHT, { duration: 240 });
    }
  }, [active, height, reduceMotion, target.delay, target.duration, target.to]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  return <Animated.View style={[styles.bar, animatedStyle, { backgroundColor: color }]} />;
});

export const AudioWaveform = memo(function AudioWaveform({
  active,
  barCount = WAVEFORM_BAR_COUNT,
  color = ARENA_COLORS.teamBlue,
  reduceMotion = false,
}: AudioWaveformProps) {
  const count = Number.isFinite(barCount) ? Math.max(1, Math.min(16, Math.floor(barCount))) : WAVEFORM_BAR_COUNT;
  const bars = Array.from({ length: count }, (_, index) => index);

  return (
    <View style={styles.container} accessibilityRole="image" accessibilityLabel={active ? "Audio playing" : "Audio idle"}>
      {bars.map((index) => (
        <WaveBar key={index} index={index} active={active} color={color} reduceMotion={reduceMotion} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 2,
    backgroundColor: ARENA_COLORS.teamBlue,
  },
});
