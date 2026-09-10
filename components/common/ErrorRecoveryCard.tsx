import { Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";

type Props = {
  title: string;
  message: string;
  retry?: () => void;
  secondaryAction?: { label: string; onPress: () => void };
};

export function ErrorRecoveryCard({ title, message, retry, secondaryAction }: Props) {
  return (
    <View accessibilityRole="alert" style={styles.card}>
      <Text style={styles.kicker}>SOMETHING WENT WRONG</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{message}</Text>
      <View style={styles.actions}>
        {retry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try again"
            onPress={retry}
            style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>TRY AGAIN</Text>
          </Pressable>
        ) : null}
        {secondaryAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={secondaryAction.label}
            onPress={secondaryAction.onPress}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>{secondaryAction.label.toUpperCase()}</Text>
          </Pressable>
        ) : null}
      </View>
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
    minHeight: 48,
    minWidth: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  primary: { backgroundColor: C.mint, borderColor: C.mint },
  buttonText: { color: C.fog, fontSize: 11, fontWeight: "900" },
  primaryText: { color: C.ink, fontSize: 11, fontWeight: "900" },
  pressed: { opacity: 0.8 },
});
