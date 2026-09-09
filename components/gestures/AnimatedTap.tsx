import { memo, type ReactNode } from "react";
import { Pressable, type AccessibilityRole, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { DEFAULT_LONG_PRESS_MS, DEFAULT_TAP_SCALE, SPRING_SNAP, clampScale } from "@/lib/animations";
import { HapticService } from "@/lib/haptics";

export interface AnimatedTapProps {
  children: ReactNode;
  onTap: () => void;
  onLongPress?: () => void;
  scaleTo?: number;
  disabled?: boolean;
  haptic?: boolean;
  style?: PressableProps["style"];
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: { disabled?: boolean; busy?: boolean };
  testID?: string;
}

export const AnimatedTap = memo(function AnimatedTap({
  children,
  onTap,
  onLongPress,
  scaleTo = DEFAULT_TAP_SCALE,
  disabled = false,
  haptic = true,
  style,
  accessibilityRole = "button",
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  testID,
}: AnimatedTapProps) {
  const scale = useSharedValue(1);
  const target = clampScale(scaleTo);

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
      delayLongPress={DEFAULT_LONG_PRESS_MS}
      onPressIn={() => {
        if (disabled) return;
        scale.value = withSpring(target, SPRING_SNAP);
        if (haptic) HapticService.light();
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_SNAP);
      }}
      onPress={onTap}
      onLongPress={onLongPress}
      style={style}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
});
