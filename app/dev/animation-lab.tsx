import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";

import {
  AnimatedEmoji,
  AnimatedHeart,
  AnimatedListItem,
  AnimatedToast,
  AudioWaveform,
  EmoteWheel,
  LoadingScreen,
  ParallaxHeader,
  ShimmerLoading,
  StaggeredContainer,
  TiltCard,
} from "@/components/animations";
import { SparkleTrail } from "@/components/effects";
import { VictoryAnimation } from "@/components/game";
import { AnimatedDrawer, AnimatedTabBar } from "@/components/navigation";
import { ScreenContainer } from "@/components/screen-container";
import { ARENA_COLORS, TYPOGRAPHY } from "@/lib/animations";
import { HomeScreenWithAnimations } from "@/components/demo/HomeScreenWithAnimations";

const TABS = [
  { key: "play", title: "Play", icon: "⚔️" },
  { key: "crew", title: "Crew", icon: "👥" },
  { key: "lab", title: "Lab", icon: "✨" },
];

export default function AnimationLabScreen() {
  const [tab, setTab] = useState("lab");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [emoteOpen, setEmoteOpen] = useState(false);
  const [emote, setEmote] = useState<string | null>(null);
  const [showVictory, setShowVictory] = useState(false);
  const [sparkle, setSparkle] = useState({ active: false, x: 80, y: 120 });
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const drawerItems = useMemo(
    () => [
      { key: "home", label: "Home", icon: "🏠", onPress: () => undefined },
      { key: "arena", label: "Arena", icon: "⚔️", onPress: () => undefined },
      { key: "close", label: "Close", icon: "✕", onPress: () => undefined },
    ],
    [],
  );

  if (tab === "play") {
    return (
      <ScreenContainer className="p-0">
        <HomeScreenWithAnimations />
        <AnimatedTabBar tabs={TABS} activeTab={tab} onTabPress={setTab} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ParallaxHeader title="Animation Lab" scrollY={scrollY} />
      <Animated.ScrollView contentContainerStyle={styles.content} onScroll={onScroll} scrollEventThrottle={16}>
        <StaggeredContainer staggerDelayMs={70} visible>
          <Text style={styles.kicker}>FRIENDZONE BUILDATHON · PART 4</Text>
          <Text style={styles.body}>Orchestration, particles, toasts, emotes, and 60fps micro-interactions.</Text>
          <View style={styles.row}>
            <Pressable style={styles.button} onPress={() => setDrawerOpen(true)}>
              <Text style={styles.buttonText}>Open drawer</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => setEmoteOpen(true)}>
              <Text style={styles.buttonText}>Emote wheel</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Pressable style={styles.button} onPress={() => setShowVictory(true)}>
              <Text style={styles.buttonText}>Victory</Text>
            </Pressable>
            <AnimatedHeart />
          </View>
          <Pressable
            style={styles.sparklePad}
            onPress={(event) => {
              setSparkle({ active: true, x: event.nativeEvent.locationX, y: event.nativeEvent.locationY });
            }}
          >
            <Text style={styles.cardDesc}>Tap for sparkle trail</Text>
            <SparkleTrail active={sparkle.active} position={{ x: sparkle.x, y: sparkle.y }} />
          </Pressable>
          <AudioWaveform active />
          <ShimmerLoading height={16} />
          <TiltCard>
            <Text style={styles.cardTitle}>3D tilt card</Text>
            <Text style={styles.cardDesc}>Drag across this panel.</Text>
          </TiltCard>
          {["Sun Crew", "Moon Crew", "Plaza 0,0"].map((label, index) => (
            <AnimatedListItem key={label} index={index}>
              <Text style={styles.listText}>{label}</Text>
            </AnimatedListItem>
          ))}
        </StaggeredContainer>
        <View style={styles.loadingPreview}>
          <LoadingScreen reduceMotion />
        </View>
      </Animated.ScrollView>
      <AnimatedTabBar tabs={TABS} activeTab={tab} onTabPress={setTab} />
      <AnimatedDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} items={drawerItems} />
      <EmoteWheel
        visible={emoteOpen}
        onSelect={(next) => setEmote(next)}
        onClose={() => setEmoteOpen(false)}
      />
      {emote ? <AnimatedEmoji emoji={emote} active onComplete={() => setEmote(null)} /> : null}
      {showVictory ? <VictoryAnimation isWin onComplete={() => setShowVictory(false)} /> : null}
      {emote ? <AnimatedToast message={`Sent ${emote}`} type="info" onDismiss={() => undefined} /> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, backgroundColor: ARENA_COLORS.midnight },
  kicker: { ...TYPOGRAPHY.caption, color: ARENA_COLORS.primary, marginBottom: 8 },
  body: { ...TYPOGRAPHY.body, color: ARENA_COLORS.fog, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  button: {
    backgroundColor: ARENA_COLORS.panel,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  buttonText: { color: ARENA_COLORS.cloud, fontWeight: "800" },
  sparklePad: {
    height: 140,
    borderRadius: 12,
    backgroundColor: ARENA_COLORS.panel,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  cardTitle: { ...TYPOGRAPHY.h2, fontSize: 18, color: ARENA_COLORS.cloud },
  cardDesc: { ...TYPOGRAPHY.body, color: ARENA_COLORS.fog, marginTop: 4 },
  listText: { color: ARENA_COLORS.cloud, fontWeight: "700" },
  loadingPreview: { height: 220, marginTop: 16, borderRadius: 16, overflow: "hidden" },
});
