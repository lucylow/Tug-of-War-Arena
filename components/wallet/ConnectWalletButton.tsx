import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { WalletMark } from "@/components/wallet/WalletMark";
import { useBlockchain } from "@/hooks/use-blockchain";
import { normalizeWalletError } from "@/lib/blockchain/wallet/errors";
import { classifyWalletError, formatWalletErrorTitle } from "@/lib/web3/errors";
import { formatWalletModeBadge } from "@/lib/web3/format";
import type { ConnectionMode, ConnectModeRequest } from "@/lib/web3/types";

type ConnectWalletButtonProps = {
  mode?: ConnectModeRequest;
  compact?: boolean;
  onStatus?: (status: { connected: boolean; mode: ConnectionMode | null; message: string }) => void;
};

export function ConnectWalletButton({ mode = "auto", compact = false, onStatus }: ConnectWalletButtonProps) {
  const { account, isConnected, isConnecting, connectionMode, connect, continueDemo, disconnect, formatAddress } = useBlockchain();
  const live = connectionMode === "live";

  const handlePress = async () => {
    try {
      if (isConnected) {
        Alert.alert("Disconnect Wallet", "Are you sure you want to disconnect?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disconnect",
            style: "destructive",
            onPress: () => {
              void disconnect()
                .then(() => {
                  onStatus?.({ connected: false, mode: null, message: "Wallet disconnected. Offline play remains available." });
                })
                .catch((error) => {
                  const normalized = normalizeWalletError(error);
                  Alert.alert(formatWalletErrorTitle(error), normalized.message);
                  onStatus?.({ connected: false, mode: null, message: normalized.message });
                });
            },
          },
        ]);
        return;
      }
      const nextMode = await connect({ mode });
      onStatus?.({
        connected: true,
        mode: nextMode,
        message: nextMode === "live" ? "Wallet connected. Local reward receipt is ready." : "Demo wallet connected. Web3 is optional in this demo.",
      });
    } catch (error) {
      const normalized = normalizeWalletError(error);
      if (__DEV__) console.warn("Connect wallet failed:", classifyWalletError(error), normalized, error);
      Alert.alert(formatWalletErrorTitle(error), normalized.message, [
        { text: "Try Again", onPress: () => { void handlePress(); } },
        {
          text: "Continue Demo",
          onPress: () => {
            void continueDemo()
              .then((nextMode) => {
                onStatus?.({ connected: true, mode: nextMode, message: "Demo wallet connected. Web3 is optional in this demo." });
              })
              .catch(() => undefined);
          },
        },
      ]);
      onStatus?.({ connected: false, mode: null, message: normalized.message });
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isConnected && account ? `Wallet connected ${formatAddress(account)}` : "Connect wallet"}
      accessibilityHint={isConnected ? "Disconnects the wallet without changing saved receipts" : "Connects MetaMask when available, or a local demo wallet"}
      accessibilityState={{ selected: isConnected, busy: isConnecting }}
      onPress={() => {
        void handlePress();
      }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        isConnected && (live ? styles.live : styles.connected),
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.markWrap, isConnected && styles.markWrapOn]}>
        {isConnecting ? (
          <ActivityIndicator size="small" color={C.gold} />
        ) : (
          <WalletMark size={compact ? 22 : 26} connected={isConnected} live={live} />
        )}
      </View>
      <View style={styles.copy}>
        <Text style={styles.text}>
          {isConnecting ? "CONNECTING..." : isConnected && account ? formatAddress(account) : "CONNECT WALLET"}
        </Text>
        {!compact && (
          <Text style={styles.hint}>{isConnected ? (live ? "MetaMask session" : "DEMO identity") : "Web3 optional"}</Text>
        )}
      </View>
      <View style={[styles.badge, live && styles.badgeLive, isConnected && !live && styles.badgeDemo]}>
        <Text style={[styles.mode, live && styles.modeLive]}>{isConnecting ? "WAIT" : formatWalletModeBadge(isConnected, connectionMode)}</Text>
      </View>
      {isConnected && <MaterialIcons name="expand-more" size={16} color={C.fog} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 10,
    backgroundColor: "#1A1F4A",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#4DE7F233",
    shadowColor: "#4DE7F2",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  compact: {
    alignSelf: "flex-start",
    marginBottom: 0,
    paddingVertical: 8,
  },
  connected: {
    borderColor: "#72F2B666",
    shadowColor: "#72F2B6",
  },
  live: {
    borderColor: "#F6851B88",
    shadowColor: "#F6851B",
  },
  markWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#11142B",
  },
  markWrapOn: {
    backgroundColor: "#0E1230",
  },
  copy: { flex: 1, minWidth: 0 },
  text: {
    color: C.cloud,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  hint: {
    color: C.fog,
    fontSize: 10,
    marginTop: 2,
    fontWeight: "700",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#252A5E",
  },
  badgeLive: { backgroundColor: "#F6851B22" },
  badgeDemo: { backgroundColor: "#72F2B622" },
  mode: {
    color: C.fog,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  modeLive: { color: C.gold },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
