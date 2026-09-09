import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ARENA_COLORS } from "@/lib/animations";
import { COMPANION_RENDER_BUDGET, windowSlice } from "@/lib/mobile-ux";

export interface ActivityRow {
  id: string;
  title: string;
  meta: string;
}

export const MobileActivityList = memo(function MobileActivityList({
  rows,
  windowSize = COMPANION_RENDER_BUDGET.activityWindow,
}: {
  rows: ActivityRow[];
  windowSize?: number;
}) {
  const data = useMemo(() => windowSlice(rows, 0, windowSize), [rows, windowSize]);

  return (
    <View>
      {data.map((item) => (
        <View key={item.id} style={styles.row} accessibilityLabel={`${item.title}. ${item.meta}`}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {item.meta}
          </Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { minHeight: 52, justifyContent: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#3A407A" },
  title: { color: ARENA_COLORS.cloud, fontWeight: "800", fontSize: 14 },
  meta: { color: ARENA_COLORS.fog, fontSize: 12, marginTop: 2 },
});
