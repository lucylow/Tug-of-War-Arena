import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useSocial } from "@/hooks/use-social";
import type { LeaderboardFilter } from "@/lib/social/types";

function rankColor(rank: number): string {
  if (rank === 1) return C.gold;
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  return C.fog;
}

export function SocialLeaderboard() {
  const { leaderboard, fetchLeaderboard } = useSocial();
  const [filter, setFilter] = useState<LeaderboardFilter>("global");

  useEffect(() => {
    void fetchLeaderboard(filter);
  }, [fetchLeaderboard, filter]);

  return (
    <View>
      <View style={styles.tabs}>
        {(["global", "friends", "guild"] as LeaderboardFilter[]).map((tab) => (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === tab }}
            accessibilityLabel={`${tab} leaderboard`}
            onPress={() => setFilter(tab)}
            style={({ pressed }) => [styles.tab, filter === tab && styles.activeTab, pressed && styles.pressed]}
          >
            <Text style={[styles.tabText, filter === tab && styles.activeText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      {leaderboard.entries.map((item) => (
        <View key={item.userId} style={styles.entry}>
          <Text style={[styles.rank, { color: rankColor(item.rank) }]}>#{String(item.rank).padStart(2, "0")}</Text>
          <Avatar size={36} uri={item.avatarUrl} name={item.displayName} />
          <Text style={styles.name}>{item.displayName}</Text>
          <Text style={styles.score}>{item.wins}</Text>
        </View>
      ))}
      {filter === "guild" && leaderboard.entries.length === 0 ? (
        <Text style={styles.empty}>Join a guild to see crew ranks.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", backgroundColor: C.midnight, borderRadius: 16, padding: 4, marginBottom: 8 },
  tab: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  activeTab: { backgroundColor: C.panel },
  tabText: { color: C.fog, fontSize: 12, fontWeight: "800" },
  activeText: { color: C.gold },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rank: { width: 40, fontWeight: "900" },
  name: { flex: 1, marginLeft: 10, color: C.cloud, fontWeight: "800" },
  score: { color: C.gold, fontWeight: "900" },
  empty: { color: C.fog, textAlign: "center", marginTop: 20 },
  pressed: { opacity: 0.78 },
});
