import { Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { TUTORIAL_MOBILE_CARDS } from "@/shared/copy";

type Props = {
  visible: boolean;
  onSkip: () => void;
  onComplete: () => void;
};

export function MobileTutorial({ visible, onSkip, onComplete }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.card} accessibilityLabel="Friendzone tutorial">
      {TUTORIAL_MOBILE_CARDS.map((card) => (
        <Text key={card.id} style={styles.line}>
          {card.title}
        </Text>
      ))}
      <View style={styles.row}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onSkip} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>SKIP</Text>
        </Pressable>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onComplete} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>GOT IT</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.panel, borderRadius: 22, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  line: { color: C.cloud, fontSize: 16, fontWeight: "900", marginTop: 8 },
  row: { flexDirection: "column", gap: 8, marginTop: 14 },
  primary: { minHeight: 44, width: "100%", borderRadius: 14, backgroundColor: C.mint, alignItems: "center", justifyContent: "center" },
  primaryText: { color: C.ink, fontWeight: "900" },
  secondary: { minHeight: 44, width: "100%", borderRadius: 14, borderWidth: 1, borderColor: C.mint, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: C.mint, fontWeight: "900" },
  pressed: { opacity: 0.8 },
});
