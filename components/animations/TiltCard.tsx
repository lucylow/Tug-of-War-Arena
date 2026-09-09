import { memo, useMemo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { DEFAULT_TILT_AMOUNT, SPRING_SOFT, tiltFromDelta } from "@/lib/animations";

export interface TiltCardProps {
  children: ReactNode;
  tiltAmount?: number;
  reduceMotion?: boolean;
}

export const TiltCard = memo(function TiltCard({
  children,
  tiltAmount = DEFAULT_TILT_AMOUNT,
  reduceMotion = false,
}: TiltCardProps) {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const width = useSharedValue(300);
  const height = useSharedValue(200);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!reduceMotion)
        .onUpdate((event) => {
          const next = tiltFromDelta(event.translationX, event.translationY, width.value, height.value, tiltAmount);
          rotateX.value = next.rotateX;
          rotateY.value = next.rotateY;
        })
        .onEnd(() => {
          rotateX.value = withSpring(0, SPRING_SOFT);
          rotateY.value = withSpring(0, SPRING_SOFT);
        }),
    [height, reduceMotion, rotateX, rotateY, tiltAmount, width],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        onLayout={(event) => {
          width.value = event.nativeEvent.layout.width;
          height.value = event.nativeEvent.layout.height;
        }}
        style={[styles.card, animatedStyle]}
      >
        <View>{children}</View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
