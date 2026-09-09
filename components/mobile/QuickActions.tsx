import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ARENA_COLORS } from "@/lib/animations";
import { QUICK_ACTION_SIZE } from "@/lib/mobile-ux";

export interface QuickAction {
  key: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export const MobileQuickActions = memo(function MobileQuickActions({
  actions,
}: {
  actions: QuickAction[];
}) {
  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityState={{ disabled: action.disabled }}
          disabled={action.disabled}
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.chip,
            action.disabled && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.label}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: QUICK_ACTION_SIZE,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: ARENA_COLORS.panel,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4DE7F233",
  },
  label: { color: ARENA_COLORS.cloud, fontWeight: "800", fontSize: 12, letterSpacing: 0.4 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
});
