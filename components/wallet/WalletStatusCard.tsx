import { Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useBlockchain } from "@/hooks/use-blockchain";
import { WALLET_UNAVAILABLE_MESSAGE } from "@/lib/blockchain";
import { formatAddress } from "@/lib/web3/format";

const LEARN_MORE_COPY =
  "The native Decentraland Explorer does not run on phones today. This app is the mobile companion. Wallet connection is optional and never required to play.";

export function WalletStatusCard() {
  const { account, isConnected, isConnecting, connectionMode, walletState, walletError, connect, continueDemo } =
    useBlockchain();

  const status = (() => {
    if (isConnecting || walletState === "connecting") return "CONNECTING";
    if (walletState === "wrong-network") return "WRONG NETWORK";
    if (walletState === "unsupported") return "UNAVAILABLE";
    if (walletState === "error" || walletState === "rejected") return "ERROR";
    if (isConnected && connectionMode === "live") return "CONNECTED";
    if (isConnected && connectionMode === "demo") return "DEMO";
    return "NOT CONNECTED";
  })();

  const body =
    walletError?.message ??
    (status === "UNAVAILABLE"
      ? WALLET_UNAVAILABLE_MESSAGE
      : status === "DEMO"
        ? "Demo identity only. Web3 is optional in this demo."
        : status === "CONNECTED" && account
          ? formatAddress(account)
          : "Web3 is optional in this demo.");

  return (
    <View accessibilityRole="summary" accessibilityLabel={`Wallet status ${status}`} style={styles.card}>
      <Text style={styles.kicker}>WALLET</Text>
      <Text style={styles.title}>{status}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try wallet connection again"
          onPress={() => {
            void connect({ mode: "auto" }).catch(() => undefined);
          }}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>TRY AGAIN</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue in demo mode"
          onPress={() => {
            void continueDemo().catch(() => undefined);
          }}
          style={({ pressed }) => [styles.button, styles.demo, pressed && styles.pressed]}
        >
          <Text style={styles.demoText}>CONTINUE DEMO</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Learn more about optional wallets"
          onPress={() => undefined}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>LEARN MORE</Text>
        </Pressable>
      </View>
      <Text style={styles.note}>{LEARN_MORE_COPY}</Text>
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
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  demo: { backgroundColor: C.mint, borderColor: C.mint },
  buttonText: { color: C.fog, fontSize: 11, fontWeight: "900" },
  demoText: { color: C.ink, fontSize: 11, fontWeight: "900" },
  note: { color: C.fog, fontSize: 11, lineHeight: 15, marginTop: 10, fontWeight: "600" },
  pressed: { opacity: 0.75 },
});
