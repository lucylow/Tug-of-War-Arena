import { StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import type { PresenceStatus } from "@/lib/social/types";

const STATUS_COLOR: Record<PresenceStatus, string> = {
  online: C.mint,
  "in-game": C.cyan,
  away: C.gold,
  offline: C.fog,
};

export function Badge({
  status,
  label,
  color,
}: {
  status?: PresenceStatus;
  label?: string;
  color?: string;
}) {
  const tone = color ?? (status ? STATUS_COLOR[status] : C.gold);
  const text = label ?? status ?? "";
  if (!text) return null;
  return (
    <View style={[styles.badge, { borderColor: tone, backgroundColor: `${tone}22` }]}>
      {status ? <View style={[styles.dot, { backgroundColor: tone }]} /> : null}
      <Text style={[styles.label, { color: tone }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "capitalize",
  },
});
