import { memo, useCallback, useMemo, type ReactNode } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import {
  DEFAULT_SWIPE_THRESHOLD,
  SPRING_SNAP,
  detectSwipeDirection,
  type SwipeDirection,
} from "@/lib/animations";

export interface SwipeableProps {
  children: ReactNode;
  onSwipe: (direction: SwipeDirection) => void;
  threshold?: number;
  enabled?: boolean;
}

export const Swipeable = memo(function Swipeable({
  children,
  onSwipe,
  threshold = DEFAULT_SWIPE_THRESHOLD,
  enabled = true,
}: SwipeableProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const emitSwipe = useCallback(
    (translationX: number, translationY: number) => {
      const direction = detectSwipeDirection(translationX, translationY, threshold);
      if (direction) onSwipe(direction);
    },
    [onSwipe, threshold],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .activeOffsetX([-16, 16])
        .activeOffsetY([-16, 16])
        .onUpdate((event) => {
          translateX.value = event.translationX * 0.35;
          translateY.value = event.translationY * 0.35;
        })
        .onEnd((event) => {
          runOnJS(emitSwipe)(event.translationX, event.translationY);
          translateX.value = withSpring(0, SPRING_SNAP);
          translateY.value = withSpring(0, SPRING_SNAP);
        }),
    [emitSwipe, enabled, translateX, translateY],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
});
