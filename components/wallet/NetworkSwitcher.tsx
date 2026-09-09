import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { NetworkGlyph } from "@/components/wallet/NetworkGlyph";
import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useBlockchain } from "@/hooks/use-blockchain";
import { SUPPORTED_NETWORKS } from "@/lib/web3/config";
import { getNetworkName } from "@/lib/web3/format";

export function NetworkSwitcher() {
  const { chainId, switchNetwork, isConnected, isConnecting } = useBlockchain();
  const [modalVisible, setModalVisible] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSelect = async (networkId: number) => {
    if (networkId === chainId) {
      setModalVisible(false);
      return;
    }
    setSwitching(true);
    try {
      await switchNetwork(networkId);
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Network Switch Failed", error instanceof Error ? error.message : "Failed to switch network.");
    } finally {
      setSwitching(false);
    }
  };

  if (!isConnected) {
    return (
      <View style={styles.disabledContainer}>
        <Text style={styles.disabledText}>No Network</Text>
      </View>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Current network ${getNetworkName(chainId)}`}
        accessibilityHint="Opens the network picker"
        onPress={() => setModalVisible(true)}
        disabled={switching || isConnecting}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <NetworkGlyph chainId={chainId} />
        <Text style={styles.text}>{switching ? "Switching..." : getNetworkName(chainId)}</Text>
      </Pressable>
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalGlow} />
            <Text style={styles.modalKicker}>ARENA RELAY</Text>
            <Text style={styles.modalTitle}>Select Network</Text>
            {SUPPORTED_NETWORKS.map((item) => (
              <Pressable
                key={item.chainId}
                accessibilityRole="button"
                accessibilityState={{ selected: chainId === item.chainId }}
                style={[styles.networkItem, chainId === item.chainId && styles.selectedNetwork]}
                onPress={() => {
                  void handleSelect(item.chainId);
                }}
              >
                <NetworkGlyph chainId={item.chainId} size={22} />
                <View style={styles.networkInfo}>
                  <Text style={styles.networkName}>{item.name}</Text>
                  <Text style={styles.networkSymbol}>{item.nativeCurrency.symbol} · chain {item.chainId}</Text>
                </View>
                {chainId === item.chainId && <Text style={styles.checkmark}>●</Text>}
              </Pressable>
            ))}
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1A1F4A",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8247E555",
  },
  disabledContainer: {
    backgroundColor: C.midnight,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    opacity: 0.5,
  },
  disabledText: { color: C.fog, fontSize: 12, fontWeight: "700" },
  text: { color: C.cloud, fontSize: 12, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(8,10,28,0.78)", justifyContent: "center", alignItems: "center" },
  modalContent: {
    backgroundColor: C.panel,
    borderRadius: 24,
    padding: 20,
    width: "84%",
    maxWidth: 400,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFC85744",
  },
  modalGlow: {
    position: "absolute",
    top: -40,
    left: 40,
    right: 40,
    height: 80,
    backgroundColor: "#FFC857",
    opacity: 0.12,
    borderRadius: 80,
  },
  modalKicker: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, textAlign: "center" },
  modalTitle: { color: C.cloud, fontSize: 22, fontWeight: "900", marginBottom: 14, textAlign: "center", marginTop: 4 },
  networkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: "#1A1F4A",
  },
  selectedNetwork: { backgroundColor: "#FFC85722", borderWidth: 1, borderColor: C.gold },
  networkInfo: { flex: 1 },
  networkName: { color: C.cloud, fontSize: 14, fontWeight: "800" },
  networkSymbol: { color: C.fog, fontSize: 11, marginTop: 2 },
  checkmark: { color: C.gold, fontSize: 16, fontWeight: "900" },
  closeButton: { marginTop: 6, padding: 13, backgroundColor: "#11142B", borderRadius: 14, alignItems: "center" },
  closeText: { color: C.cloud, fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  pressed: { opacity: 0.78 },
});
