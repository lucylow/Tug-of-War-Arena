import { memo, useEffect, type ReactNode } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { ARENA_COLORS, TYPOGRAPHY } from "@/lib/animations";

const { width } = Dimensions.get("window");

export interface OnboardingSlide {
  title: string;
  description: string;
  illustration?: ReactNode;
}

export interface OnboardingAnimationProps {
  slide: OnboardingSlide;
  index: number;
  reduceMotion?: boolean;
}

export const OnboardingAnimation = memo(function OnboardingAnimation({
  slide,
  index,
  reduceMotion = false,
}: OnboardingAnimationProps) {
  const translateX = useSharedValue(reduceMotion ? 0 : width);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      translateX.value = 0;
      opacity.value = 1;
      return;
    }
    translateX.value = width;
    opacity.value = 0;
    translateX.value = withDelay(index * 120, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(index * 120 + 160, withTiming(1, { duration: 280 }));
  }, [index, opacity, reduceMotion, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.slide, animatedStyle]}>
      {slide.illustration ? <View style={styles.illustration}>{slide.illustration}</View> : null}
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.description}>{slide.description}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  slide: { width: width * 0.8, alignItems: "center", padding: 20 },
  illustration: { width: 200, height: 160, marginBottom: 16, alignItems: "center", justifyContent: "center" },
  title: { ...TYPOGRAPHY.h2, color: ARENA_COLORS.ink, textAlign: "center" },
  description: { ...TYPOGRAPHY.body, color: ARENA_COLORS.fog, textAlign: "center", marginTop: 8 },
});
