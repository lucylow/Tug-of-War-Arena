import { Pressable, StyleSheet, Text } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";

export function Button({
  title,
  onPress,
  type = "primary",
  disabled = false,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  type?: "primary" | "secondary";
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const primary = type === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={primary ? styles.primaryText : styles.secondaryText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  primary: {
    backgroundColor: C.gold,
  },
  secondary: {
    borderWidth: 1,
    borderColor: C.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  primaryText: {
    color: C.ink,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  secondaryText: {
    color: C.cloud,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
