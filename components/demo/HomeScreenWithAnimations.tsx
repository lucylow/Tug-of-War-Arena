import { memo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  AnimatedHeart,
  AnimatedToast,
  AudioWaveform,
  ShimmerLoading,
  StaggeredContainer,
  TiltCard,
} from "@/components/animations";
import { AnimatedTap } from "@/components/gestures";
import { ARENA_COLORS, TYPOGRAPHY } from "@/lib/animations";

export const HomeScreenWithAnimations = memo(function HomeScreenWithAnimations() {
  const [toastVisible, setToastVisible] = useState(false);
  const [liked, setLiked] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const handleLikeToggle = (next: boolean) => {
    setLiked(next);
    if (next) setToastVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>⚔️ Tug of War Arena</Text>
        <StaggeredContainer staggerDelayMs={80} visible>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome, Warrior!</Text>
            <Text style={styles.cardDesc}>Pull the rope, defeat your foes, and claim victory!</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily Reward</Text>
            {claiming ? (
              <ShimmerLoading height={44} borderRadius={8} style={styles.shimmer} />
            ) : (
              <AnimatedTap
                onTap={() => {
                  setClaiming(true);
                  setToastVisible(true);
                }}
              >
                <View style={styles.rewardButton}>
                  <Text style={styles.rewardText}>Claim 100 Coins</Text>
                </View>
              </AnimatedTap>
            )}
          </View>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>Like this?</Text>
              <AnimatedHeart initialLiked={liked} onToggle={handleLikeToggle} />
            </View>
          </View>
          <TiltCard>
            <Text style={styles.cardTitle}>Tilt the arena card</Text>
            <Text style={styles.cardDesc}>Drag to feel the 3D perspective.</Text>
            <View style={styles.waveWrap}>
              <AudioWaveform active />
            </View>
          </TiltCard>
        </StaggeredContainer>
      </ScrollView>
      {toastVisible ? (
        <AnimatedToast
          message={liked ? "Thanks for liking!" : "Reward claimed"}
          type="success"
          duration={2000}
          onDismiss={() => setToastVisible(false)}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ARENA_COLORS.midnight },
  content: { padding: 16, paddingBottom: 48 },
  title: { ...TYPOGRAPHY.h2, color: ARENA_COLORS.cloud, textAlign: "center", marginBottom: 20 },
  card: {
    backgroundColor: ARENA_COLORS.panel,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { ...TYPOGRAPHY.h2, fontSize: 18, color: ARENA_COLORS.cloud },
  cardDesc: { ...TYPOGRAPHY.body, color: ARENA_COLORS.fog, marginTop: 4 },
  rewardButton: {
    backgroundColor: ARENA_COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  rewardText: { color: ARENA_COLORS.ink, fontWeight: "800" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  shimmer: { marginTop: 8 },
  waveWrap: { marginTop: 16 },
});
