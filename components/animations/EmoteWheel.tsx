import { memo, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

import { ARENA_EMOTES, ARENA_COLORS, SPRING_SOFT, withAlpha } from "@/lib/animations";

export interface EmoteWheelProps {
  visible: boolean;
  onSelect: (emote: string) => void;
  onClose: () => void;
  reduceMotion?: boolean;
}

export const EmoteWheel = memo(function EmoteWheel({
  visible,
  onSelect,
  onClose,
  reduceMotion = false,
}: EmoteWheelProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scale = useSharedValue(visible && reduceMotion ? 1 : 0);
  const opacity = useSharedValue(visible && reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = visible ? 1 : 0;
      opacity.value = visible ? 1 : 0;
      return;
    }
    if (visible) {
      scale.value = withSpring(1, SPRING_SOFT);
      opacity.value = withTiming(1, { duration: 240 });
    } else {
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [opacity, reduceMotion, scale, visible]);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Animated.View style={[styles.wheel, wheelStyle]}>
        <View style={styles.grid}>
          {ARENA_EMOTES.map((emote, index) => (
            <Pressable
              key={`${emote}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`Send ${emote} emote`}
              style={[styles.emoteButton, selectedIndex === index && styles.selected]}
              onPress={() => {
                setSelectedIndex(index);
                onSelect(emote);
                onClose();
              }}
            >
              <Text style={styles.emoji}>{emote}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close emote wheel">
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ARENA_COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 40,
  },
  wheel: {
    backgroundColor: ARENA_COLORS.panel,
    borderRadius: 20,
    padding: 16,
    width: "85%",
    maxWidth: 400,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  emoteButton: {
    width: "20%",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  selected: {
    backgroundColor: withAlpha(ARENA_COLORS.teamBlue, "44"),
  },
  emoji: { fontSize: 32 },
  closeButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: ARENA_COLORS.midnight,
    borderRadius: 8,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  closeText: { color: ARENA_COLORS.cloud, fontSize: 16, fontWeight: "700" },
});
