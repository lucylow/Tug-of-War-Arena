import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ARENA_COLORS } from "@/lib/animations";
import { COMPANION_RENDER_BUDGET, windowSlice } from "@/lib/mobile-ux";

export interface LeaderboardRow {
  rank: number;
  name: string;
  wins: number;
  taps?: number;
}

export const MobileLeaderboardList = memo(function MobileLeaderboardList({
  rows,
  windowSize = COMPANION_RENDER_BUDGET.leaderboardWindow,
}: {
  rows: LeaderboardRow[];
  windowSize?: number;
}) {
  const data = useMemo(() => windowSlice(rows, 0, windowSize), [rows, windowSize]);

  return (
    <View>
      {data.map((item) => (
        <View key={`${item.rank}-${item.name}`} style={styles.row} accessibilityLabel={`Rank ${item.rank}, ${item.name}, ${item.wins} wins`}>
          <Text style={styles.rank}>#{String(item.rank).padStart(2, "0")}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.wins}>{item.wins}</Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#3A407A",
  },
  rank: { width: 40, color: ARENA_COLORS.primary, fontWeight: "900" },
  name: { flex: 1, color: ARENA_COLORS.cloud, fontWeight: "800" },
  wins: { color: ARENA_COLORS.fog, fontWeight: "800" },
});
