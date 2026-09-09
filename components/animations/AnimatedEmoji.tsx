import { memo, useEffect, useRef } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { SPRING_BOUNCE, SPRING_SOFT } from "@/lib/animations";

export interface AnimatedEmojiProps {
  emoji: string;
  active: boolean;
  size?: number;
  onComplete?: () => void;
  reduceMotion?: boolean;
}

export const AnimatedEmoji = memo(function AnimatedEmoji({
  emoji,
  active,
  size = 48,
  onComplete,
  reduceMotion = false,
}: AnimatedEmojiProps) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) {
      scale.value = 0;
      opacity.value = 0;
      translateY.value = 0;
      return;
    }

    if (reduceMotion) {
      scale.value = 1;
      opacity.value = 1;
      translateY.value = -16;
      const timer = setTimeout(() => onCompleteRef.current?.(), 600);
      return () => clearTimeout(timer);
    }

    scale.value = withSequence(withSpring(1.4, SPRING_BOUNCE), withSpring(1, SPRING_SOFT));
    translateY.value = withSpring(-30, SPRING_SOFT);
    opacity.value = withTiming(1, { duration: 220 });

    const hide = setTimeout(() => {
      scale.value = withTiming(0, { duration: 220 });
      opacity.value = withTiming(0, { duration: 220 });
    }, 800);
    const done = setTimeout(() => onCompleteRef.current?.(), 1050);
    return () => {
      clearTimeout(hide);
      clearTimeout(done);
    };
  }, [active, opacity, reduceMotion, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text pointerEvents="none" style={[animatedStyle, { fontSize: size, position: "absolute" }]}>
      {emoji}
    </Animated.Text>
  );
});
