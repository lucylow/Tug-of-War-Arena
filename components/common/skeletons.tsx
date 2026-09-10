import { StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";

function SkeletonCard({ kicker, title }: { kicker: string; title: string }) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={`${kicker} loading`} style={styles.card}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.bar} />
      <View style={[styles.bar, styles.short]} />
    </View>
  );
}

export function WalletSkeleton() {
  return <SkeletonCard kicker="WALLET" title="Checking wallet…" />;
}

export function WorldSkeleton() {
  return <SkeletonCard kicker="WORLD" title="Loading Friendzone World…" />;
}

export function RoomSkeleton() {
  return <SkeletonCard kicker="ROOM" title="Finding a public room…" />;
}

export function LeaderboardSkeleton() {
  return <SkeletonCard kicker="LEADERBOARD" title="Loading standings…" />;
}

export function MissionSkeleton() {
  return <SkeletonCard kicker="MISSION" title="Loading missions…" />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.panel,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  kicker: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: C.cloud, fontSize: 16, fontWeight: "800", marginTop: 6, marginBottom: 12 },
  bar: { height: 10, borderRadius: 6, backgroundColor: "#1A1F4A", marginBottom: 8 },
  short: { width: "62%" },
});
