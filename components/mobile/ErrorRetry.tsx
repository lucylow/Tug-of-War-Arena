import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ARENA_COLORS } from "@/lib/animations";
import { ICON_CHROME_SIZE } from "@/lib/mobile-ux";

export const MobileErrorRetry = memo(function MobileErrorRetry({
  title = "Couldn't load this surface",
  message = "Check your connection, then try again. Offline play stays available.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry: () => void;
}) {
  return (
    <View accessibilityRole="alert" style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry"
        onPress={onRetry}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>RETRY</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: ARENA_COLORS.midnight,
    borderRadius: 20,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FF6B6B44",
  },
  title: { color: ARENA_COLORS.cloud, fontWeight: "900", fontSize: 16 },
  body: { color: ARENA_COLORS.fog, fontSize: 13, lineHeight: 18 },
  button: {
    marginTop: 6,
    minHeight: ICON_CHROME_SIZE,
    borderRadius: 14,
    backgroundColor: ARENA_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: ARENA_COLORS.ink, fontWeight: "900", letterSpacing: 1 },
  pressed: { opacity: 0.82 },
});
