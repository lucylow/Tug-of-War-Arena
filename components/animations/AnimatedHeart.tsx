import { memo, useState } from "react";
import { Pressable } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { SPRING_BOUNCE, SPRING_SOFT } from "@/lib/animations";
import { HapticService } from "@/lib/haptics";

export interface AnimatedHeartProps {
  initialLiked?: boolean;
  onToggle?: (liked: boolean) => void;
  reduceMotion?: boolean;
}

export const AnimatedHeart = memo(function AnimatedHeart({
  initialLiked = false,
  onToggle,
  reduceMotion = false,
}: AnimatedHeartProps) {
  const [liked, setLiked] = useState(initialLiked);
  const scale = useSharedValue(1);
  const colorProgress = useSharedValue(initialLiked ? 1 : 0);

  const handlePress = () => {
    const next = !liked;
    setLiked(next);
    onToggle?.(next);
    HapticService.light();
    if (reduceMotion) {
      scale.value = 1;
      colorProgress.value = next ? 1 : 0;
      return;
    }
    scale.value = withSequence(withSpring(1.35, SPRING_BOUNCE), withSpring(1, SPRING_SOFT));
    colorProgress.value = withTiming(next ? 1 : 0, { duration: 240 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    color: interpolateColor(colorProgress.value, [0, 1], ["#A8B0D8", "#FF4444"]),
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={liked ? "Unlike" : "Like"}
      accessibilityState={{ selected: liked }}
      onPress={handlePress}
      hitSlop={8}
    >
      <Animated.Text style={[animatedStyle, { fontSize: 32 }]}>{liked ? "❤️" : "🤍"}</Animated.Text>
    </Pressable>
  );
});
