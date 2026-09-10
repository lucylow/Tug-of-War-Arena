import * as Linking from "expo-linking";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { WORLD_COPY, MOBILE_COPY } from "@/shared/copy";
import { proposalFixture } from "@/shared/fixtures/proposalFixture";
import { DAO_OFFICIAL_URL } from "@/shared/proposal";
import { onPrimaryPress } from "@/lib/world/touchFeedback";

export function GovernanceScreen() {
  const proposal = proposalFixture[0]!;
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{MOBILE_COPY.governance}</Text>
      <Text style={styles.title}>PROPOSAL</Text>
      <Text style={styles.body}>{proposal.title}</Text>
      <Text style={styles.meta}>STAGE {proposal.stage.toUpperCase()}</Text>
      <Text style={styles.meta}>STATUS {proposal.status.toUpperCase()}</Text>
      <Text style={styles.meta}>DISCUSSION</Text>
      <Text style={styles.note}>{WORLD_COPY.continueOfficialDao}</Text>
      <Pressable
        accessibilityRole="button"
        hitSlop={12}
        onPress={() => {
          onPrimaryPress();
          void Linking.openURL(proposal.officialUrl || DAO_OFFICIAL_URL);
        }}
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
      >
        <Text style={styles.primaryText}>OPEN OFFICIAL DAO</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.panel, borderRadius: 22, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  kicker: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: C.cloud, fontSize: 18, fontWeight: "900", marginTop: 6 },
  body: { color: C.cloud, fontSize: 15, fontWeight: "700", marginTop: 8 },
  meta: { color: C.fog, fontSize: 12, fontWeight: "800", marginTop: 6 },
  note: { color: C.mint, fontSize: 13, marginTop: 10 },
  primary: { minHeight: 44, borderRadius: 14, backgroundColor: C.mint, alignItems: "center", justifyContent: "center", marginTop: 14 },
  primaryText: { color: C.ink, fontWeight: "900" },
  pressed: { opacity: 0.8 },
});
