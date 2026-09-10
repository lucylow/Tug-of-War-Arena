import { Pressable, StyleSheet, Text, View } from "react-native";

import { WorldMiniMap2D } from "@/components/world/WorldMiniMap2D";
import { WALLET_COLORS as C } from "@/components/wallet/palette";
import {
  DEMO_SCENARIO_LABELS,
  formatRoomHud,
  type DemoScenario,
} from "@/lib/hybrid-world";
import { useHybridWorld } from "@/hooks/use-hybrid-world";

const SCENARIOS: DemoScenario[] = [
  "fresh",
  "busy-plaza",
  "active-match",
  "mission-ready",
  "tournament",
  "offline-companion",
];

type Props = {
  onOpenWorld?: () => void | Promise<void>;
  hybrid: ReturnType<typeof useHybridWorld>;
};

export function WorldCompanionCard({ onOpenWorld, hybrid }: Props) {
  const { projection, dataset, status } = hybrid;
  const hero = projection?.heroRoom ?? null;
  const metrics = projection?.metrics ?? {
    onlinePlayers: 0,
    activeRooms: 0,
    upcomingEvents: 0,
    matchesToday: 0,
    socialSignals: 0,
    communityScore: 0,
  };
  const nearbyPlayers = Array.isArray(projection?.nearbyPlayers) ? projection.nearbyPlayers : [];
  const upcomingEvents = Array.isArray(projection?.upcomingEvents) ? projection.upcomingEvents : [];

  const openWorld = async () => {
    try {
      if (onOpenWorld) {
        await onOpenWorld();
        return;
      }
      await hybrid.openWorld();
    } catch {
      // The companion stays usable if the 3D world link cannot open.
    }
  };

  return (
    <View accessibilityLabel="2D plus 3D world companion" style={styles.card}>
      <Text style={styles.kicker}>2D + 3D WORLD COMPANION</Text>
      <Text style={styles.title}>Friendzone World</Text>
      <Text style={styles.body}>Same synthetic demo universe as the 3D scene. Works offline without a World connection.</Text>

      <View style={styles.metrics}>
        <Metric label="ONLINE" value={metrics.onlinePlayers} />
        <Metric label="ROOMS" value={metrics.activeRooms} />
        <Metric label="EVENTS" value={metrics.upcomingEvents} />
        <Metric label="SIGNALS" value={metrics.socialSignals} />
      </View>

      {hero ? (
        <View accessibilityLabel={`Featured 3D room ${hero.title}`} style={styles.hero}>
          <Text style={styles.kicker}>FEATURED 3D ROOM</Text>
          <Text style={styles.heroTitle}>{hero.title}</Text>
          <Text style={styles.heroMeta}>{formatRoomHud(hero)}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>WORLD PRESENCE</Text>
      <View style={styles.presenceRow}>
        {nearbyPlayers.slice(0, 6).map((player) => (
          <View key={player.id} style={[styles.avatar, { borderColor: player.team === "sun" ? C.coral : C.cyan }]}>
            <Text style={styles.avatarText}>{(player.displayName || "??").slice(0, 2).toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>UPCOMING 3D EVENTS</Text>
      {upcomingEvents.slice(0, 3).map((event) => (
        <Text key={event.id} style={styles.eventLine}>
          {event.title || "Upcoming event"}
        </Text>
      ))}

      <View style={styles.mapWrap}>
        <WorldMiniMap2D dataset={dataset} />
      </View>

      <View style={styles.scenarios}>
        {SCENARIOS.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: hybrid.scenario === item }}
            accessibilityLabel={`Demo scenario ${DEMO_SCENARIO_LABELS[item]}`}
            onPress={() => hybrid.setScenario(item)}
            style={({ pressed }) => [
              styles.chip,
              hybrid.scenario === item && styles.chipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.chipText, hybrid.scenario === item && styles.chipTextActive]}>
              {DEMO_SCENARIO_LABELS[item].toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open 3D World"
          onPress={() => void openWorld()}
          style={({ pressed }) => [styles.action, styles.actionPrimary, pressed && styles.pressed]}
        >
          <Text style={styles.actionPrimaryText}>OPEN 3D WORLD</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh demo"
          onPress={hybrid.refresh}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>REFRESH DEMO</Text>
        </Pressable>
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {status}
      </Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
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
  title: { color: C.cloud, fontSize: 18, fontWeight: "900", marginTop: 6 },
  body: { color: C.fog, fontSize: 13, lineHeight: 18, marginTop: 6, marginBottom: 12 },
  metrics: { flexDirection: "row", gap: 8, marginBottom: 12 },
  metric: {
    flex: 1,
    backgroundColor: C.midnight,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  metricLabel: { color: C.fog, fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
  metricValue: { color: C.cloud, fontSize: 16, fontWeight: "900", marginTop: 2 },
  hero: {
    backgroundColor: C.midnight,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  heroTitle: { color: C.cloud, fontSize: 16, fontWeight: "900", marginTop: 4 },
  heroMeta: { color: C.fog, fontSize: 12, lineHeight: 17, marginTop: 6, fontWeight: "700" },
  section: { color: C.mint, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 8 },
  presenceRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.midnight,
  },
  avatarText: { color: C.cloud, fontSize: 11, fontWeight: "900" },
  eventLine: { color: C.cloud, fontSize: 13, fontWeight: "700", marginBottom: 4 },
  mapWrap: { marginTop: 10, marginBottom: 12 },
  scenarios: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: C.gold, borderColor: C.gold },
  chipText: { color: C.fog, fontSize: 10, fontWeight: "900" },
  chipTextActive: { color: C.ink },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.mint,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  actionPrimary: { backgroundColor: C.mint, borderColor: C.mint },
  actionText: { color: C.mint, fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  actionPrimaryText: { color: C.ink, fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  status: { color: C.gold, fontSize: 11, fontWeight: "800", marginTop: 10 },
  pressed: { opacity: 0.75 },
});
