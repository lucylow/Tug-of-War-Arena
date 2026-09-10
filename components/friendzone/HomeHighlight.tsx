import { Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { MOBILE_COPY } from "@/shared/copy";
import { matchFixture } from "@/shared/fixtures/matchFixture";
import { missionFixture } from "@/shared/fixtures/missionFixture";
import { roomFixture } from "@/shared/fixtures/roomFixture";

type Props = {
  onPlay?: () => void;
  onEnterWorld?: () => void;
};

export function HomeHighlight({ onPlay, onEnterWorld }: Props) {
  const mission = missionFixture[0];
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>FRIENDZONE</Text>
      <Text style={styles.meta}>Crew: 7 online</Text>
      <Text style={styles.meta}>Arena: Active · {roomFixture.featured.title}</Text>
      <Text style={styles.meta}>3D World: Ready</Text>
      <Text style={styles.meta}>
        Mission: {mission?.progress}/{mission?.target}
      </Text>
      <Text style={styles.meta}>Streak: {matchFixture.streak}</Text>
      <Text style={styles.score}>
        {matchFixture.playerPulls} vs {matchFixture.opponentPulls}
      </Text>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onPlay} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>{MOBILE_COPY.play}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onEnterWorld} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>{MOBILE_COPY.enterWorld}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.panel, borderRadius: 22, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  kicker: { color: C.gold, fontSize: 12, fontWeight: "900", letterSpacing: 1.4 },
  meta: { color: C.cloud, fontSize: 14, fontWeight: "700", marginTop: 6 },
  score: { color: C.mint, fontSize: 20, fontWeight: "900", marginTop: 10 },
  row: { flexDirection: "row", gap: 8, marginTop: 14 },
  primary: { minHeight: 44, flex: 1, borderRadius: 14, backgroundColor: C.mint, alignItems: "center", justifyContent: "center" },
  primaryText: { color: C.ink, fontWeight: "900" },
  secondary: { minHeight: 44, flex: 1, borderRadius: 14, borderWidth: 1, borderColor: C.mint, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: C.mint, fontWeight: "900" },
  pressed: { opacity: 0.8 },
});
