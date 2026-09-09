import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ARENA_COLORS } from "@/lib/animations";
import type { MobileNoticeItem } from "@/lib/mobile-ux";

const KIND_COLOR: Record<MobileNoticeItem["kind"], string> = {
  info: ARENA_COLORS.teamBlue,
  success: ARENA_COLORS.mint,
  warning: ARENA_COLORS.primary,
  error: ARENA_COLORS.error,
};

export const MobileNotice = memo(function MobileNotice({
  notice,
  onDismiss,
}: {
  notice: MobileNoticeItem;
  onDismiss?: (id: string) => void;
}) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={notice.message}
      style={[styles.row, { borderLeftColor: KIND_COLOR[notice.kind] }]}
    >
      <Text style={styles.message}>{notice.message}</Text>
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss notice"
          onPress={() => onDismiss(notice.id)}
          style={styles.close}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: ARENA_COLORS.panel,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 4,
    minHeight: 44,
  },
  message: { flex: 1, color: ARENA_COLORS.cloud, fontWeight: "700", fontSize: 13 },
  close: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  closeText: { color: ARENA_COLORS.fog, fontSize: 16 },
});
