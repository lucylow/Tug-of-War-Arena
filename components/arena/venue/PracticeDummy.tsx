import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { formatPracticeDummyPresentation, hitPracticeDummy } from "@/lib/venue";

type PracticeDummyProps = {
  teamColor?: string;
  reduceMotion?: boolean;
};

export function PracticeDummy({ teamColor = C.coral, reduceMotion = false }: PracticeDummyProps) {
  const [hits, setHits] = useState(0);
  const presentation = formatPracticeDummyPresentation(hits);
  const glow = Math.min(1, 0.28 + hits * 0.07);

  const handleHit = () => {
    const next = hitPracticeDummy(hits);
    setHits(next.hits);
    if (!reduceMotion) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={presentation.label}
      accessibilityHint={presentation.hint}
      accessibilityValue={{ min: 0, now: hits, text: presentation.meta }}
      onPress={handleHit}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, { borderColor: teamColor }]}
    >
      <View style={[styles.orb, { backgroundColor: teamColor, opacity: 0.35 + glow * 0.65 }]}>
        <View style={styles.head} />
        <View style={styles.body} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.kicker}>{presentation.title}</Text>
        <Text style={styles.title}>{presentation.hoverText}</Text>
        <Text accessibilityLiveRegion="polite" style={styles.meta}>
          {presentation.meta}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: C.midnight,
    borderWidth: 1.5,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  orb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  head: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.cloud,
    marginBottom: 3,
  },
  body: {
    width: 16,
    height: 14,
    borderRadius: 6,
    backgroundColor: C.ink,
  },
  copy: {
    flex: 1,
  },
  kicker: {
    color: C.fog,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: C.cloud,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  meta: {
    color: C.fog,
    fontSize: 12,
    marginTop: 2,
  },
});
