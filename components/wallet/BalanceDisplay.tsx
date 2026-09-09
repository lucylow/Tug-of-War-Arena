import { StyleSheet, Text, View } from "react-native";

import { NetworkGlyph } from "@/components/wallet/NetworkGlyph";
import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useBlockchain } from "@/hooks/use-blockchain";
import { formatBalance, getNativeSymbol, getNetworkName } from "@/lib/web3/format";

export function BalanceDisplay() {
  const { account, balance, isConnected, connectionMode, chainId } = useBlockchain();
  const networkName = getNetworkName(chainId);

  if (!isConnected || !account) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>WALLET BALANCE</Text>
        <Text style={styles.muted}>Connect to preview live funds</Text>
      </View>
    );
  }

  if (connectionMode === "demo") {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <NetworkGlyph chainId={chainId} />
          <Text style={styles.label}>{networkName.toUpperCase()} · DEMO</Text>
        </View>
        <Text style={styles.balance}>Local receipt ready</Text>
        <Text style={styles.muted}>No on-chain balance until MetaMask is live</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <NetworkGlyph chainId={chainId} />
        <Text style={styles.label}>{networkName.toUpperCase()}</Text>
      </View>
      <Text style={styles.balance}>
        {formatBalance(balance)} {getNativeSymbol(chainId)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#1A1F4A",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FFC85733",
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { color: C.fog, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  balance: { color: C.gold, fontSize: 22, fontWeight: "900", marginTop: 6, letterSpacing: -0.6 },
  muted: { color: C.fog, fontSize: 11, marginTop: 4, fontWeight: "700" },
});
