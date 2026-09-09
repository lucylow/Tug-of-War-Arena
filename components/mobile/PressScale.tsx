import { memo, type ReactNode } from "react";
import { Pressable, type AccessibilityRole, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { SPRING_SNAP } from "@/lib/animations";
import { expandHitSlop, pressScaleForMotion } from "@/lib/mobile-ux";

export interface PressScaleProps {
  children: ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  reduceMotion?: boolean;
  scaleTo?: number;
  style?: PressableProps["style"];
  hitSlop?: number;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: { disabled?: boolean; busy?: boolean };
  testID?: string;
}

export const PressScale = memo(function PressScale({
  children,
  onPress,
  onLongPress,
  disabled = false,
  reduceMotion = false,
  scaleTo = 0.92,
  style,
  hitSlop = 8,
  accessibilityRole = "button",
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  testID,
}: PressScaleProps) {
  const scale = useSharedValue(1);
  const target = pressScaleForMotion(reduceMotion, scaleTo);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...accessibilityState }}
      disabled={disabled}
      testID={testID}
      hitSlop={expandHitSlop(hitSlop)}
      onPressIn={() => {
        if (disabled || reduceMotion) return;
        scale.value = withSpring(target, SPRING_SNAP);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_SNAP);
      }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={style}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
});
