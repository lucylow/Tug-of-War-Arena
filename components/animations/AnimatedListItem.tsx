import { memo, useEffect, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from "react-native-reanimated";

import { SPRING_SOFT, listItemEnterDelay } from "@/lib/animations";

export interface AnimatedListItemProps {
  children: ReactNode;
  index: number;
  visible?: boolean;
  reduceMotion?: boolean;
}

export const AnimatedListItem = memo(function AnimatedListItem({
  children,
  index,
  visible = true,
  reduceMotion = false,
}: AnimatedListItemProps) {
  const opacity = useSharedValue(reduceMotion && visible ? 1 : 0);
  const translateY = useSharedValue(reduceMotion && visible ? 0 : 18);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = visible ? 1 : 0;
      translateY.value = 0;
      return;
    }
    if (!visible) {
      opacity.value = withSpring(0, SPRING_SOFT);
      translateY.value = withSpring(18, SPRING_SOFT);
      return;
    }
    const delay = listItemEnterDelay(index);
    opacity.value = withDelay(delay, withSpring(1, SPRING_SOFT));
    translateY.value = withDelay(delay, withSpring(0, SPRING_SOFT));
  }, [index, opacity, reduceMotion, translateY, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.container, animatedStyle]}>{children}</Animated.View>;
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
