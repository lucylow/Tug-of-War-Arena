import { memo, useEffect, useMemo, useRef } from "react";
import { Dimensions, InteractionManager, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { GraphicsErrorBoundary } from "@/components/errorBoundary/GraphicsErrorBoundary";
import { hideFromA11y } from "@/lib/a11y";
import { CONFETTI_DURATION_MS, DEFAULT_CONFETTI_COUNT, createConfettiPieces, type ConfettiPiece } from "@/lib/animations";

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get("window");

export interface ConfettiCannonProps {
  active: boolean;
  count?: number;
  colors?: string[];
  onFinish?: () => void;
  reduceMotion?: boolean;
}

const Piece = memo(function Piece({ piece }: { piece: ConfettiPiece }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: CONFETTI_DURATION_MS, easing: Easing.out(Easing.quad) });
  }, [piece.id, progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const gravity = 520;
    return {
      left: piece.x + piece.vx * t,
      top: piece.y + piece.vy * t + gravity * t * t,
      opacity: 1 - t,
      transform: [
        { rotate: `${piece.rotation + piece.spin * t}deg` },
        { scale: piece.scale * (1 - t * 0.25) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: piece.size,
          height: piece.size * 0.6,
          backgroundColor: piece.color,
          borderRadius: piece.size / 4,
        },
        style,
      ]}
    />
  );
});

export const ConfettiCannon = memo(function ConfettiCannon({
  active,
  count = DEFAULT_CONFETTI_COUNT,
  colors,
  onFinish,
  reduceMotion = false,
}: ConfettiCannonProps) {
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  const pieces = useMemo(() => {
    if (!active || reduceMotion) return [];
    return createConfettiPieces(count, WINDOW_WIDTH, WINDOW_HEIGHT, colors);
  }, [active, colors, count, reduceMotion]);

  useEffect(() => {
    if (!active) return;
    if (reduceMotion) {
      finishRef.current?.();
      return;
    }
    const interaction = InteractionManager.runAfterInteractions(() => undefined);
    const timer = setTimeout(() => finishRef.current?.(), CONFETTI_DURATION_MS);
    return () => {
      interaction.cancel();
      clearTimeout(timer);
    };
  }, [active, reduceMotion]);

  if (!active || reduceMotion || pieces.length === 0) return null;

  return (
    <GraphicsErrorBoundary componentName="ConfettiCannon" fallback={null}>
      <View style={styles.layer} {...hideFromA11y()}>
        {pieces.map((piece) => (
          <Piece key={piece.id} piece={piece} />
        ))}
      </View>
    </GraphicsErrorBoundary>
  );
});

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    pointerEvents: "none",
  },
  piece: {
    position: "absolute",
  },
});
