import { Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { MOBILE_COPY } from "@/shared/copy";
import { formatAddress } from "@/lib/web3/format";
import { proofDisplayLabel } from "@/shared/proof";
import { copyWalletAddress } from "@/lib/wallet/clipboard";
import { onPrimaryPress, onSecondaryPress } from "@/lib/world/touchFeedback";

type Props = {
  address?: string | null;
  connected?: boolean;
  demo?: boolean;
  proofs?: number;
  onConnect?: () => void;
  onContinueDemo?: () => void;
};

export function BlockchainScreen({
  address,
  connected,
  demo = true,
  proofs = 2,
  onConnect,
  onContinueDemo,
}: Props) {
  const compact = address ? formatAddress(address) : "Not connected";
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>WEB3</Text>
      <Text style={styles.title}>Wallet: {connected ? compact : "Not connected"}</Text>
      <Text style={styles.meta}>Network: {connected && !demo ? "Configured" : "—"}</Text>
      <Text style={styles.meta}>Match proofs: {proofs} demo</Text>
      <Text style={styles.badge}>{proofDisplayLabel(demo ? "demo" : "confirmed")}</Text>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => { onPrimaryPress(); onConnect?.(); }} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>{MOBILE_COPY.connectWallet}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => { onSecondaryPress(); onContinueDemo?.(); }} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>{MOBILE_COPY.continueDemo}</Text>
        </Pressable>
      </View>
      {address ? (
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => void copyWalletAddress(address)} style={({ pressed }) => [styles.copy, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>Copy {compact}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.panel, borderRadius: 22, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  kicker: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: C.cloud, fontSize: 18, fontWeight: "900", marginTop: 6 },
  meta: { color: C.fog, fontSize: 13, marginTop: 6 },
  badge: { color: C.gold, fontSize: 12, fontWeight: "800", marginTop: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  primary: { minHeight: 44, borderRadius: 14, backgroundColor: C.gold, paddingHorizontal: 14, justifyContent: "center" },
  primaryText: { color: C.ink, fontWeight: "900" },
  secondary: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: C.mint, paddingHorizontal: 12, justifyContent: "center" },
  secondaryText: { color: C.mint, fontWeight: "900" },
  copy: { minHeight: 44, justifyContent: "center", marginTop: 6 },
  pressed: { opacity: 0.8 },
});
