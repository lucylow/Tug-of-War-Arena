import { memo, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { ARENA_COLORS, SPRING_SOFT, TYPOGRAPHY } from "@/lib/animations";

export const LoadingScreen = memo(function LoadingScreen({ reduceMotion = false }: { reduceMotion?: boolean }) {
  const scale = useSharedValue(reduceMotion ? 1 : 0.8);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      rotate.value = 0;
      opacity.value = 1;
      return;
    }
    scale.value = withRepeat(
      withSequence(withSpring(1.08, SPRING_SOFT), withSpring(0.94, SPRING_SOFT)),
      -1,
      true,
    );
    rotate.value = withRepeat(withTiming(360, { duration: 2200 }), -1, false);
    opacity.value = withTiming(1, { duration: 420 });
  }, [opacity, reduceMotion, rotate, scale]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Tug of War Arena loading">
      <Animated.Text style={[styles.logo, logoStyle]}>⚔️</Animated.Text>
      <Text style={styles.title}>Tug of War Arena</Text>
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ARENA_COLORS.midnight,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { fontSize: 80 },
  title: { ...TYPOGRAPHY.h2, color: ARENA_COLORS.cloud, marginTop: 16 },
  subtitle: { ...TYPOGRAPHY.body, color: ARENA_COLORS.fog, marginTop: 8 },
});
