import { StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";

export function Avatar({
  size = 40,
  uri: _uri,
  name,
}: {
  size?: number;
  uri?: string;
  name: string;
}) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <View
      accessibilityLabel={`${name} avatar`}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: Math.max(12, Math.round(size * 0.36)),
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.42) }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: C.cyan,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    color: C.ink,
    fontWeight: "900",
  },
});
