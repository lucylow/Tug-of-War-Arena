import { memo, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { ARENA_COLORS } from "@/lib/animations";
import { modalA11yProps } from "@/lib/mobile-ux";

export const MobileModal = memo(function MobileModal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const a11y = modalA11yProps(open, title);
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View {...a11y} style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {children}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Close ${title}`}
            onPress={onClose}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <Text style={styles.closeText}>CLOSE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: ARENA_COLORS.overlay,
    justifyContent: "flex-end",
    padding: 16,
  },
  sheet: {
    backgroundColor: ARENA_COLORS.midnight,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  title: { color: ARENA_COLORS.cloud, fontWeight: "900", fontSize: 18 },
  close: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: ARENA_COLORS.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: ARENA_COLORS.cloud, fontWeight: "900", letterSpacing: 1 },
  pressed: { opacity: 0.8 },
});
