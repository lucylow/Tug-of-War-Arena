import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ARENA_COLORS } from "@/lib/animations";
import { COMPANION_RENDER_BUDGET, windowSlice } from "@/lib/mobile-ux";

export interface RoomPreviewItem {
  id: string;
  name: string;
  players: number;
  status: string;
}

export const RoomPreviewList = memo(function RoomPreviewList({
  rooms,
  onJoin,
  windowSize = COMPANION_RENDER_BUDGET.roomPreviewWindow,
}: {
  rooms: RoomPreviewItem[];
  onJoin?: (id: string) => void;
  windowSize?: number;
}) {
  const data = useMemo(() => windowSlice(rooms, 0, windowSize), [rooms, windowSize]);

  return (
    <View style={styles.wrap}>
      {data.map((room) => (
        <Pressable
          key={room.id}
          accessibilityRole="button"
          accessibilityLabel={`Join ${room.name}, ${room.players} players, ${room.status}`}
          onPress={() => onJoin?.(room.id)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.copy}>
            <Text style={styles.name}>{room.name}</Text>
            <Text style={styles.meta}>
              {room.players} in room · {room.status}
            </Text>
          </View>
          <Text style={styles.cta}>JOIN</Text>
        </Pressable>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  card: {
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: ARENA_COLORS.panel,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  copy: { flex: 1 },
  name: { color: ARENA_COLORS.cloud, fontWeight: "800", fontSize: 15 },
  meta: { color: ARENA_COLORS.fog, fontSize: 12, marginTop: 2 },
  cta: { color: ARENA_COLORS.primary, fontWeight: "900", letterSpacing: 1 },
  pressed: { opacity: 0.82 },
});
