import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ARENA_COLORS } from "@/lib/animations";
import type { DiagnosticSnapshot } from "@/lib/mobile-ux";

export const PerformanceHud = memo(function PerformanceHud({
  snapshot,
  visible = typeof __DEV__ !== "undefined" && __DEV__,
}: {
  snapshot: DiagnosticSnapshot;
  visible?: boolean;
}) {
  if (!visible) return null;
  const color =
    snapshot.grade === "good"
      ? ARENA_COLORS.mint
      : snapshot.grade === "ok"
        ? ARENA_COLORS.primary
        : ARENA_COLORS.error;
  return (
    <View accessibilityLabel={snapshot.line} style={styles.hud}>
      <Text style={[styles.text, { color }]}>{snapshot.line}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  hud: {
    alignSelf: "flex-start",
    backgroundColor: "#11142BCC",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
});
