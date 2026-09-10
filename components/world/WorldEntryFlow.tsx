import { Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { FRIENDZONE_WORLD_IDENTITY } from "@/shared/worldIdentity";
import { WORLD_COPY, MOBILE_COPY } from "@/shared/copy";
import { roomFixture } from "@/shared/fixtures/roomFixture";
import { missionFixture } from "@/shared/fixtures/missionFixture";
import { onPrimaryPress, onSecondaryPress } from "@/lib/world/touchFeedback";

export type WorldEntryState =
  | "WORLD DISCOVERY"
  | "WORLD READY"
  | "OPENING WORLD"
  | "EXTERNAL APP REQUIRED"
  | "DEMO WORLD"
  | "ERROR";

type Props = {
  state?: WorldEntryState;
  onlinePlayers?: number;
  onEnter?: () => void | Promise<void>;
  onRetry?: () => void;
  onContinueMobile?: () => void;
};

export function WorldEntryFlow({
  state = "WORLD READY",
  onlinePlayers = 7,
  onEnter,
  onRetry,
  onContinueMobile,
}: Props) {
  const mission = missionFixture[0];
  const blocked = state === "ERROR" || state === "EXTERNAL APP REQUIRED";

  return (
    <View accessibilityLabel="Friendzone World entry" style={styles.card}>
      <Text style={styles.kicker}>{FRIENDZONE_WORLD_IDENTITY.worldTitle}</Text>
      <Text style={styles.title}>{WORLD_COPY.friendzoneWorld}</Text>
      <Text style={styles.subtitle}>{WORLD_COPY.socialArena}</Text>
      <Text style={styles.meta}>Players: {onlinePlayers} online</Text>
      <Text style={styles.meta}>Room: {roomFixture.featured.title}</Text>
      <Text style={styles.meta}>
        Mission: {mission?.progress}/{mission?.target}
      </Text>
      <Text accessibilityLiveRegion="polite" style={styles.state}>
        {state}
      </Text>
      {!blocked ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={WORLD_COPY.enterWorld}
          hitSlop={12}
          onPress={() => {
            onPrimaryPress();
            void onEnter?.();
          }}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>{WORLD_COPY.enterWorld}</Text>
        </Pressable>
      ) : (
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry"
            hitSlop={12}
            onPress={() => {
              onPrimaryPress();
              onRetry?.();
            }}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>RETRY</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue mobile"
            hitSlop={12}
            onPress={() => {
              onSecondaryPress();
              onContinueMobile?.();
            }}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryText}>CONTINUE MOBILE</Text>
          </Pressable>
        </View>
      )}
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
  kicker: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: C.cloud, fontSize: 22, fontWeight: "900", marginTop: 6 },
  subtitle: { color: C.fog, fontSize: 13, fontWeight: "800", marginTop: 4 },
  meta: { color: C.cloud, fontSize: 14, fontWeight: "700", marginTop: 6 },
  state: { color: C.mint, fontSize: 11, fontWeight: "800", marginTop: 10 },
  primary: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: C.mint,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  primaryText: { color: C.ink, fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  secondary: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.mint,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  secondaryText: { color: C.mint, fontSize: 11, fontWeight: "900" },
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
