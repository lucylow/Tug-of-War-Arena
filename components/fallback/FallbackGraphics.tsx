import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ARENA_COLORS, SPACING, TYPOGRAPHY } from "@/lib/animations";
import { graphicsErrorCopy } from "@/lib/graphics";
import { useGraphicsQualityManager } from "@/hooks/useGraphicsQualityManager";

interface FallbackGraphicsProps {
  onRetry?: () => void;
  message?: string;
}

export const FallbackGraphics: React.FC<FallbackGraphicsProps> = ({
  onRetry,
  message = graphicsErrorCopy.fallbackMessage,
}) => {
  const { currentLevel, config } = useGraphicsQualityManager();

  return (
    <View style={styles.container} accessibilityRole="alert" accessibilityLabel={graphicsErrorCopy.fallbackTitle}>
      <Text style={styles.icon}>🖼️</Text>
      <Text style={styles.title}>{graphicsErrorCopy.fallbackTitle}</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.detail}>
        Quality: {currentLevel} | Particles: {config.particleCount}
      </Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={graphicsErrorCopy.retryLabel}
          onPress={onRetry}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{graphicsErrorCopy.retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
    backgroundColor: ARENA_COLORS.ink,
    minHeight: 180,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { ...TYPOGRAPHY.h2, color: ARENA_COLORS.cloud, marginBottom: 8 },
  message: {
    ...TYPOGRAPHY.body,
    color: ARENA_COLORS.fog,
    textAlign: "center",
    marginBottom: 8,
  },
  detail: { ...TYPOGRAPHY.caption, color: ARENA_COLORS.fog, marginBottom: 16 },
  button: {
    backgroundColor: ARENA_COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  buttonText: { ...TYPOGRAPHY.button, color: ARENA_COLORS.ink },
  pressed: { opacity: 0.8 },
});
