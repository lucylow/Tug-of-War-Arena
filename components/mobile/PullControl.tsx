import { memo, useMemo, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { hideFromA11y } from "@/lib/a11y";
import { HapticService } from "@/lib/haptics";
import { createHapticBudget, ONE_THUMB_PULL_SIZE, pullControlMetrics, shouldPlayHaptic } from "@/lib/mobile-ux";
import { PressScale } from "./PressScale";

export interface PullControlProps {
  onPull: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  color: string;
  reduceMotion?: boolean;
  label?: string;
  sublabel?: string;
  testID?: string;
}

export const PullControl = memo(function PullControl({
  onPull,
  onLongPress,
  disabled = false,
  color,
  reduceMotion = false,
  label = "PULL!",
  sublabel = "tap fast",
  testID = "one-thumb-pull",
}: PullControlProps) {
  const metrics = pullControlMetrics(ONE_THUMB_PULL_SIZE);
  const haptics = useRef(
    createHapticBudget({
      enabled: shouldPlayHaptic(Platform.OS, reduceMotion),
      play: (kind) => HapticService.play(kind),
    }),
  ).current;

  const sizeStyle = useMemo(
    () => ({
      width: metrics.size,
      height: metrics.size,
      borderRadius: metrics.radius,
      backgroundColor: color,
      opacity: disabled ? 0.45 : 1,
    }),
    [color, disabled, metrics.radius, metrics.size],
  );

  return (
    <PressScale
      testID={testID}
      disabled={disabled}
      reduceMotion={reduceMotion}
      hitSlop={8}
      accessibilityLabel="Pull the rope"
      accessibilityHint={
        disabled
          ? "Pulling is unavailable while the match is paused, finished, or onboarding is open"
          : "Tap repeatedly to move the rope toward your team"
      }
      accessibilityState={{ disabled }}
      onPress={() => {
        if (disabled) return;
        haptics.tryPlay("light");
        onPull();
      }}
      onLongPress={onLongPress}
      style={[styles.button, sizeStyle]}
    >
      <View style={styles.inner} {...hideFromA11y()}>
        <MaterialIcons name="touch-app" size={36} color="#11142B" />
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sublabel}>{sublabel}</Text>
      </View>
    </PressScale>
  );
});

const styles = StyleSheet.create({
  button: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    borderWidth: 5,
    borderColor: "#FFFFFF55",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  inner: { alignItems: "center", justifyContent: "center" },
  label: { color: "#11142B", fontSize: 24, fontWeight: "900", marginTop: 2 },
  sublabel: { color: "#11142B", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
});
