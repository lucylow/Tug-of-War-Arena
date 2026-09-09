import { memo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ARENA_COLORS } from "@/lib/animations";
import { classifyDevice, heroMinHeight, sectionPadding } from "@/lib/mobile-ux";

export const MobileHero = memo(function MobileHero({
  kicker,
  title,
  body,
  width,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  width: number;
  children?: ReactNode;
}) {
  const device = classifyDevice(width);
  return (
    <View style={[styles.hero, { minHeight: heroMinHeight(device), padding: sectionPadding(device) }]}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  hero: {
    backgroundColor: ARENA_COLORS.midnight,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#4DE7F233",
    gap: 8,
  },
  kicker: { color: ARENA_COLORS.fog, fontSize: 11, fontWeight: "800", letterSpacing: 1.6 },
  title: { color: ARENA_COLORS.cloud, fontSize: 28, fontWeight: "900", letterSpacing: -0.6 },
  body: { color: ARENA_COLORS.fog, fontSize: 14, lineHeight: 20 },
});
