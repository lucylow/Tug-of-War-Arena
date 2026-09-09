import { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAnimatedReaction, useSharedValue, withSpring, runOnJS } from "react-native-reanimated";

import { GraphicsErrorBoundary } from "@/components/errorBoundary/GraphicsErrorBoundary";
import { ARENA_COLORS, SPRING_SOFT, buildRopePoints, ropePathD } from "@/lib/animations";

export interface AnimatedRopeProps {
  position: number;
  width?: number;
  color?: string;
  tension?: number;
  reduceMotion?: boolean;
}

export const AnimatedRope = memo(function AnimatedRope({
  position,
  width = 280,
  color = ARENA_COLORS.rope,
  tension = 2,
  reduceMotion = false,
}: AnimatedRopeProps) {
  const pos = useSharedValue(position);
  const [path, setPath] = useState(() => ropePathD(buildRopePoints(position, width, 40, tension)));

  useEffect(() => {
    if (reduceMotion) {
      pos.value = position;
      setPath(ropePathD(buildRopePoints(position, width, 40, tension)));
      return;
    }
    pos.value = withSpring(position, SPRING_SOFT);
  }, [position, pos, reduceMotion, tension, width]);

  const commitPath = useMemo(
    () => (value: number) => {
      setPath(ropePathD(buildRopePoints(value, width, 40, tension)));
    },
    [tension, width],
  );

  useAnimatedReaction(
    () => Math.round(pos.value * 10) / 10,
    (value) => {
      runOnJS(commitPath)(value);
    },
    [commitPath],
  );

  return (
    <GraphicsErrorBoundary
      componentName="AnimatedRope"
      fallback={
        <View style={[styles.stage, { width }]} accessibilityElementsHidden>
          <Svg width={width} height={80} viewBox={`0 0 ${width} 80`}>
            <Path d={path} transform="translate(0 40)" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />
          </Svg>
        </View>
      }
    >
      <View style={[styles.stage, { width }]} accessibilityElementsHidden>
        <Svg width={width} height={80} viewBox={`0 0 ${width} 80`}>
          <Path d={path} transform="translate(0 40)" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />
          <Path
            d={path}
            transform="translate(0 40)"
            stroke={ARENA_COLORS.ropeHighlight}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    </GraphicsErrorBoundary>
  );
});

const styles = StyleSheet.create({
  stage: { height: 80, alignItems: "center", justifyContent: "center" },
});
