import { memo, useCallback, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { AnimatedRope } from "@/components/game/AnimatedRope";
import { SafeGameScreen } from "@/components/game/SafeGameScreen";
import { ARENA_COLORS } from "@/lib/animations";
import {
  applyThrottledPull,
  applyThrottledReaction,
  applyThrottledSurge,
  createMobileMatchState,
  enqueueNotice,
  emptyNoticeQueue,
  tickOpponent,
  type MobileMatchState,
  type NoticeQueueState,
} from "@/lib/mobile-ux";
import { useMobileInteractionGates } from "@/hooks/use-mobile-interaction";
import { useReduceMotion } from "@/hooks/use-reduce-motion";
import { useVisibilityPerformance } from "@/hooks/use-visibility-performance";
import { MobileActivityList } from "./ActivityList";
import { MobileErrorRetry } from "./ErrorRetry";
import { MobileLeaderboardList } from "./LeaderboardList";
import { MobileLoadingSkeleton } from "./LoadingSkeleton";
import { MobileNotice } from "./MobileNotice";
import { MobilePlayerCard } from "./PlayerCard";
import { PerformanceHud } from "./PerformanceHud";
import { PullControl } from "./PullControl";
import { MobileQuickActions } from "./QuickActions";
import { RoomPreviewList } from "./RoomPreview";

export interface EnhancedMobileArenaProps {
  team?: MobileMatchState["team"];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onLeave?: () => void;
}

const DEMO_PLAYERS = [
  { name: "NovaNina", meta: "Sun Crew captain", online: true },
  { name: "PixelPuller", meta: "Moon Crew scout", online: true },
  { name: "MoonRunner", meta: "Building a streak", online: false },
];

const DEMO_ROOMS = [
  { id: "plaza", name: "Plaza Sprint", players: 6, status: "open" },
  { id: "crew", name: "Crew Scrim", players: 3, status: "forming" },
];

const DEMO_BOARD = [
  { rank: 1, name: "RopeRanger", wins: 18 },
  { rank: 2, name: "PixelPuller", wins: 15 },
  { rank: 3, name: "You", wins: 8 },
];

const DEMO_ACTIVITY = [
  { id: "a1", title: "Sun Crew took the line", meta: "12s ago" },
  { id: "a2", title: "PixelPuller reacted 🔥", meta: "28s ago" },
];

export const EnhancedMobileArena = memo(function EnhancedMobileArena({
  team = "sun",
  loading = false,
  error = null,
  onRetry,
  onLeave,
}: EnhancedMobileArenaProps) {
  const reduceMotionPref = useReduceMotion();
  const { width } = useWindowDimensions();
  const perf = useVisibilityPerformance();
  const gates = useMobileInteractionGates(Platform.OS, reduceMotionPref);
  const [match, setMatch] = useState(() => createMobileMatchState(team));
  const [notices, setNotices] = useState<NoticeQueueState>(emptyNoticeQueue);
  const haptics = gates.haptics;

  const teamColor = team === "sun" ? ARENA_COLORS.teamRed : ARENA_COLORS.teamBlue;
  const disabled = match.resultCounted || match.timeRemaining <= 0;

  const pushNotice = useCallback((kind: "info" | "success" | "warning" | "error", message: string) => {
    setNotices((current) => enqueueNotice(current, { kind, message }));
  }, []);

  const handlePull = useCallback(() => {
    if (!gates.pull.tryConsume()) return;
    setMatch((current) => {
      const next = applyThrottledPull(current, Date.now());
      if (next.state.resultCounted && !current.resultCounted) {
        haptics.tryPlay("success");
        pushNotice("success", "You pulled the rope over the line.");
      }
      return next.state;
    });
  }, [gates.pull, haptics, pushNotice]);

  const handleSurge = useCallback(() => {
    if (!gates.surge.tryConsume()) return;
    setMatch((current) => {
      const next = applyThrottledSurge(current, Date.now());
      if (next.accepted) {
        haptics.tryPlay("success");
        pushNotice("info", "Power Surge spent.");
      }
      return next.state;
    });
  }, [gates.surge, haptics, pushNotice]);

  const handleReact = useCallback(() => {
    if (!gates.reaction.tryConsume()) return;
    setMatch((current) => {
      const next = applyThrottledReaction(current, Date.now());
      if (next.accepted) {
        haptics.tryPlay("medium");
        pushNotice("info", "Crew reaction sent.");
      }
      return next.state;
    });
  }, [gates.reaction, haptics, pushNotice]);

  const handleTick = useCallback(() => {
    setMatch((current) => tickOpponent(current));
  }, []);

  if (loading) {
    return (
      <SafeGameScreen>
        <MobileLoadingSkeleton reduceMotion={reduceMotionPref} />
      </SafeGameScreen>
    );
  }

  if (error) {
    return (
      <SafeGameScreen>
        <MobileErrorRetry message={error} onRetry={onRetry ?? handleTick} />
      </SafeGameScreen>
    );
  }

  return (
    <SafeGameScreen>
      <View style={styles.root}>
        <View style={styles.top}>
          <View>
            <Text style={styles.kicker}>FRIENDZONE / ONE-THUMB</Text>
            <Text style={styles.title}>PULL TO WIN</Text>
          </View>
          <View style={styles.topActions}>
            {onLeave ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Leave the match"
                onPress={onLeave}
                style={styles.icon}
              >
                <MaterialIcons name="close" size={22} color={ARENA_COLORS.cloud} />
              </Pressable>
            ) : null}
            <View accessibilityRole="timer" accessibilityLabel={`${match.timeRemaining} seconds remaining`} style={styles.timer}>
              <Text style={styles.timerValue}>{match.timeRemaining}</Text>
              <Text style={styles.timerLabel}>SEC</Text>
            </View>
          </View>
        </View>

        <PerformanceHud snapshot={perf} />

        <View style={styles.hud}>
          <Text style={styles.stat}>{match.taps} pulls</Text>
          <Text style={styles.stat}>{match.streak} streak</Text>
          <Text style={[styles.stat, { color: teamColor }]}>{team.toUpperCase()}</Text>
        </View>

        <AnimatedRope position={match.pull} reduceMotion={reduceMotionPref} width={Math.min(320, width - 40)} />

        <PullControl
          onPull={handlePull}
          onLongPress={match.surgeReady ? handleSurge : undefined}
          disabled={disabled || match.resultCounted}
          color={teamColor}
          reduceMotion={reduceMotionPref}
        />

        <MobileQuickActions
          actions={[
            { key: "surge", label: match.surgeReady ? "SURGE" : "CHARGE", onPress: handleSurge, disabled: !match.surgeReady },
            { key: "react", label: "REACT", onPress: handleReact },
            { key: "tick", label: "TICK", onPress: handleTick },
          ]}
        />

        {notices.items.map((notice) => (
          <MobileNotice key={notice.id} notice={notice} />
        ))}

        <View style={styles.crew}>
          {DEMO_PLAYERS.map((player) => (
            <MobilePlayerCard key={player.name} {...player} />
          ))}
        </View>

        <RoomPreviewList rooms={DEMO_ROOMS} />
        <MobileLeaderboardList rows={DEMO_BOARD} />
        <MobileActivityList rows={DEMO_ACTIVITY} />
      </View>
    </SafeGameScreen>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1, gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  kicker: { color: ARENA_COLORS.fog, fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: ARENA_COLORS.cloud, fontSize: 22, fontWeight: "900" },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ARENA_COLORS.midnight,
    alignItems: "center",
    justifyContent: "center",
  },
  timer: {
    minWidth: 52,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: ARENA_COLORS.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  timerValue: { color: ARENA_COLORS.cloud, fontWeight: "900", fontSize: 16 },
  timerLabel: { color: ARENA_COLORS.fog, fontSize: 9, fontWeight: "800" },
  hud: { flexDirection: "row", justifyContent: "space-between" },
  stat: { color: ARENA_COLORS.fog, fontWeight: "800", fontSize: 12 },
  crew: { gap: 0 },
});
