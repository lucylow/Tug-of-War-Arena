import { Pressable, StyleSheet, Text, View } from "react-native";

import { WorldMiniMap } from "@/components/friendzone/WorldMiniMap";
import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useHybridWorld } from "@/hooks/use-hybrid-world";
import { runSafely } from "@/lib/safe";
import { projectWorldFeedToMobile, worldFeedFromHybrid } from "@/lib/world";

type Props = {
  onEnterWorld?: () => void | Promise<void>;
  onViewMap?: () => void;
  hybrid?: ReturnType<typeof useHybridWorld>;
};

export function WorldEntryCard({ onEnterWorld, onViewMap, hybrid }: Props) {
  const localHybrid = useHybridWorld();
  const world = hybrid ?? localHybrid;
  const feed = worldFeedFromHybrid(world.dataset);
  const projection = projectWorldFeedToMobile(feed);

  const enterWorld = async () => {
    await runSafely(async () => {
      if (onEnterWorld) {
        await onEnterWorld();
        return;
      }
      await world.openWorld();
    }, undefined);
  };

  return (
    <View accessibilityLabel="Friendzone World entry" style={styles.card}>
      <Text style={styles.kicker}>FRIENDZONE WORLD</Text>
      <Text style={styles.title}>3D SOCIAL ARENA</Text>
      <Text style={styles.body}>
        Mobile companion preview. This is not the Decentraland engine. Open a supported Explorer to visit the SDK7 World.
      </Text>
      <Text style={styles.meta}>
        {projection.onlineDemoCount} demo players online · {projection.scoreboard.roomTitle} · {projection.scoreboard.roomCode}
      </Text>
      <WorldMiniMap feed={feed} />
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enter World"
          onPress={() => void enterWorld()}
          style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>ENTER WORLD</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View on map"
          onPress={() => onViewMap?.()}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>VIEW ON MAP</Text>
        </Pressable>
      </View>
      {world.error ? (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
          {world.error} The 2D companion stays available.
        </Text>
      ) : null}
      <Text style={styles.note}>World preview available. Open in a supported Decentraland Explorer environment.</Text>
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
  body: { color: C.fog, fontSize: 13, lineHeight: 18, marginTop: 6, marginBottom: 8 },
  meta: { color: C.mint, fontSize: 12, fontWeight: "800", marginBottom: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  button: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.mint,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  primary: { backgroundColor: C.mint },
  buttonText: { color: C.mint, fontSize: 11, fontWeight: "900" },
  primaryText: { color: C.ink, fontSize: 11, fontWeight: "900" },
  error: { color: C.gold, fontSize: 12, lineHeight: 16, marginTop: 10, fontWeight: "800" },
  note: { color: C.fog, fontSize: 11, lineHeight: 15, marginTop: 10, fontWeight: "600" },
  pressed: { opacity: 0.75 },
});
