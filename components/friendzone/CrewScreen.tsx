import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { MOBILE_COPY } from "@/shared/copy";
import { roomFixture } from "@/shared/fixtures/roomFixture";
import { FRIENDZONE_WORLD_IDENTITY } from "@/shared/worldIdentity";
import { onPrimaryPress } from "@/lib/world/touchFeedback";
import { buildWorldInvite } from "@/lib/world/invite";

export function formatCrewInvite(roomCode = roomFixture.featured.code): string {
  return `Join me in ${FRIENDZONE_WORLD_IDENTITY.worldTitle} — Room ${roomCode}.`;
}

export function CrewScreen({
  onEnterWorld,
  onPlay,
}: {
  onEnterWorld?: () => void;
  onPlay?: () => void;
}) {
  const room = roomFixture.featured;

  const share = async () => {
    onPrimaryPress();
    const message = formatCrewInvite(room.code);
    try {
      await Share.share({ message });
    } catch {
      try {
        await Clipboard.setStringAsync(buildWorldInvite(room.code)?.href ?? message);
      } catch {
        // Share/copy failure stays on the card.
      }
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>CREW</Text>
      <Text style={styles.title}>{room.title}</Text>
      <Text style={styles.meta}>{room.code} · {room.players}/{room.maxPlayers}</Text>
      <Text style={styles.body}>Online players · Reactions · Mission · Leaderboard</Text>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onPlay} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>{MOBILE_COPY.play}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onEnterWorld} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>{MOBILE_COPY.enterWorld}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => void share()} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>{MOBILE_COPY.inviteCrew}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.panel, borderRadius: 22, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  kicker: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: C.cloud, fontSize: 22, fontWeight: "900", marginTop: 6 },
  meta: { color: C.mint, fontSize: 13, fontWeight: "800", marginTop: 6 },
  body: { color: C.fog, fontSize: 13, marginTop: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  primary: { minHeight: 44, borderRadius: 14, backgroundColor: C.mint, paddingHorizontal: 14, justifyContent: "center" },
  primaryText: { color: C.ink, fontWeight: "900" },
  secondary: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: C.mint, paddingHorizontal: 12, justifyContent: "center" },
  secondaryText: { color: C.mint, fontWeight: "900" },
  pressed: { opacity: 0.8 },
});
