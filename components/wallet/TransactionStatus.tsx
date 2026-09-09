import { StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { formatAddress } from "@/lib/web3/format";
import type { WalletTxStatus } from "@/lib/web3/types";

type TransactionStatusProps = {
  status: WalletTxStatus;
  hash?: string | null;
  error?: string | null;
};

export function TransactionStatus({ status, hash, error }: TransactionStatusProps) {
  if (status === "idle") return null;

  const label =
    status === "pending"
      ? "Transaction pending in MetaMask"
      : status === "success"
        ? `Confirmed ${hash ? formatAddress(hash) : ""}`.trim()
        : error ?? "Transaction failed";

  return (
    <View
      style={[
        styles.container,
        status === "error" ? styles.error : status === "success" ? styles.success : styles.info,
      ]}
      accessibilityRole="summary"
    >
      <View style={[styles.dot, status === "error" ? styles.dotError : status === "success" ? styles.dotSuccess : styles.dotInfo]} />
      <Text style={[styles.text, status === "error" ? styles.errorText : status === "success" ? styles.successText : styles.infoText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  info: { backgroundColor: "#202557", borderColor: C.gold },
  success: { backgroundColor: "#14352C", borderColor: C.mint },
  error: { backgroundColor: "#3A1D32", borderColor: C.coral },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotInfo: { backgroundColor: C.gold },
  dotSuccess: { backgroundColor: C.mint },
  dotError: { backgroundColor: C.coral },
  text: { flex: 1, fontSize: 12, fontWeight: "700" },
  infoText: { color: C.gold },
  successText: { color: C.mint },
  errorText: { color: C.coral },
});
