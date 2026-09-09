import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { NetworkGlyph } from "@/components/wallet/NetworkGlyph";
import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useBlockchain } from "@/hooks/use-blockchain";
import { useToken } from "@/hooks/use-token";
import { FZONE_ENTRY_FEE_LABEL } from "@/lib/web3/addresses";
import { DEFAULT_CHAIN_ID, getExplorerAddressUrl } from "@/lib/web3/config";
import { formatBalance, getNativeSymbol, getNetworkName } from "@/lib/web3/format";

export function BalanceDisplay() {
  const {
    account,
    balance,
    isConnected,
    chainId,
    isLiveWallet,
    canUseLiveGame,
    ensureCorrectNetwork,
  } = useBlockchain();
  const { balance: tokenBalance, canReadLive, refresh } = useToken();
  const networkName = getNetworkName(chainId);
  const [switching, setSwitching] = useState(false);
  const explorerUrl = getExplorerAddressUrl(chainId, account);

  useEffect(() => {
    void refresh();
  }, [account, chainId, refresh]);

  if (!isConnected || !account) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>WALLET BALANCE</Text>
        <Text style={styles.muted}>Connect to preview live funds</Text>
      </View>
    );
  }

  if (!isLiveWallet) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <NetworkGlyph chainId={chainId} />
          <Text style={styles.label}>{networkName.toUpperCase()} · DEMO</Text>
        </View>
        <Text style={styles.balance}>{formatBalance(String(tokenBalance ?? 0), 0)} FZONE</Text>
        <Text style={styles.muted}>Seeded local balance. Live POL waits on MetaMask.</Text>
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
      {canReadLive ? (
        <Text style={styles.token}>
          {formatBalance(tokenBalance, 2)} FZONE · {FZONE_ENTRY_FEE_LABEL} entry
        </Text>
      ) : (
        <Text style={styles.muted}>FZONE is not deployed on this network yet.</Text>
      )}
      {!canUseLiveGame ? (
        <Pressable
          accessibilityRole="button"
          disabled={switching}
          onPress={() => {
            setSwitching(true);
            void ensureCorrectNetwork(DEFAULT_CHAIN_ID).finally(() => setSwitching(false));
          }}
          style={({ pressed }) => [styles.switch, pressed && styles.pressed]}
        >
          <Text style={styles.switchText}>{switching ? "SWITCHING…" : "SWITCH TO ARENA NETWORK"}</Text>
        </Pressable>
      ) : null}
      {explorerUrl ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(explorerUrl);
          }}
        >
          <Text style={styles.muted}>View account on explorer</Text>
        </Pressable>
      ) : null}
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
  token: { color: C.cloud, fontSize: 12, marginTop: 4, fontWeight: "800" },
  muted: { color: C.fog, fontSize: 11, marginTop: 4, fontWeight: "700" },
  switch: {
    marginTop: 10,
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  switchText: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  pressed: { opacity: 0.78 },
});
