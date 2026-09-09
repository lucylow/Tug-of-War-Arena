import { memo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ARENA_COLORS } from "@/lib/animations";
import { classifyDevice, sectionPadding } from "@/lib/mobile-ux";

export const MobileSection = memo(function MobileSection({
  title,
  width,
  children,
}: {
  title: string;
  width: number;
  children: ReactNode;
}) {
  const pad = sectionPadding(classifyDevice(width));
  return (
    <View style={[styles.section, { padding: pad }]}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    backgroundColor: ARENA_COLORS.midnight,
    borderRadius: 20,
    gap: 8,
  },
  title: { color: ARENA_COLORS.fog, fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
});
