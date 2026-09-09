import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { DemoModeManager } from "@/lib/mock/DemoModeManager";

export function DemoModeToggle() {
  const manager = DemoModeManager.getInstance();
  const [enabled, setEnabled] = useState(manager.isActive());

  useEffect(() => manager.subscribe(() => setEnabled(manager.isActive())), [manager]);

  const toggle = (next: boolean) => {
    if (next) manager.enable();
    else manager.disable();
    setEnabled(manager.isActive());
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Demo Mode</Text>
        <Text style={styles.subLabel}>
          {enabled
            ? `Seeded mock world (seed ${manager.getSeed()})`
            : "Live MetaMask when connected; otherwise empty chain data"}
        </Text>
      </View>
      <Switch
        accessibilityLabel="Toggle demo mode"
        value={enabled}
        onValueChange={toggle}
        trackColor={{ false: C.border, true: C.cyan }}
        thumbColor={enabled ? C.cloud : C.fog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1F4A",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4DE7F233",
    marginTop: 12,
    marginBottom: 8,
    gap: 12,
  },
  content: { flex: 1 },
  label: { color: C.cloud, fontSize: 13, fontWeight: "800" },
  subLabel: { color: C.fog, fontSize: 11, marginTop: 4, fontWeight: "700" },
});
