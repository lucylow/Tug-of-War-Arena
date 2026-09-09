import { Children, cloneElement, isValidElement, memo, useEffect, type ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";

import { SPRING_SOFT, staggerDelay } from "@/lib/animations";

export interface StaggeredContainerProps {
  children: ReactNode;
  staggerDelayMs?: number;
  duration?: number;
  visible?: boolean;
  style?: ViewStyle;
  reduceMotion?: boolean;
}

const StaggeredChild = memo(function StaggeredChild({
  delay,
  visible,
  duration,
  reduceMotion,
  children,
}: {
  delay: number;
  visible: boolean;
  duration: number;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const progress = useSharedValue(reduceMotion && visible ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = visible ? 1 : 0;
      return;
    }
    if (visible) {
      progress.value = withDelay(delay, withSpring(1, SPRING_SOFT));
    } else {
      progress.value = withDelay(delay, withTiming(0, { duration }));
    }
  }, [delay, duration, progress, reduceMotion, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.92 + progress.value * 0.08 }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
});

export const StaggeredContainer = memo(function StaggeredContainer({
  children,
  staggerDelayMs = 100,
  duration = 400,
  visible = true,
  style,
  reduceMotion = false,
}: StaggeredContainerProps) {
  const items = Children.toArray(children);

  return (
    <View style={style}>
      {items.map((child, index) => {
        if (!isValidElement(child)) return child;
        return (
          <StaggeredChild
            key={child.key ?? index}
            delay={staggerDelay(index, staggerDelayMs)}
            visible={visible}
            duration={duration}
            reduceMotion={reduceMotion}
          >
            {cloneElement(child)}
          </StaggeredChild>
        );
      })}
    </View>
  );
});
