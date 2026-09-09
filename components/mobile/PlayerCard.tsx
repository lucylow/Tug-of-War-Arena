import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { ARENA_COLORS } from "@/lib/animations";
import { playerCardAvatarSize, type DeviceClass } from "@/lib/mobile-ux";

export interface MobilePlayerCardProps {
  name: string;
  meta: string;
  online?: boolean;
  device?: DeviceClass;
  avatarUrl?: string;
}

export const MobilePlayerCard = memo(function MobilePlayerCard({
  name,
  meta,
  online = false,
  device = "regular",
  avatarUrl,
}: MobilePlayerCardProps) {
  const avatar = playerCardAvatarSize(device);
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${name}, ${online ? "online" : "offline"}, ${meta}`}
      style={styles.row}
    >
      <Avatar size={avatar} name={name} uri={avatarUrl} />
      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <View style={[styles.dot, { backgroundColor: online ? ARENA_COLORS.mint : ARENA_COLORS.fog }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    gap: 10,
    paddingVertical: 8,
  },
  copy: { flex: 1, minWidth: 0 },
  name: { color: ARENA_COLORS.cloud, fontWeight: "800", fontSize: 15 },
  meta: { color: ARENA_COLORS.fog, fontSize: 12, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
