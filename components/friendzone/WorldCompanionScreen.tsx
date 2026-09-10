import { Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { WORLD_COPY, MOBILE_COPY } from "@/shared/copy";
import { eventFixture } from "@/shared/fixtures/eventFixture";
import { missionFixture } from "@/shared/fixtures/missionFixture";
import { proposalFixture } from "@/shared/fixtures/proposalFixture";
import { playerFixture } from "@/shared/fixtures/playerFixture";
import { FriendzoneMiniMap } from "@/components/world/FriendzoneMiniMap";
import { WorldEntryFlow } from "@/components/world/WorldEntryFlow";
import { onPrimaryPress } from "@/lib/world/touchFeedback";

type Props = {
  onEnterWorld?: () => void;
  onOpenBlockchain?: () => void;
  onOpenGovernance?: () => void;
};

export function WorldCompanionScreen({ onEnterWorld, onOpenBlockchain, onOpenGovernance }: Props) {
  return (
    <View>
      <WorldEntryFlow onEnter={onEnterWorld} />
      <View style={styles.card}>
        <Text style={styles.kicker}>{WORLD_COPY.friendzoneWorld}</Text>
        <Text style={styles.title}>{WORLD_COPY.socialArena}</Text>
        <FriendzoneMiniMap
          players={[{ id: playerFixture.local.id, position: playerFixture.local.spawn, color: "#F4A261", label: "You" }]}
        />
        <Text style={styles.section}>PLAYERS · ROOMS · EVENTS · MISSIONS</Text>
        <Text style={styles.body}>{eventFixture[0]?.title} · {missionFixture[0]?.title} 84/100</Text>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => { onPrimaryPress(); onOpenGovernance?.(); }} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
          <Text style={styles.linkText}>{MOBILE_COPY.governance} · {proposalFixture[0]?.title}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => { onPrimaryPress(); onOpenBlockchain?.(); }} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
          <Text style={styles.linkText}>WEB3 · DEMO PROOF</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.panel, borderRadius: 22, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  kicker: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: C.cloud, fontSize: 18, fontWeight: "900", marginTop: 6, marginBottom: 10 },
  section: { color: C.mint, fontSize: 10, fontWeight: "900", marginTop: 12 },
  body: { color: C.fog, fontSize: 13, marginTop: 6 },
  link: { minHeight: 44, justifyContent: "center" },
  linkText: { color: C.mint, fontWeight: "900" },
  pressed: { opacity: 0.75 },
});
