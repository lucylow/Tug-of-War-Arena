import { memo, type ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { DEFAULT_LONG_PRESS_MS, SPRING_SNAP } from "@/lib/animations";
import { HapticService } from "@/lib/haptics";

export interface LongPressableProps {
  children: ReactNode;
  onLongPress: () => void;
  delayMs?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const LongPressable = memo(function LongPressable({
  children,
  onLongPress,
  delayMs = DEFAULT_LONG_PRESS_MS,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: LongPressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      delayLongPress={delayMs}
      onPressIn={() => {
        if (disabled) return;
        scale.value = withSpring(0.96, SPRING_SNAP);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_SNAP);
      }}
      onLongPress={() => {
        if (disabled) return;
        HapticService.medium();
        onLongPress();
      }}
      style={style}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
});
