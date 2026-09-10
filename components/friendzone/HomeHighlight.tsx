import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useDemoModeTick } from "@/hooks/use-demo-mode";
import { MOBILE_COPY } from "@/shared/copy";
import { matchFixture } from "@/shared/fixtures/matchFixture";
import { missionFixture } from "@/shared/fixtures/missionFixture";
import { roomFixture } from "@/shared/fixtures/roomFixture";
import { DemoModeManager } from "@/lib/mock/DemoModeManager";

import { MobileTutorial } from "./MobileTutorial";

const WELCOME_KEY = "friendzone-welcome-seen";

type Props = {
  onPlay?: () => void;
  onEnterWorld?: () => void;
};

export function HomeHighlight({ onPlay, onEnterWorld }: Props) {
  const [welcome, setWelcome] = useState(false);
  useDemoModeTick();
  const mission = missionFixture[0];
  const world = DemoModeManager.getInstance().getOrCreateService().world;
  const onlineCrew = world.users.slice(0, 12).filter((user) => Date.now() - user.lastActive.getTime() < 48 * 60 * 60 * 1000);
  const featuredRoom = world.rooms[0] ?? {
    title: roomFixture.featured.title,
    players: roomFixture.featured.players,
    maxPlayers: roomFixture.featured.maxPlayers,
  };
  const liveEvent = world.worldEvents.find((event) => event.status === "live");
  const topRank = world.leaderboard[0];

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_KEY)
      .then((seen) => {
        if (!seen) setWelcome(true);
      })
      .catch(() => undefined);
  }, []);

  const dismissWelcome = () => {
    setWelcome(false);
    void AsyncStorage.setItem(WELCOME_KEY, "1");
  };

  return (
    <View>
      <MobileTutorial visible={welcome} onSkip={dismissWelcome} onComplete={dismissWelcome} />
      <View style={styles.card}>
        <Text style={styles.kicker}>FRIENDZONE</Text>
        <Text style={styles.meta}>Crew: {Math.max(onlineCrew.length, 7)} online · DEMO</Text>
        <Text style={styles.meta}>
          Arena: Active · {featuredRoom.title} · {featuredRoom.players}/{featuredRoom.maxPlayers}
        </Text>
        <Text style={styles.meta}>3D World: Ready · companion preview</Text>
        <Text style={styles.meta}>
          Mission: {mission?.title} {mission?.progress}/{mission?.target}
        </Text>
        {liveEvent ? <Text style={styles.meta}>Live event: {liveEvent.title} · {liveEvent.rsvpCount} RSVP</Text> : null}
        {topRank ? <Text style={styles.meta}>Leader: #{topRank.rank} {topRank.displayName}</Text> : null}
        <Text style={styles.meta}>Streak: {matchFixture.streak}</Text>
        <Text style={styles.score}>
          {matchFixture.playerPulls} vs {matchFixture.opponentPulls}
        </Text>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={onPlay} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>{MOBILE_COPY.play}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={onEnterWorld} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>{MOBILE_COPY.enterWorld}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.panel, borderRadius: 22, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  kicker: { color: C.gold, fontSize: 12, fontWeight: "900", letterSpacing: 1.4 },
  meta: { color: C.cloud, fontSize: 14, fontWeight: "700", marginTop: 6 },
  score: { color: C.mint, fontSize: 20, fontWeight: "900", marginTop: 10 },
  row: { flexDirection: "column", gap: 8, marginTop: 14 },
  primary: { minHeight: 44, width: "100%", borderRadius: 14, backgroundColor: C.mint, alignItems: "center", justifyContent: "center" },
  primaryText: { color: C.ink, fontWeight: "900" },
  secondary: { minHeight: 44, width: "100%", borderRadius: 14, borderWidth: 1, borderColor: C.mint, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: C.mint, fontWeight: "900" },
  pressed: { opacity: 0.8 },
});
