import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Animated, Pressable, Share, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { applyOpponentPressure, canInteractWithArena, resolveArenaOutcome, resolveTimeoutWinner } from "@/lib/game-rules";
import { CURRENT_STORAGE_SCHEMA_VERSION, DEMO_STORAGE_KEYS, DEMO_STORAGE_SCHEMA_KEY, JUDGE_AUTO_ADVANCE_KEY, JUDGE_PACING_PRESET_KEY, formatPersistenceFailureCategory, formatStorageSchemaEvent, readLocalValue, removeLocalValues, resolveStorageSchemaVersion, type PersistenceFailureCategory, writeLocalValue } from "@/lib/local-persistence";
import { parseBoolean, readHydratedValue } from "@/lib/local-hydration";
import { createPersistenceGateState, shouldWritePersistedState } from "@/lib/persistence-gates";
import { parseJsonArray, parseRecentCrew, parseStoredStats, resolveBooleanRecovery, resolvePartyCodeRecovery, resolveRecentCrewRecovery, resolveRsvpEventRecovery, resolveWaitlistRecovery } from "@/lib/persisted-parsers";
import {   JUDGE_SETTINGS_TOAST_DURATION_MS, resolveClipboardCopyOutcome, resolveNativeShareOutcome, resolveShareActionTransition, shouldCommitAsyncResult } from "@/lib/async-guards";
import {
  formatFriendzoneEventShareMessage,
  recoverFriendzoneModalSelection,
  resolveFriendzoneEventModalAction,
  resolveFriendzoneEventTitle,
  toggleFriendzoneRsvp,
  type FriendzoneEventTitle,
  type FriendzoneShareContext,
} from "@/lib/event-flow";
import {
  advanceFriendzoneDemoFlow, bridgeStatusMessage, deriveJudgeWalkthroughStep, formatBridgeAge, formatBridgeHealthFreshness, formatBridgeHealthFreshnessPresentation, formatBridgeHealthDiagnosticsSummary, formatMatchHistoryRecapPresentation, formatPowerTrackAccessibilityPresentation, formatArenaScoreAccessibilityPresentation, formatArenaTimerAccessibilityPresentation, formatMatchmakingReadinessPresentation, formatFirstMatchProgressPresentation, formatFirstPullCoachingPresentation, formatWalletReadyRewardPresentation, formatWalletReadyRewardActionPresentation, formatReceiptDetailsDisclosurePresentation, formatBridgeRecoveryReason, formatBridgeRecoverySummary, formatFriendzoneDemoFlowStep, formatMatchResultAccessibilityPresentation, formatJudgeAutoAdvanceStatus, formatJudgeTimingStatus, formatJudgeWalkthroughActionFeedback, formatJudgeWalkthroughCompletion, formatJudgeWalkthroughDemoSummary, formatJudgeWalkthroughTransitionSummary, formatJudgeWalkthroughPanelAccessibility, formatJudgeWalkthroughProofFreshness, formatJudgeWalkthroughProofLiveRegion, formatJudgeWalkthroughProofPresentation, formatJudgeWalkthroughProofSummary, formatJudgeWalkthroughPanelLiveRegion, formatJudgeWalkthroughResetControlPresentation, formatJudgeWalkthroughResetFeedbackLiveRegion, formatJudgeWalkthroughLifecycleLiveRegion, formatJudgeWalkthroughLifecycleAccessibilityState, formatJudgeWalkthroughPrimaryControlPresentation, formatJudgeWalkthroughLifecyclePresentation, formatJudgeWalkthroughStatusAnnouncement, formatJudgeWalkthroughResetStatus, resolveJudgeCurrentStepNavigation, formatJudgeCurrentStepNavigationFeedback, formatJudgeFullWalkthroughCancelStatus, formatJudgeFullWalkthroughPauseStatus, canResumeJudgeFullWalkthrough, resolveJudgeFullWalkthroughLifecycle, shouldInvalidateJudgeWalkthroughCallbacks, formatJudgeFullWalkthroughCompleteStatus, formatJudgeFullWalkthroughStatus, formatJudgeWalkthroughRewardHandoffAnnouncement, resolveJudgeRewardHandoffRecovery, formatJudgeWalkthroughCallbackIgnoredFeedback, getJudgeFullWalkthroughActiveStep, isJudgeFullWalkthroughTerminal, canRunJudgeWalkthroughManualStep, formatJudgeBlockedActionFeedback, formatJudgeBlockedActionAnnouncement, canCommitJudgeWalkthroughCallback, resolveJudgeWalkthroughCallbackOutcome, resolveJudgeWalkthroughResetIntent, formatNativeHandoffFailure, formatJudgePacingPreset, formatJudgeSettingsDeliveryFeedback, formatJudgeSettingsStatus, formatJudgeSettingsSummary, resolveJudgeSettingsDeliveryOutcome, getJudgePacingDelay, getJudgeFullWalkthroughSequence, getJudgeManualModeSettings, getJudgePresenterModeSettings, parseJudgePacingPreset, isJudgeWalkthroughStepComplete, formatJudgeWalkthroughStep, formatReportCopyStatus, formatResetStatusMessage, formatSanitizedDemoReport, parseBridgeRecoveryReason, formatBridgeTimestamp, resolveBridgeTimestampRecovery, resolveBridgeRecoveryReasonRecovery, getDemoResetBaseline, getDemoResetAccessibilityState, formatPlazaHandoffAccessibility, type FriendzoneDemoFlowStep, type JudgeFullWalkthroughStage, type JudgePacingPreset, type JudgeSettingsStorageStatus, type JudgeWalkthroughStep } from "@/lib/bridge-flow";

const C = {
  ink: "#11142B",
  midnight: "#1D2150",
  panel: "#252A5E",
  cyan: "#4DE7F2",
  coral: "#FF6B6B",
  gold: "#FFC857",
  cloud: "#F5F7FF",
  fog: "#A8B0D8",
  mint: "#72F2B6",
};

type Screen = "home" | "lobby" | "arena" | "results" | "leaderboard" | "settings" | "social";
type Team = "sun" | "moon";
type RewardEntry = { id: string; title: string; pulls: number; status: string };
type MatchEntry = { id: string; result: string; team: string; pulls: number; date: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRewardEntry(value: unknown): value is RewardEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.pulls === "number" &&
    Number.isFinite(value.pulls) &&
    typeof value.status === "string"
  );
}

function isValidPartyCode(value: unknown): value is string {
  return typeof value === "string" && /^TUG-[A-Z0-9]{4}$/.test(value);
}

function isValidBridgeTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length <= 64 && Number.isFinite(Date.parse(value));
}

function isMatchEntry(value: unknown): value is MatchEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.result === "string" &&
    typeof value.team === "string" &&
    typeof value.pulls === "number" &&
    Number.isFinite(value.pulls) &&
    typeof value.date === "string"
  );
}

const leaderboard = [
  { rank: 1, name: "RopeRanger", wins: 18, taps: 842 },
  { rank: 2, name: "PixelPuller", wins: 15, taps: 716 },
  { rank: 3, name: "NovaNina", wins: 12, taps: 644 },
  { rank: 4, name: "You", wins: 8, taps: 503 },
  { rank: 5, name: "MoonRunner", wins: 7, taps: 481 },
  { rank: 6, name: "SunSpark", wins: 6, taps: 438 },
  { rank: 7, name: "TorqueKid", wins: 5, taps: 392 },
  { rank: 8, name: "CloudPull", wins: 4, taps: 327 },
];

const demoCrew = [
  { name: "NovaNina", role: "Sun Crew captain", online: true },
  { name: "PixelPuller", role: "Moon Crew scout", online: true },
  { name: "MoonRunner", role: "Building a streak", online: true },
  { name: "SunSpark", role: "Ready for Plaza Sprint", online: true },
  { name: "RopeRanger", role: "Watching the arena", online: false },
  { name: "TorqueKid", role: "Last seen 12m ago", online: false },
];

const demoFriendzoneContacts = [
  { name: "ManaMax", status: "In Plaza", distance: "20m" },
  { name: "DecentraDeb", status: "At Arena", distance: "5m" },
  { name: "OrbitAce", status: "Friendzone lounge", distance: "42m" },
  { name: "NeonTug", status: "Queued for a match", distance: "60m" },
];

export default function HomeScreen() {
  const [screen, setScreen] = useState<Screen>("home");
  const [team, setTeam] = useState<Team>("sun");
  const [ready, setReady] = useState(false);
  const [time, setTime] = useState(30);
  const [pull, setPull] = useState(0);
  const [taps, setTaps] = useState(0);
  const [streak, setStreak] = useState(0);
  const [result, setResult] = useState<Team>("sun");
  const [wins, setWins] = useState(8);
  const [totalPulls, setTotalPulls] = useState(503);
  const [bestStreak, setBestStreak] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<1 | 2 | 3>(1);
  const [tutorialStepLocked, setTutorialStepLocked] = useState(false);
  const [surgeReady, setSurgeReady] = useState(false);
  const [surgeActive, setSurgeActive] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [receiptDetailsOpen, setReceiptDetailsOpen] = useState(false);
  const [rewardHistory, setRewardHistory] = useState<RewardEntry[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchEntry[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState("");
  const [shareStatus, setShareStatus] = useState("Share-ready");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [persistenceFailureCategory, setPersistenceFailureCategory] = useState<PersistenceFailureCategory | null>(null);
  const [friendzoneDemoFlow, setFriendzoneDemoFlow] = useState<FriendzoneDemoFlowStep>("idle");
  const [storageSchemaVersion, setStorageSchemaVersion] = useState<number | null>(null);
  const [storageSchemaEvent, setStorageSchemaEvent] = useState("Storage schema pending.");
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false);
  const [reportCopyStatus, setReportCopyStatus] = useState("Copy ready");
  const [judgeSettingsCopyStatus, setJudgeSettingsCopyStatus] = useState("Copy ready");
  const [judgeSettingsToast, setJudgeSettingsToast] = useState<string | null>(null);
  const [tutorialFeedback, setTutorialFeedback] = useState<string | null>(null);
  const [judgeWalkthroughOpen, setJudgeWalkthroughOpen] = useState(false);
  const [judgeAutoAdvance, setJudgeAutoAdvance] = useState(false);
  const [judgePacingPreset, setJudgePacingPreset] = useState<JudgePacingPreset>("standard");
  const [judgeSettingsStorageStatus, setJudgeSettingsStorageStatus] = useState<JudgeSettingsStorageStatus>("pending");
  const [judgeWalkthroughFeedback, setJudgeWalkthroughFeedback] = useState("Walkthrough ready");
  const [judgeFullWalkthroughStage, setJudgeFullWalkthroughStage] = useState<JudgeFullWalkthroughStage>("idle");
  const [judgeFullWalkthroughRunning, setJudgeFullWalkthroughRunning] = useState(false);
  const [judgeFullWalkthroughPaused, setJudgeFullWalkthroughPaused] = useState(false);
  const [judgeWalkthroughRestarting, setJudgeWalkthroughRestarting] = useState(false);
  const [judgeWalkthroughResetStatus, setJudgeWalkthroughResetStatus] = useState("Walkthrough ready");
  const [resetStatus, setResetStatus] = useState("Not run");
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [reaction, setReaction] = useState("⚡");
  const [partyReady, setPartyReady] = useState(false);
  const [partyCode, setPartyCode] = useState("TUG-7Q2K");
  const defaultPartyCode = "TUG-7Q2K";
  const [inviteStatus, setInviteStatus] = useState("Share-ready");
  const [shareInFlight, setShareInFlight] = useState(false);
  const [handoffAction, setHandoffAction] = useState<"idle" | "copying" | "opening" | "sharing">("idle");
  const [acceptedInviteCode, setAcceptedInviteCode] = useState<string | null>(null);
  const [rsvpEvent, setRsvpEvent] = useState<FriendzoneEventTitle | null>(null);
  const [recentCrew, setRecentCrew] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FriendzoneEventTitle | null>(null);
  const [eventCountdown, setEventCountdown] = useState(12 * 60);
  const [wearableEquipped, setWearableEquipped] = useState(false);
  const [eventWaitlisted, setEventWaitlisted] = useState(false);
  const [wearableDetailOpen, setWearableDetailOpen] = useState(false);
  const [bridgeRetrying, setBridgeRetrying] = useState(false);
  const [bridgeLastCheckedLabel, setBridgeLastCheckedLabel] = useState<string | null>(null);
  const [bridgeLastCheckedAt, setBridgeLastCheckedAt] = useState<string | null>(null);
  const [bridgeRecoveryReason, setBridgeRecoveryReason] = useState<"offline-mirror" | null>(null);
  const [bridgeToast, setBridgeToast] = useState<string | null>(null);
  const inviteLink = Linking.useURL();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const surgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultCountedRef = useRef(false);
  const pullRef = useRef(0);
  const handledInviteRef = useRef<string | null>(null);
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.86)).current;
  const receiptSavedOpacity = useRef(new Animated.Value(0)).current;
  const receiptSavedScale = useRef(new Animated.Value(0.9)).current;
  const receiptDetailsOpacity = useRef(new Animated.Value(0)).current;
  const receiptDetailsScale = useRef(new Animated.Value(0.96)).current;
  const livePulse = useRef(new Animated.Value(1)).current;
  const tutorialOpacity = useRef(new Animated.Value(0)).current;
  const tutorialScale = useRef(new Animated.Value(0.96)).current;
  const readinessScale = useRef(new Animated.Value(1)).current;
  const tutorialStepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bridgeRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bridgeToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const judgeSettingsToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tutorialFeedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tutorialFeedbackOpacity = useRef(new Animated.Value(0)).current;
  const tutorialFeedbackScale = useRef(new Animated.Value(0.96)).current;
  const judgeFullWalkthroughTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const judgeFullWalkthroughRunningRef = useRef(false);
  const judgeFullWalkthroughPausedRef = useRef(false);
  const judgeFullWalkthroughNextActionRef = useRef<0 | 1 | 2 | 3>(0);
  const judgeFullWalkthroughGenerationRef = useRef(0);
  const mountedRef = useRef(true);
    const resetInFlightRef = useRef(false);
  const persistenceWriteStartedRef = useRef(createPersistenceGateState());
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      judgeFullWalkthroughTimersRef.current.forEach((timer) => clearTimeout(timer));
      judgeFullWalkthroughTimersRef.current = [];
      judgeFullWalkthroughRunningRef.current = false;
      judgeFullWalkthroughPausedRef.current = false;
      judgeFullWalkthroughNextActionRef.current = 0;
      resetInFlightRef.current = false;
      setJudgeFullWalkthroughRunning(false);
      setJudgeFullWalkthroughPaused(false);
    };
  }, []);

  const isResetting = resetStatus === "Resetting…";
  const resetAccessibilityState = getDemoResetAccessibilityState(isResetting);
  const plazaCopyAccessibility = formatPlazaHandoffAccessibility("copy", handoffAction);
  const plazaShareAccessibility = formatPlazaHandoffAccessibility("share", handoffAction);
  const plazaOpenAccessibility = formatPlazaHandoffAccessibility("open", handoffAction);
  const readinessPresentation = formatMatchmakingReadinessPresentation(ready);
  const firstMatchProgressPresentation = formatFirstMatchProgressPresentation(ready);
  const firstPullCoachingPresentation = formatFirstPullCoachingPresentation(taps);
  const teamColor = team === "sun" ? C.coral : C.cyan;
  const opponentColor = team === "sun" ? C.cyan : C.coral;
  const playerWon = result === team;
  const rewardPresentation = formatWalletReadyRewardPresentation({ playerWon, walletConnected, rewardClaimed });
  const rewardActionPresentation = formatWalletReadyRewardActionPresentation(rewardClaimed);
  const receiptDetailsPresentation = formatReceiptDetailsDisclosurePresentation(receiptDetailsOpen);
  const powerLeft = Math.max(4, Math.min(96, 50 + pull));
  const powerTrackAccessibilityPresentation = formatPowerTrackAccessibilityPresentation({ team, powerLeft });
  const arenaScoreAccessibilityPresentation = formatArenaScoreAccessibilityPresentation({ team, powerLeft });
  const arenaTimerAccessibilityPresentation = formatArenaTimerAccessibilityPresentation(time);
  const bridgeStatusLabel = bridgeRetrying ? "CHECKING" : bridgeLastCheckedAt ? "OFFLINE MIRROR" : "NOT CONNECTED";
  const bridgeStatusColor = bridgeRetrying ? C.gold : bridgeLastCheckedAt ? C.mint : C.fog;
  const bridgeStatusIcon = bridgeRetrying ? "sync" : bridgeLastCheckedAt ? "cloud-off" : "cloud-done";

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    }).catch(() => {
      if (active) setReduceMotion(false);
    });
    let reduceMotionSubscription: ReturnType<typeof AccessibilityInfo.addEventListener> | null = null;
    try {
      reduceMotionSubscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    } catch {
      setReduceMotion(false);
    }
    readLocalValue(DEMO_STORAGE_SCHEMA_KEY).then((rawVersion) => {
      if (!active) return;
      const schemaResolution = resolveStorageSchemaVersion(rawVersion);
      setStorageSchemaEvent(formatStorageSchemaEvent(schemaResolution));
      if (schemaResolution === "missing" || schemaResolution === "migratable") {
        setStorageSchemaVersion(CURRENT_STORAGE_SCHEMA_VERSION);
        void writeLocalValue(DEMO_STORAGE_SCHEMA_KEY, String(CURRENT_STORAGE_SCHEMA_VERSION)).then((ok) => {
          if (active && !ok) recordPersistenceFailure("write");
        });
      } else if (schemaResolution === "current") {
        setStorageSchemaVersion(CURRENT_STORAGE_SCHEMA_VERSION);
      } else {
        recordPersistenceFailure("read");
      }
    }).catch(() => {
      if (active) recordPersistenceFailure("read");
    });
    readHydratedValue(JUDGE_PACING_PRESET_KEY, parseJudgePacingPreset).then((stored) => {
      if (!active) return;
      if (stored.status === "valid") { setJudgePacingPreset(stored.value); setJudgeSettingsStorageStatus("persisted"); }
      else if (stored.status === "missing") setJudgeSettingsStorageStatus("defaults");
      else { setJudgeSettingsStorageStatus("unavailable"); recordPersistenceFailure("read"); }
    });
    readHydratedValue(JUDGE_AUTO_ADVANCE_KEY, parseBoolean).then((stored) => {
      if (!active) return;
      if (stored.status === "valid") { setJudgeAutoAdvance(stored.value); setJudgeSettingsStorageStatus("persisted"); }
      else if (stored.status === "missing") setJudgeSettingsStorageStatus("defaults");
      else { setJudgeSettingsStorageStatus("unavailable"); recordPersistenceFailure("read"); }
    });
    readHydratedValue("tug-of-war-party-code", (value) => isValidPartyCode(value) ? value : null).then((stored) => {
      if (!active) return;
      const recovery = resolvePartyCodeRecovery(stored.status, stored.status === "valid" ? stored.value : null, defaultPartyCode);
      setPartyCode(recovery.value);
      if (recovery.shouldPersist) void writeLocalValue("tug-of-war-party-code", recovery.value).then((ok) => { if (active && !ok) recordPersistenceFailure("write"); });
      if (recovery.warning) setStorageWarning(true);
    });
    readHydratedValue("tug-of-war-bridge-checked-at", (value) => isValidBridgeTimestamp(value) ? value : null).then((stored) => {
      if (!active) return;
      const recovery = resolveBridgeTimestampRecovery(stored.status, stored.status === "valid" ? stored.value : null);
      setBridgeLastCheckedAt(recovery.value);
      if (recovery.warning) recordPersistenceFailure("read");
    });
    readHydratedValue("tug-of-war-bridge-recovery-reason", parseBridgeRecoveryReason).then((stored) => {
      if (!active) return;
      const recovery = resolveBridgeRecoveryReasonRecovery(stored.status, stored.status === "valid" ? stored.value : null);
      setBridgeRecoveryReason(recovery.value);
      if (recovery.warning) recordPersistenceFailure("read");
    });
    readHydratedValue("tug-of-war-event-waitlisted", parseBoolean).then((stored) => {
      if (!active) return;
      const recovery = resolveWaitlistRecovery(stored.status, stored.status === "valid" ? stored.value : null);
      setEventWaitlisted(recovery.value);
      if (recovery.warning) setStorageWarning(true);
    });
    readHydratedValue("tug-of-war-wearable-equipped", parseBoolean).then((stored) => {
      if (!active) return;
      const recovery = resolveBooleanRecovery(stored.status, stored.status === "valid" ? stored.value : null);
      setWearableEquipped(recovery.value);
      if (recovery.warning) setStorageWarning(true);
    });
    readHydratedValue("tug-of-war-recent-crew", parseRecentCrew).then((stored) => {
      if (!active) return;
      const recovery = resolveRecentCrewRecovery(stored.status, stored.status === "valid" ? stored.value : null);
      setRecentCrew(recovery.value);
      if (recovery.warning) setStorageWarning(true);
    });
    readHydratedValue("tug-of-war-rsvp-event", resolveFriendzoneEventTitle).then((stored) => {
      if (!active) return;
      const recovery = resolveRsvpEventRecovery(stored.status, stored.status === "valid" ? stored.value : null);
      setRsvpEvent(recovery.value);
      if (recovery.warning) setStorageWarning(true);
    });
    readHydratedValue("tug-of-war-history", (value) => parseJsonArray(value, isMatchEntry)).then((stored) => {
      if (!active) return;
      if (stored.status === "valid") setMatchHistory(stored.value);
      else if (stored.status === "malformed" || stored.status === "unavailable") {
        setMatchHistory([]);
        setStorageWarning(true);
      }
    });
    readHydratedValue("tug-of-war-receipts", (value) => parseJsonArray(value, isRewardEntry)).then((stored) => {
      if (!active) return;
      if (stored.status === "valid") setRewardHistory(stored.value);
      else if (stored.status === "malformed" || stored.status === "unavailable") {
        setRewardHistory([]);
        setStorageWarning(true);
      }
    });
    readHydratedValue("tug-of-war-stats", parseStoredStats).then((stored) => {
      if (!active) return;
      if (stored.status === "valid") {
        setWins(stored.value.wins);
        setTotalPulls(stored.value.totalPulls);
        setBestStreak(stored.value.bestStreak);
      } else if (stored.status === "malformed" || stored.status === "unavailable") {
        setStorageWarning(true);
      }
    });
    return () => {
      active = false;
      reduceMotionSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!inviteLink || handledInviteRef.current === inviteLink) return;
    handledInviteRef.current = inviteLink;
    try {
      const parsed = Linking.parse(inviteLink);
      const queryInvite = parsed.queryParams?.invite;
      const pathInvite = parsed.path?.match(/^invite\/(TUG-[A-Z0-9]{4})$/)?.[1];
      const nextInvite = typeof queryInvite === "string" ? queryInvite : pathInvite;
      if (!nextInvite || !/^TUG-[A-Z0-9]{4}$/.test(nextInvite)) {
        setInviteStatus("Invite link unavailable");
        announce("This invite link is unavailable. You can continue with a normal offline match.");
        return;
      }
      setPartyCode(nextInvite);
      setPartyReady(true);
      setAcceptedInviteCode(nextInvite);
      setInviteStatus("Invite opened");
      setScreen("lobby");
      announce(`Invite ${nextInvite} opened. Choose a crew to join the lobby.`);
    } catch {
      setInviteStatus("Invite link unavailable");
      announce("This invite link is unavailable. You can continue with a normal offline match.");
    }
  }, [inviteLink]);

  useEffect(() => {
    const shouldCelebrate = screen === "results" && playerWon && !reduceMotion;
    try {
      celebrationOpacity.stopAnimation();
      celebrationScale.stopAnimation();
      if (!shouldCelebrate) {
        celebrationOpacity.setValue(0);
        celebrationScale.setValue(0.86);
        return;
      }
      celebrationOpacity.setValue(0);
      celebrationScale.setValue(0.86);
      const animation = Animated.parallel([
        Animated.timing(celebrationOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(celebrationScale, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]);
      animation.start();
      return () => {
        try {
          animation.stop();
        } catch {
          // Native animation cleanup is best effort during rapid navigation.
        }
      };
    } catch {
      // Reduced-motion or unsupported native animation failures must not affect results.
      celebrationOpacity.setValue(0);
      celebrationScale.setValue(0.86);
    }
  }, [celebrationOpacity, celebrationScale, playerWon, reduceMotion, screen]);

  useEffect(() => {
    livePulse.stopAnimation();
    livePulse.setValue(1);
    if (reduceMotion || screen === "results") return;
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(livePulse, { toValue: 0.72, duration: 900, useNativeDriver: true }),
      Animated.timing(livePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => {
      pulse.stop();
      livePulse.stopAnimation();
      livePulse.setValue(1);
    };
    }, [livePulse, reduceMotion, screen]);
  useEffect(() => {
    receiptSavedOpacity.stopAnimation();
    receiptSavedScale.stopAnimation();
    if (!rewardClaimed || screen !== "results" || reduceMotion) {
      receiptSavedOpacity.setValue(rewardClaimed ? 1 : 0);
      receiptSavedScale.setValue(1);
      return;
    }
    receiptSavedOpacity.setValue(0);
    receiptSavedScale.setValue(0.9);
    const receiptEntrance = Animated.parallel([
      Animated.timing(receiptSavedOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(receiptSavedScale, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]);
    receiptEntrance.start();
    return () => {
      receiptEntrance.stop();
      receiptSavedOpacity.stopAnimation();
      receiptSavedScale.stopAnimation();
    };
  }, [receiptSavedOpacity, receiptSavedScale, reduceMotion, rewardClaimed, screen]);
  useEffect(() => {
    tutorialOpacity.stopAnimation();
    tutorialScale.stopAnimation();
    if (!showTutorial || reduceMotion) {
      tutorialOpacity.setValue(showTutorial ? 1 : 0);
      tutorialScale.setValue(1);
      return;
    }
    tutorialOpacity.setValue(0);
    tutorialScale.setValue(0.96);
    const entrance = Animated.parallel([
      Animated.timing(tutorialOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(tutorialScale, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]);
    entrance.start();
    return () => {
      entrance.stop();
      tutorialOpacity.stopAnimation();
      tutorialScale.stopAnimation();
    };
  }, [reduceMotion, showTutorial, tutorialOpacity, tutorialScale, tutorialStep]);

  useEffect(() => {
    tutorialFeedbackOpacity.stopAnimation();
    tutorialFeedbackScale.stopAnimation();
    if (!tutorialFeedback || reduceMotion) {
      tutorialFeedbackOpacity.setValue(tutorialFeedback ? 1 : 0);
      tutorialFeedbackScale.setValue(1);
      return;
    }
    tutorialFeedbackOpacity.setValue(0);
    tutorialFeedbackScale.setValue(0.96);
    const entrance = Animated.parallel([
      Animated.timing(tutorialFeedbackOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(tutorialFeedbackScale, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]);
    entrance.start();
    return () => {
      entrance.stop();
      tutorialFeedbackOpacity.stopAnimation();
      tutorialFeedbackScale.stopAnimation();
    };
  }, [reduceMotion, tutorialFeedback, tutorialFeedbackOpacity, tutorialFeedbackScale]);

  useEffect(() => {
    return () => {
      if (tutorialStepTimerRef.current) {
        clearTimeout(tutorialStepTimerRef.current);
        tutorialStepTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldWritePersistedState(persistenceWriteStartedRef.current, "stats")) return;
    let active = true;
    writeLocalValue("tug-of-war-stats", JSON.stringify({ wins, totalPulls, bestStreak })).then((ok) => {
      if (active && !ok) setStorageWarning(true);
    });
    return () => {
      active = false;
    };
  }, [wins, totalPulls, bestStreak]);

  useEffect(() => {
    if (!shouldWritePersistedState(persistenceWriteStartedRef.current, "receipts")) return;
    let active = true;
    writeLocalValue("tug-of-war-receipts", JSON.stringify(rewardHistory)).then((ok) => {
      if (active && !ok) setStorageWarning(true);
    });
    return () => {
      active = false;
    };
  }, [rewardHistory]);

  useEffect(() => {
    if (!shouldWritePersistedState(persistenceWriteStartedRef.current, "party-code")) return;
    let active = true;
    writeLocalValue("tug-of-war-party-code", partyCode).then((ok) => {
      if (active && !ok) setStorageWarning(true);
    });
    return () => {
      active = false;
    };
  }, [partyCode]);

  useEffect(() => {
    const countdownTimer = setInterval(() => setEventCountdown((value) => value <= 0 ? 12 * 60 : value - 1), 1000);
    return () => clearInterval(countdownTimer);
  }, []);

  useEffect(() => {
    if (!shouldWritePersistedState(persistenceWriteStartedRef.current, "event-waitlisted")) return;
    let active = true;
    writeLocalValue("tug-of-war-event-waitlisted", String(eventWaitlisted)).then((ok) => {
      if (active && !ok) setStorageWarning(true);
    });
    return () => {
      active = false;
    };
  }, [eventWaitlisted]);

  useEffect(() => {
    if (!shouldWritePersistedState(persistenceWriteStartedRef.current, "wearable-equipped")) return;
    let active = true;
    writeLocalValue("tug-of-war-wearable-equipped", String(wearableEquipped)).then((ok) => {
      if (active && !ok) setStorageWarning(true);
    });
    return () => {
      active = false;
    };
  }, [wearableEquipped]);

  useEffect(() => {
    if (!shouldWritePersistedState(persistenceWriteStartedRef.current, "recent-crew")) return;
    let active = true;
    writeLocalValue("tug-of-war-recent-crew", JSON.stringify(recentCrew)).then((ok) => {
      if (active && !ok) setStorageWarning(true);
    });
    return () => {
      active = false;
    };
  }, [recentCrew]);

  useEffect(() => {
    if (!shouldWritePersistedState(persistenceWriteStartedRef.current, "rsvp-event")) return;
    let active = true;
    writeLocalValue("tug-of-war-rsvp-event", rsvpEvent ?? "").then((ok) => {
      if (active && !ok) setStorageWarning(true);
    });
    return () => {
      active = false;
    };
  }, [rsvpEvent]);

  useEffect(() => {
    if (!shouldWritePersistedState(persistenceWriteStartedRef.current, "history")) return;
    let active = true;
    writeLocalValue("tug-of-war-history", JSON.stringify(matchHistory)).then((ok) => {
      if (active && !ok) setStorageWarning(true);
    });
    return () => {
      active = false;
    };
  }, [matchHistory]);

  useEffect(() => {
    if (screen === "results") announce(formatMatchResultAccessibilityPresentation(playerWon).announcement);
  }, [playerWon, screen]);

  useEffect(() => {
    if (screen === "results" && !resultCountedRef.current) {
      resultCountedRef.current = true;
      if (playerWon) setWins((current) => current + 1);
      const safePulls = Number.isFinite(taps) && taps >= 0 ? Math.floor(taps) : 0;
      setMatchHistory((current) => [{ id: `match-${Date.now()}`, result: playerWon ? "Victory" : "Defeat", team: team === "sun" ? "Sun Crew" : "Moon Crew", pulls: safePulls, date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }) }, ...current].slice(0, 6));
    }
  }, [screen, playerWon, taps, team]);

  const prepareRecapShare = async () => {
    if (resolveShareActionTransition({ phase: "start", inFlight: shareInFlight, isMounted: mountedRef.current }) === "blocked") { const blockedFeedback = formatJudgeBlockedActionAnnouncement("handoff-busy"); setJudgeWalkthroughFeedback(formatJudgeBlockedActionFeedback("handoff-busy")); announce(blockedFeedback); return; }
    setShareInFlight(true);
    setHandoffAction("sharing");
    const message = `Decentraland Friendzone Plaza recap · Tug of War Arena: ${playerWon ? "Victory" : "Defeat"} for ${team === "sun" ? "Sun Crew" : "Moon Crew"}. ${taps} pulls, best streak ${bestStreak}. Join the next party with code ${partyCode}.`;
    try {
      const shareResult = await Share.share({ message, title: "Tug of War Arena recap" });
      if (resolveNativeShareOutcome(shareResult.action, Share.dismissedAction) === "dismissed") throw new Error("Share sheet dismissed");
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      setShareStatus("Recap shared");
      announce("Match recap shared.");
    } catch {
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      const fallback = formatNativeHandoffFailure("recap-share");
      setShareStatus(fallback.status);
      announce(fallback.announcement);
    } finally {
      if (mountedRef.current) {
        setShareInFlight(false);
        setHandoffAction("idle");
      }
    }
    fireHaptic("light");
  };

  const buildSanitizedDemoReport = () => formatSanitizedDemoReport({
    generatedAt: new Date().toISOString(),
    bridgeHealth: bridgeRetrying ? "checking" : bridgeRecoveryReason ? "fallback" : "ready",
    bridgeRecoveryReason,
    bridgeLastCheckedAt,
    storageSchemaVersion,
    storageSchemaEvent,
    persistenceFailure: formatPersistenceFailureCategory(persistenceFailureCategory),
    demoFlow: friendzoneDemoFlow,
    rsvpEvent,
    wins,
    totalPulls,
  });

  const copyDiagnosticsReport = async () => {
    if (resolveShareActionTransition({ phase: "start", inFlight: shareInFlight, isMounted: mountedRef.current }) === "blocked") { const blockedFeedback = formatJudgeBlockedActionAnnouncement("handoff-busy"); setJudgeWalkthroughFeedback(formatJudgeBlockedActionFeedback("handoff-busy")); announce(blockedFeedback); return; }
    setShareInFlight(true);
    try {
      const copied = await Clipboard.setStringAsync(buildSanitizedDemoReport());
      const succeeded = copied !== false;
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      setReportCopyStatus(formatReportCopyStatus(succeeded));
      announce(succeeded ? "Sanitized Diagnostics report copied." : "Copy is unavailable. Use Share to send the report.");
      if (succeeded) fireHaptic("light");
    } catch {
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      const fallback = formatNativeHandoffFailure("diagnostics-copy");
      setReportCopyStatus(fallback.status);
      announce(fallback.announcement);
    } finally {
      if (mountedRef.current) setShareInFlight(false);
    }
  };

  const showJudgeSettingsToast = (message: string) => {
    setJudgeSettingsToast(message);
    if (judgeSettingsToastRef.current) clearTimeout(judgeSettingsToastRef.current);
    judgeSettingsToastRef.current = setTimeout(() => {
      judgeSettingsToastRef.current = null;
      if (mountedRef.current) {
        setJudgeSettingsToast(null);
        setJudgeWalkthroughRestarting(false);
      }
    }, JUDGE_SETTINGS_TOAST_DURATION_MS);
  };

  const copyJudgeSettingsSummary = async () => {
    if (resolveShareActionTransition({ phase: "start", inFlight: shareInFlight, isMounted: mountedRef.current }) === "blocked") { const blockedFeedback = formatJudgeBlockedActionAnnouncement("handoff-busy"); setJudgeWalkthroughFeedback(formatJudgeBlockedActionFeedback("handoff-busy")); announce(blockedFeedback); return; }
    setShareInFlight(true);
    const summary = formatJudgeSettingsSummary(judgeAutoAdvance, judgePacingPreset, judgeSettingsStorageStatus);
    const shareFallback = async () => {
      try {
        const shareResult = await Share.share({ message: summary, title: "Tug of War Arena judge settings" });
        return resolveNativeShareOutcome(shareResult.action, Share.dismissedAction) === "shared";
      } catch {
        return false;
      }
    };
    try {
      const copied = await Clipboard.setStringAsync(summary);
      const clipboardOutcome = resolveClipboardCopyOutcome({ copied: copied !== false, isMounted: mountedRef.current, inFlight: false });
      if (clipboardOutcome === "ignored") return;
      const shared = clipboardOutcome === "copied" ? false : await shareFallback();
      const outcome = resolveJudgeSettingsDeliveryOutcome({ clipboardCopied: clipboardOutcome === "copied", shared, isMounted: mountedRef.current, inFlight: false });
      if (outcome === "ignored") return;
      const feedback = formatJudgeSettingsDeliveryFeedback(outcome);
      setJudgeSettingsCopyStatus(feedback.status);
      showJudgeSettingsToast(feedback.status);
      announce(feedback.announcement);
      if (outcome === "copied" || outcome === "shared") fireHaptic("light");
    } catch {
      const shared = await shareFallback();
      const outcome = resolveJudgeSettingsDeliveryOutcome({ clipboardCopied: false, shared, isMounted: mountedRef.current, inFlight: false });
      if (outcome === "ignored") return;
      const feedback = formatJudgeSettingsDeliveryFeedback(outcome);
      setJudgeSettingsCopyStatus(feedback.status);
      showJudgeSettingsToast(feedback.status);
      announce(feedback.announcement);
      if (outcome === "shared") fireHaptic("light");
    } finally {
      if (mountedRef.current) setShareInFlight(false);
    }
  };

  const shareDiagnosticsReport = async () => {
    if (resolveShareActionTransition({ phase: "start", inFlight: shareInFlight, isMounted: mountedRef.current }) === "blocked") { const blockedFeedback = formatJudgeBlockedActionAnnouncement("handoff-busy"); setJudgeWalkthroughFeedback(formatJudgeBlockedActionFeedback("handoff-busy")); announce(blockedFeedback); return; }
    setShareInFlight(true);
    setHandoffAction("sharing");
    const message = buildSanitizedDemoReport();
    try {
      const shareResult = await Share.share({ message, title: "Tug of War Arena demo report" });
      if (resolveNativeShareOutcome(shareResult.action, Share.dismissedAction) === "dismissed") throw new Error("Share sheet dismissed");
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      setShareStatus("Diagnostics report shared");
      announce("Sanitized Diagnostics report shared. Wallet and account identifiers were omitted.");
    } catch {
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      const fallback = formatNativeHandoffFailure("diagnostics-share");
      setShareStatus(fallback.status);
      announce(fallback.announcement);
    } finally {
      if (mountedRef.current) {
        setShareInFlight(false);
        setHandoffAction("idle");
      }
    }
  };

  const announce = (message: string) => {
    try {
      AccessibilityInfo.announceForAccessibility(message);
    } catch {
      // Screen-reader announcements are optional and must never interrupt play.
    }
  };

  const recordPersistenceFailure = (category: PersistenceFailureCategory) => {
    setStorageWarning(true);
    setPersistenceFailureCategory(category);
  };

  const openDiagnostics = () => {
    setFriendzoneDemoFlow((step) => advanceFriendzoneDemoFlow(step, "open-diagnostics"));
    setScreen("settings");
    setDiagnosticsOpen(true);
    announce("Demo diagnostics opened. Review local recovery status.");
  };

  const resetDemo = async () => {
    if (resetInFlightRef.current) return;
    resetInFlightRef.current = true;
    let resetSucceeded = false;
    const baseline = getDemoResetBaseline();
    clearFullWalkthroughTimers();
    resultCountedRef.current = baseline.resultCounted;
    pullRef.current = baseline.pull;
    setResetStatus("Resetting…");
    setTime(baseline.time);
    setPull(baseline.pull);
    setTaps(baseline.taps);
    setStreak(baseline.streak);
    setSurgeReady(baseline.surgeReady);
    setSurgeActive(baseline.surgeActive);
    setRewardClaimed(baseline.rewardClaimed);
    setReceiptDetailsOpen(baseline.receiptDetailsOpen);
    setJudgeFullWalkthroughStage(baseline.judgeFullWalkthroughStage);
    setJudgeWalkthroughOpen(baseline.judgeWalkthroughOpen);
    setJudgeWalkthroughRestarting(false);
    setJudgeWalkthroughFeedback("Walkthrough ready");
    setJudgeWalkthroughResetStatus("Walkthrough ready");
    setJudgeSettingsToast(null);
    setFriendzoneDemoFlow(baseline.friendzoneDemoFlow);
    setSelectedEvent(baseline.selectedEvent);
    setWins(0);
    setTotalPulls(0);
    setBestStreak(0);
    setRewardHistory([]);
    setMatchHistory([]);
    setBridgeLastCheckedAt(null);
    setBridgeRecoveryReason(null);
    setStorageWarning(false);
    setPersistenceFailureCategory(null);
    setScreen("home");
    try {
      const cleared = await removeLocalValues([...DEMO_STORAGE_KEYS]);
      if (!mountedRef.current) {
        resetInFlightRef.current = false;
        return;
      }
      if (cleared) {
        resetSucceeded = true;
        setResetStatus("Reset complete");
      } else {
        setResetStatus("Reset needs retry");
        recordPersistenceFailure("cleanup");
        openDiagnostics();
      }
    } catch {
      if (!mountedRef.current) {
        resetInFlightRef.current = false;
        return;
      }
      setResetStatus("Reset needs retry");
      recordPersistenceFailure("cleanup");
      openDiagnostics();
    }
    if (!mountedRef.current) return;
    resetInFlightRef.current = false;
    announce(formatResetStatusMessage(resetSucceeded));
    fireHaptic("medium");
  };

  const refreshPartyCode = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const nextCode = `TUG-${Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")}`;
    setPartyCode(nextCode);
    setInviteStatus("New code generated");
    fireHaptic("light");
  };

  const copyPartyCode = async () => {
    if (resolveShareActionTransition({ phase: "start", inFlight: shareInFlight, isMounted: mountedRef.current }) === "blocked") { const blockedFeedback = formatJudgeBlockedActionAnnouncement("handoff-busy"); setJudgeWalkthroughFeedback(formatJudgeBlockedActionFeedback("handoff-busy")); announce(blockedFeedback); return; }
    setShareInFlight(true);
    setHandoffAction("copying");
    try {
      const copied = await Clipboard.setStringAsync(partyCode);
      const outcome = resolveClipboardCopyOutcome({ copied: copied !== false, isMounted: mountedRef.current, inFlight: false });
      if (outcome === "ignored") return;
      if (outcome === "fallback") throw new Error("Clipboard rejected the party-code copy request");
      setInviteStatus("Code copied");
      announce(`Party code ${partyCode} copied.`);
      fireHaptic("light");
    } catch {
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      const fallback = formatNativeHandoffFailure("party-code-copy");
      setInviteStatus(fallback.status);
      announce(fallback.announcement);
    } finally {
      if (mountedRef.current) {
        setShareInFlight(false);
        setHandoffAction("idle");
      }
    }
  };

  const rememberCrewMember = (name: string) => {
    setRecentCrew((current) => [name, ...current.filter((member) => member !== name)].slice(0, 4));
  };

  const inviteRecentCrewMember = (name: string) => {
    rememberCrewMember(name);
    setPartyReady(true);
    setInviteStatus(`Invite sent to ${name}`);
    announce(`${name} was re-invited from your Recent Crew.`);
    fireHaptic("light");
  };

  const toggleEventRsvp = (eventTitle: FriendzoneEventTitle) => {
    const action = resolveFriendzoneEventModalAction(eventTitle, rsvpEvent, eventWaitlisted);
    if (action === "join-waitlist" || action === "leave-waitlist") {
      const nextWaitlist = action === "join-waitlist";
      setEventWaitlisted(nextWaitlist);
      setPartyReady(nextWaitlist);
      setInviteStatus(nextWaitlist ? "Added to Wearable Rush waitlist" : "Waitlist spot released");
      announce(nextWaitlist ? "You joined the Wearable Rush waitlist." : "You left the Wearable Rush waitlist.");
      fireHaptic("light");
      return;
    }
    const nextEvent = toggleFriendzoneRsvp(rsvpEvent, eventTitle);
    setRsvpEvent(nextEvent);
    setFriendzoneDemoFlow((step) => advanceFriendzoneDemoFlow(step, nextEvent ? "rsvp" : "open-diagnostics"));
    if (nextEvent) {
      setPartyReady(true);
      setInviteStatus(`${eventTitle} RSVP saved`);
      announce(`RSVP saved for ${eventTitle}. Your party is ready for the Plaza event.`);
    } else {
      setInviteStatus("RSVP cancelled");
      announce(`${eventTitle} RSVP cancelled.`);
    }
    fireHaptic("light");
  };

  const retryLivePresence = () => {
    setBridgeLastCheckedLabel(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    if (bridgeRetrying) return;
    setBridgeRetrying(true);
    setFriendzoneDemoFlow((step) => advanceFriendzoneDemoFlow(step, "reconnect"));
    setInviteStatus("Checking live presence…");
    setJudgeWalkthroughFeedback("Checking bridge · offline mirror remains available");
    announce("Checking the live Friendzone bridge.");
    fireHaptic("light");
    if (bridgeRetryRef.current) clearTimeout(bridgeRetryRef.current);
    bridgeRetryRef.current = setTimeout(() => {
      bridgeRetryRef.current = null;
      if (!mountedRef.current) return;
      setBridgeRetrying(false);
      setFriendzoneDemoFlow((step) => advanceFriendzoneDemoFlow(step, "reconnect-complete"));
      const checkedAt = new Date().toISOString();
      const recoveryReason = "offline-mirror" as const;
      setBridgeLastCheckedAt(checkedAt);
      setBridgeRecoveryReason(recoveryReason);
      void writeLocalValue("tug-of-war-bridge-checked-at", checkedAt).then((ok) => {
        if (mountedRef.current && !ok) recordPersistenceFailure("write");
      });
      void writeLocalValue("tug-of-war-bridge-recovery-reason", recoveryReason).then((ok) => {
        if (mountedRef.current && !ok) recordPersistenceFailure("write");
      });
      setInviteStatus("Live presence unavailable — offline mirror active");
      setJudgeWalkthroughFeedback(formatJudgeWalkthroughActionFeedback(2));
      setBridgeToast(bridgeStatusMessage("fallback"));
      if (bridgeToastRef.current) clearTimeout(bridgeToastRef.current);
      bridgeToastRef.current = setTimeout(() => {
        bridgeToastRef.current = null;
        if (mountedRef.current) setBridgeToast(null);
      }, 2600);
      announce("Live presence is unavailable. Offline mirror remains active.");
    }, 650);
  };

  const copyPlazaCoordinates = async () => {
    if (resolveShareActionTransition({ phase: "start", inFlight: shareInFlight, isMounted: mountedRef.current }) === "blocked") { const blockedFeedback = formatJudgeBlockedActionAnnouncement("handoff-busy"); setJudgeWalkthroughFeedback(formatJudgeBlockedActionFeedback("handoff-busy")); announce(blockedFeedback); return; }
    setShareInFlight(true);
    setHandoffAction("copying");
    try {
      const copied = await Clipboard.setStringAsync("Decentraland Plaza · 0,0");
      if (copied === false) throw new Error("Clipboard rejected the coordinate copy request");
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      setInviteStatus("Plaza coordinates copied");
      announce("Decentraland Plaza coordinates copied.");
      fireHaptic("light");
    } catch {
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      const fallback = formatNativeHandoffFailure("plaza-coordinates-copy");
      setInviteStatus(fallback.status);
      announce(fallback.announcement);
    }
    if (mountedRef.current) {
      setShareInFlight(false);
      setHandoffAction("idle");
    }
  };

  useEffect(() => () => {
    if (bridgeRetryRef.current) {
      clearTimeout(bridgeRetryRef.current);
      bridgeRetryRef.current = null;
    }
    if (bridgeToastRef.current) {
      clearTimeout(bridgeToastRef.current);
      bridgeToastRef.current = null;
    }
    if (judgeSettingsToastRef.current) {
      clearTimeout(judgeSettingsToastRef.current);
      judgeSettingsToastRef.current = null;
    }
    if (tutorialFeedbackRef.current) {
      clearTimeout(tutorialFeedbackRef.current);
      tutorialFeedbackRef.current = null;
    }
  }, []);

  const openPlazaWorld = async () => {
    if (resolveShareActionTransition({ phase: "start", inFlight: shareInFlight, isMounted: mountedRef.current }) === "blocked") { const blockedFeedback = formatJudgeBlockedActionAnnouncement("handoff-busy"); setJudgeWalkthroughFeedback(formatJudgeBlockedActionFeedback("handoff-busy")); announce(blockedFeedback); return; }
    setShareInFlight(true);
    setHandoffAction("opening");
    const plazaUrl = "https://play.decentraland.org/?position=0,0";
    try {
      const supported = await Linking.canOpenURL(plazaUrl);
      if (!supported) throw new Error("Decentraland world link unavailable");
      await Linking.openURL(plazaUrl);
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      setInviteStatus("Plaza link opened");
      announce("Decentraland Plaza opened.");
    } catch {
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      const fallback = formatNativeHandoffFailure("plaza-open");
      setInviteStatus(fallback.status);
      announce(fallback.announcement);
    }
    if (shouldCommitAsyncResult(mountedRef.current)) fireHaptic("light");
    if (mountedRef.current) {
      setShareInFlight(false);
      setHandoffAction("idle");
    }
  };

  const sharePlazaEvent = async (eventTitle: FriendzoneShareContext) => {
    if (resolveShareActionTransition({ phase: "start", inFlight: shareInFlight, isMounted: mountedRef.current }) === "blocked") { const blockedFeedback = formatJudgeBlockedActionAnnouncement("handoff-busy"); setJudgeWalkthroughFeedback(formatJudgeBlockedActionFeedback("handoff-busy")); announce(blockedFeedback); return; }
    setShareInFlight(true);
    setHandoffAction("sharing");
    try {
      const shareResult = await Share.share({ message: formatFriendzoneEventShareMessage(eventTitle, partyCode), title: `Join ${eventTitle}` });
      if (resolveNativeShareOutcome(shareResult.action, Share.dismissedAction) === "dismissed") throw new Error("Share sheet dismissed");
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      setInviteStatus(`${eventTitle} invite shared`);
      announce(`${eventTitle} invite shared.`);
    } catch {
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      const fallback = formatNativeHandoffFailure("event-share", eventTitle);
      setInviteStatus(fallback.status);
      announce(fallback.announcement);
    }
    if (shouldCommitAsyncResult(mountedRef.current)) fireHaptic("light");
    if (mountedRef.current) {
      setShareInFlight(false);
      setHandoffAction("idle");
    }
  };

  const sharePartyInvite = async () => {
    if (resolveShareActionTransition({ phase: "start", inFlight: shareInFlight, isMounted: mountedRef.current }) === "blocked") { const blockedFeedback = formatJudgeBlockedActionAnnouncement("handoff-busy"); setJudgeWalkthroughFeedback(formatJudgeBlockedActionFeedback("handoff-busy")); announce(blockedFeedback); return; }
    setShareInFlight(true);
    setHandoffAction("sharing");
    try {
      const inviteUrl = Linking.createURL("invite", { queryParams: { invite: partyCode } });
      const message = `Join my Tug of War Arena crew with code ${partyCode}. Pull together and own the line.\n${inviteUrl}`;
      const shareResult = await Share.share({ message, title: "Join my Tug of War Arena crew" });
      if (resolveNativeShareOutcome(shareResult.action, Share.dismissedAction) === "dismissed") throw new Error("Share sheet dismissed");
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      setInviteStatus("Invite shared");
      announce("Party invite shared.");
    } catch {
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      const fallback = formatNativeHandoffFailure("party-invite-share");
      setInviteStatus(fallback.status);
      announce(fallback.announcement);
    }
    if (shouldCommitAsyncResult(mountedRef.current)) fireHaptic("light");
    if (mountedRef.current) {
      setShareInFlight(false);
      setHandoffAction("idle");
    }
  };

  const shareInviteLink = async () => {
    if (resolveShareActionTransition({ phase: "start", inFlight: shareInFlight, isMounted: mountedRef.current }) === "blocked") { const blockedFeedback = formatJudgeBlockedActionAnnouncement("handoff-busy"); setJudgeWalkthroughFeedback(formatJudgeBlockedActionFeedback("handoff-busy")); announce(blockedFeedback); return; }
    setShareInFlight(true);
    setHandoffAction("sharing");
    try {
      const inviteUrl = Linking.createURL("invite", { queryParams: { invite: partyCode } });
      const shareResult = await Share.share({ message: inviteUrl, title: "Arena Invite Link" });
      if (resolveNativeShareOutcome(shareResult.action, Share.dismissedAction) === "dismissed") throw new Error("Share sheet dismissed");
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      setInviteStatus("Link shared");
      announce("Invite link shared.");
    } catch {
      if (!shouldCommitAsyncResult(mountedRef.current)) return;
      const fallback = formatNativeHandoffFailure("invite-link-share");
      setInviteStatus(fallback.status);
      announce(fallback.announcement);
    }
    if (shouldCommitAsyncResult(mountedRef.current)) fireHaptic("light");
    if (mountedRef.current) {
      setShareInFlight(false);
      setHandoffAction("idle");
    }
  };

  const connectWallet = () => {
    fireHaptic("medium");
    if (walletConnected) {
      setWalletConnected(false);
      setWalletAddress("");
      setJudgeWalkthroughFeedback("Demo wallet disconnected · offline play remains available");
      announce("Demo wallet disconnected. Offline play remains available.");
      return;
    }
    setWalletConnected(true);
    setWalletAddress("0x7A3F...C91D");
    setJudgeWalkthroughFeedback("Demo wallet connected · local receipt ready");
    announce("Demo wallet connected. Local reward receipt is ready.");
  };

  useEffect(() => {
    receiptDetailsOpacity.stopAnimation();
    receiptDetailsScale.stopAnimation();
    if (!receiptDetailsOpen || screen !== "results" || reduceMotion) {
      receiptDetailsOpacity.setValue(receiptDetailsOpen && screen === "results" ? 1 : 0);
      receiptDetailsScale.setValue(1);
      return;
    }
    receiptDetailsOpacity.setValue(0);
    receiptDetailsScale.setValue(0.96);
    const detailsEntrance = Animated.parallel([
      Animated.timing(receiptDetailsOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(receiptDetailsScale, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]);
    detailsEntrance.start();
    return () => {
      detailsEntrance.stop();
      receiptDetailsOpacity.stopAnimation();
      receiptDetailsScale.stopAnimation();
    };
  }, [receiptDetailsOpacity, receiptDetailsOpen, receiptDetailsScale, reduceMotion, screen]);

  useEffect(() => {
    if (screen !== "results") setReceiptDetailsOpen(false);
  }, [screen]);

  const claimRewardPreview = () => {
    if (!playerWon || rewardClaimed || screen !== "results") return;
    fireHaptic("success");
    setRewardClaimed(true);
    const receiptStatus = formatJudgeWalkthroughCompletion(true);
    setJudgeWalkthroughFeedback(receiptStatus);
    announce("Reward receipt saved locally. Minting awaits approved live services.");
    setRewardHistory((current) => [{ id: `receipt-${Date.now()}`, title: "Friendzone Plaza Wearable", pulls: taps, status: "Ready to mint" }, ...current].slice(0, 5));
  };

  const fireHaptic = (kind: "light" | "medium" | "success" = "light") => {
    try {
      if (kind === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      } else {
        Haptics.impactAsync(kind === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      }
    } catch {
      // Haptics are optional; native capability failures must never block play.
    }
  };

  const enterLobby = () => {
    fireHaptic("light");
    setReady(false);
    setScreen("lobby");
  };

  const startMatch = () => {
    fireHaptic("medium");
    setTime(30);
    setPull(0);
    setTaps(0);
    setStreak(0);
    setSurgeReady(false);
    setSurgeActive(false);
    setRewardClaimed(false);
    setJudgeFullWalkthroughStage("idle");
    setJudgeWalkthroughFeedback("Walkthrough ready");
    setJudgeWalkthroughResetStatus("Walkthrough ready");
    resultCountedRef.current = false;
    setScreen("arena");
    announce("Match started. Tap Pull repeatedly to move the rope.");
    try {
      AsyncStorage.getItem("tug-of-war-tutorial-seen").then((seen) => {
        if (!seen) setShowTutorial(true);
      }).catch(() => undefined);
    } catch {
      // Tutorial persistence is optional; the match remains playable.
    }
  };

  useEffect(() => {
    pullRef.current = pull;
  }, [pull]);

  useEffect(() => {
    if (screen !== "arena") return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPull((currentPull) => {
        const nextPull = applyOpponentPressure(currentPull);
        pullRef.current = nextPull;
        return nextPull;
      });
      setStreak((currentStreak) => Math.max(0, currentStreak - 1));
      setTime((current) => {
        if (current <= 1) {
          if (resultCountedRef.current) return 0;
          resultCountedRef.current = true;
          const winningTeam = resolveTimeoutWinner(pullRef.current, team);
          setResult(winningTeam);
          setScreen("results");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [screen, team]);

  useEffect(() => {
    return () => {
      if (surgeTimeoutRef.current) {
        clearTimeout(surgeTimeoutRef.current);
        surgeTimeoutRef.current = null;
      }
    };
  }, []);

  const tapRope = () => {
    if (!canInteractWithArena({ screen, showTutorial, resultCounted: resultCountedRef.current, timeRemaining: time })) return;
    fireHaptic("light");
    const nextTaps = taps + 1;
    const nextStreak = streak + 1;
    const swing = team === "sun" ? 2.3 : 2.1;
    const nextPull = Math.min(44, pull + swing + (nextStreak % 7 === 0 ? 3 : 0));
    setTaps(nextTaps);
    setTotalPulls((current) => current + 1);
    setBestStreak((current) => Math.max(current, nextStreak));
    setStreak(nextStreak);
    setSurgeReady(nextStreak >= 7);
    setPull(nextPull);
    pullRef.current = nextPull;
    const winningTeam = resolveArenaOutcome(nextPull, team);
    if (winningTeam && !resultCountedRef.current) {
      resultCountedRef.current = true;
      setResult(winningTeam);
      fireHaptic("success");
      setScreen("results");
    }
  };
  const useSurge = () => {
    if (!surgeReady || !canInteractWithArena({ screen, showTutorial, resultCounted: resultCountedRef.current, timeRemaining: time })) return;
    fireHaptic("success");
    announce("Power Surge activated. Your next pull is boosted.");
    setSurgeReady(false);
    setSurgeActive(true);
    setPull((current) => {
      const nextPull = Math.min(44, current + 8);
      pullRef.current = nextPull;
      return nextPull;
    });
    if (surgeTimeoutRef.current) clearTimeout(surgeTimeoutRef.current);
    surgeTimeoutRef.current = setTimeout(() => {
      surgeTimeoutRef.current = null;
      setSurgeActive(false);
    }, 2200);
  };

  const showTutorialCompletionFeedback = () => {
    const message = "Onboarding complete · your first match is ready";
    setTutorialFeedback(message);
    announce(message);
    if (tutorialFeedbackRef.current) clearTimeout(tutorialFeedbackRef.current);
    tutorialFeedbackRef.current = setTimeout(() => {
      tutorialFeedbackRef.current = null;
      if (mountedRef.current) setTutorialFeedback(null);
    }, 2400);
  };
  const dismissTutorial = () => {
    if (tutorialStepTimerRef.current) {
      clearTimeout(tutorialStepTimerRef.current);
      tutorialStepTimerRef.current = null;
    }
    setTutorialStepLocked(false);
    setShowTutorial(false);
    setTutorialStep(1);
    writeLocalValue("tug-of-war-tutorial-seen", "1").then((ok) => {
      if (!ok) setStorageWarning(true);
    });
    fireHaptic("light");
  };
  const replayTutorial = () => {
    if (tutorialStepTimerRef.current) {
      clearTimeout(tutorialStepTimerRef.current);
      tutorialStepTimerRef.current = null;
    }
    setTutorialStepLocked(false);
    setTutorialFeedback(null);
    startMatch();
    setTutorialStep(1);
    setShowTutorial(true);
    announce("Onboarding replay started. Step 1 of 3: learn the pull.");
  };
  const advanceTutorial = () => {
    if (tutorialStepLocked) return;
    if (tutorialStep === 3) {
      dismissTutorial();
      showTutorialCompletionFeedback();
      return;
    }
    const nextStep = (tutorialStep + 1) as 1 | 2 | 3;
    setTutorialStep(nextStep);
    if (!reduceMotion) {
      setTutorialStepLocked(true);
      tutorialStepTimerRef.current = setTimeout(() => {
        tutorialStepTimerRef.current = null;
        if (mountedRef.current) setTutorialStepLocked(false);
      }, 280);
    }
    announce(`Onboarding step ${nextStep} of 3.`);
    fireHaptic("light");
  };

  const header = (eyebrow: string, title: string, back = false) => (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {back ? (
        <Pressable onPress={() => setScreen("home")} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <MaterialIcons name="close" size={22} color={C.cloud} />
        </Pressable>
      ) : (
        <View accessibilityLabel="Live status" style={styles.livePill}><Animated.View style={[styles.liveDot, { opacity: livePulse }]} /><Text style={styles.liveText}>LIVE</Text></View>
      )}
    </View>
  );

  const historySummary = useMemo(() => ({
    wins: matchHistory.filter((match) => match.result === "Victory").length,
    defeats: matchHistory.filter((match) => match.result === "Defeat").length,
    total: matchHistory.length,
  }), [matchHistory]);

  const nav = (
    <View style={styles.nav}>
      {[{ key: "home" as Screen, icon: "home", label: "Home" }, { key: "social" as Screen, icon: "groups", label: "Crew" }, { key: "leaderboard" as Screen, icon: "emoji-events", label: "Ranks" }, { key: "settings" as Screen, icon: "tune", label: "Settings" }].map((item) => (
        <Pressable key={item.key} accessibilityRole="button" accessibilityLabel={`Open ${item.label}`} accessibilityHint={`Navigates to the ${item.label} section`} accessibilityState={{ selected: screen === item.key }} onPress={() => setScreen(item.key)} style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
          <MaterialIcons name={item.icon as never} size={22} color={screen === item.key ? C.gold : C.fog} />
          <Text style={[styles.navLabel, screen === item.key && { color: C.gold }]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );

  const clearFullWalkthroughTimers = () => {
    judgeFullWalkthroughTimersRef.current.forEach((timer) => clearTimeout(timer));
    judgeFullWalkthroughTimersRef.current = [];
    judgeFullWalkthroughRunningRef.current = false;
    judgeFullWalkthroughPausedRef.current = false;
    judgeFullWalkthroughNextActionRef.current = 0;
    judgeFullWalkthroughGenerationRef.current += 1;
    setJudgeFullWalkthroughRunning(false);
    setJudgeFullWalkthroughPaused(false);
  };

  const pauseFullJudgeWalkthrough = () => {
    if (!judgeFullWalkthroughRunningRef.current || judgeFullWalkthroughPausedRef.current) return;
    judgeFullWalkthroughTimersRef.current.forEach((timer) => clearTimeout(timer));
    judgeFullWalkthroughTimersRef.current = [];
    judgeFullWalkthroughPausedRef.current = true;
    setJudgeFullWalkthroughRunning(false);
    setJudgeFullWalkthroughPaused(true);
    setJudgeWalkthroughFeedback(formatJudgeFullWalkthroughPauseStatus(judgeFullWalkthroughStage, true));
    announce("Full judge walkthrough paused. Resume to continue the current stage.");
    fireHaptic("light");
  };

  const cancelFullJudgeWalkthrough = () => {
    if (!judgeFullWalkthroughRunningRef.current && !judgeFullWalkthroughPausedRef.current) return;
    const transition = resolveJudgeFullWalkthroughLifecycle("cancel");
    clearFullWalkthroughTimers();
    setJudgeFullWalkthroughStage(transition.stage);
    const cancellationStatus = transition.feedback;
    setJudgeWalkthroughFeedback(cancellationStatus);
    setJudgeWalkthroughRestarting(false);
    showJudgeSettingsToast(cancellationStatus);
    announce("Full judge walkthrough cancelled. Manual controls are active.");
    fireHaptic("light");
  };

  const restartFullJudgeWalkthrough = () => {
    if (judgeFullWalkthroughRunningRef.current || judgeFullWalkthroughPausedRef.current) return;
    const transition = resolveJudgeFullWalkthroughLifecycle("restart");
    judgeFullWalkthroughNextActionRef.current = transition.nextAction;
    const restartStatus = transition.feedback;
    setJudgeWalkthroughFeedback(restartStatus);
    setJudgeWalkthroughRestarting(true);
    showJudgeSettingsToast(restartStatus);
    announce("Full judge walkthrough restarting from the RSVP step.");
    fireHaptic("light");
    runFullJudgeWalkthrough();
  };

  const runFullJudgeWalkthrough = () => {
    const recovery = resolveJudgeRewardHandoffRecovery({
      stage: judgeFullWalkthroughStage,
      isRunning: judgeFullWalkthroughRunningRef.current,
      isPaused: judgeFullWalkthroughPausedRef.current,
    });
    if (recovery === "ignore-completed") {
      const completedFeedback = formatJudgeWalkthroughRewardHandoffAnnouncement("already-completed");
      setJudgeWalkthroughFeedback(completedFeedback);
      announce(completedFeedback);
      return;
    }
    const resuming = recovery === "resume" && canResumeJudgeFullWalkthrough(
      judgeFullWalkthroughPausedRef.current,
      judgeFullWalkthroughRunningRef.current,
    );
    if (judgeFullWalkthroughRunningRef.current && !resuming) return;
    if (!resuming) {
      clearFullWalkthroughTimers();
      judgeFullWalkthroughRunningRef.current = true;
      judgeFullWalkthroughPausedRef.current = false;
      judgeFullWalkthroughNextActionRef.current = 0;
      setJudgeFullWalkthroughRunning(true);
      setJudgeFullWalkthroughPaused(false);
      setJudgeWalkthroughOpen(true);
      setScreen("social");
      setSelectedEvent("Plaza Sprint");
      setJudgeFullWalkthroughStage("rsvp");
      setJudgeWalkthroughResetStatus("Walkthrough ready");
      setJudgeWalkthroughFeedback(formatJudgeWalkthroughActionFeedback(1));
      announce("Full judge walkthrough started. RSVP step opened.");
      fireHaptic("light");
    } else {
      judgeFullWalkthroughPausedRef.current = false;
      setJudgeFullWalkthroughRunning(true);
      setJudgeFullWalkthroughPaused(false);
      setJudgeWalkthroughFeedback(formatJudgeFullWalkthroughPauseStatus(judgeFullWalkthroughStage, false));
      announce("Full judge walkthrough resumed.");
      fireHaptic("light");
    }
    const [, reconnectStep, playStep, rewardStep] = getJudgeFullWalkthroughSequence();
    const delay = getJudgePacingDelay(judgePacingPreset);
    const generation = judgeFullWalkthroughGenerationRef.current;
    const schedule = (actionIndex: 0 | 1 | 2 | 3, callback: () => void, timeout: number) => {
      if (actionIndex < judgeFullWalkthroughNextActionRef.current) return;
      const timer = setTimeout(() => {
        const callbackInput = { isMounted: mountedRef.current, isRunning: judgeFullWalkthroughRunningRef.current, isPaused: judgeFullWalkthroughPausedRef.current, actionIndex, nextAction: judgeFullWalkthroughNextActionRef.current, callbackGeneration: generation, currentGeneration: judgeFullWalkthroughGenerationRef.current };
        if (!canCommitJudgeWalkthroughCallback(callbackInput)) {
          const outcome = resolveJudgeWalkthroughCallbackOutcome(callbackInput);
          if (outcome !== "commit") {
            const ignoredFeedback = formatJudgeWalkthroughCallbackIgnoredFeedback(outcome);
            if (mountedRef.current && outcome !== "ignore-paused") {
              setJudgeWalkthroughFeedback(ignoredFeedback.status);
              announce(ignoredFeedback.announcement);
            }
          }
          return;
        }
        judgeFullWalkthroughNextActionRef.current = Math.min(3, actionIndex + 1) as 0 | 1 | 2 | 3;
        callback();
      }, timeout);
      judgeFullWalkthroughTimersRef.current.push(timer);
    };
    schedule(0, () => {
      if (rsvpEvent !== "Plaza Sprint") toggleEventRsvp("Plaza Sprint");
      setJudgeFullWalkthroughStage("reconnect");
      setJudgeWalkthroughFeedback(formatJudgeWalkthroughActionFeedback(reconnectStep));
    }, delay);
    schedule(1, () => {
      retryLivePresence();
      setJudgeFullWalkthroughStage("reconnect");
      setJudgeWalkthroughFeedback(formatJudgeFullWalkthroughStatus("reconnect"));
    }, delay * 2);
    schedule(2, () => {
      startMatch();
      setJudgeFullWalkthroughStage("play");
      setJudgeWalkthroughFeedback(formatJudgeWalkthroughActionFeedback(playStep));
      announce("Full walkthrough opened the arena. Gameplay preview is running.");
    }, delay * 3 + 650);
    schedule(3, () => {
      resultCountedRef.current = false;
      setResult(team);
      setPull(10);
      setTaps(7);
      setStreak(7);
      setBestStreak((current) => Math.max(current, 7));
      setTotalPulls((current) => current + 7);
      setScreen("results");
      const transition = resolveJudgeFullWalkthroughLifecycle("complete");
      setJudgeFullWalkthroughStage(transition.stage);
      const completionStatus = formatJudgeFullWalkthroughCompleteStatus();
      setJudgeWalkthroughFeedback(completionStatus);
      showJudgeSettingsToast(completionStatus);
      announce(formatJudgeWalkthroughRewardHandoffAnnouncement("completed"));
      fireHaptic("success");
      judgeFullWalkthroughRunningRef.current = false;
      judgeFullWalkthroughPausedRef.current = false;
      judgeFullWalkthroughNextActionRef.current = 0;
      judgeFullWalkthroughGenerationRef.current += 1;
      setJudgeFullWalkthroughRunning(false);
      setJudgeFullWalkthroughPaused(false);
      judgeFullWalkthroughTimersRef.current = [];
    }, delay * 4 + 650);
  };

  const resetJudgeSettings = () => {
    const manualMode = getJudgeManualModeSettings();
    setJudgeAutoAdvance(manualMode.autoAdvance);
    setJudgePacingPreset(manualMode.pacingPreset);
    void Promise.all([writeLocalValue(JUDGE_AUTO_ADVANCE_KEY, String(manualMode.autoAdvance)), writeLocalValue(JUDGE_PACING_PRESET_KEY, manualMode.pacingPreset)]).then(([autoAdvanceSaved, pacingSaved]) => {
      if (mountedRef.current && (!autoAdvanceSaved || !pacingSaved)) recordPersistenceFailure("write");
    });
    setJudgeWalkthroughFeedback("Presenter settings reset · manual controls active · Standard pacing");
    announce("Presenter settings reset. Manual controls are active.");
    fireHaptic("light");
  };

  const resetJudgeWalkthrough = () => {
    const resetIntent = resolveJudgeWalkthroughResetIntent({
      isRunning: judgeFullWalkthroughRunningRef.current,
      isPaused: judgeFullWalkthroughPausedRef.current,
      isCompleted: isJudgeFullWalkthroughTerminal({ stage: judgeFullWalkthroughStage, isRunning: judgeFullWalkthroughRunningRef.current, isPaused: judgeFullWalkthroughPausedRef.current }),
    });
    if (!shouldInvalidateJudgeWalkthroughCallbacks(resetIntent)) return;
    clearFullWalkthroughTimers();
    setJudgeFullWalkthroughStage("idle");
    setJudgeWalkthroughRestarting(false);
    setFriendzoneDemoFlow("idle");
    setSelectedEvent(null);
    setScreen("social");
    setJudgeWalkthroughOpen(true);
    const resetFeedback = formatJudgeWalkthroughResetStatus();
    setJudgeWalkthroughResetStatus(resetFeedback);
    setJudgeWalkthroughFeedback(resetFeedback);
    announce("Judge walkthrough reset to RSVP. Gameplay and saved demo data were kept.");
    fireHaptic("light");
  };

  const runJudgeWalkthroughStep = (step: JudgeWalkthroughStep) => {
    if (!canRunJudgeWalkthroughManualStep({ isRunning: judgeFullWalkthroughRunningRef.current, isPaused: judgeFullWalkthroughPausedRef.current })) { const blockedFeedback = formatJudgeBlockedActionAnnouncement(judgeFullWalkthroughPausedRef.current ? "walkthrough-paused" : "walkthrough-running"); setJudgeWalkthroughFeedback(formatJudgeBlockedActionFeedback(judgeFullWalkthroughPausedRef.current ? "walkthrough-paused" : "walkthrough-running")); announce(blockedFeedback); return; }
    clearFullWalkthroughTimers();
    setJudgeFullWalkthroughStage("idle");
    fireHaptic("light");
    if (step === 1) {
      setScreen("social");
      setSelectedEvent("Plaza Sprint");
      setJudgeWalkthroughFeedback(formatJudgeWalkthroughActionFeedback(1));
      announce("Step one opened. RSVP to Plaza Sprint in Friendzone Plaza.");
    } else if (step === 2) {
      setScreen("social");
      retryLivePresence();
      announce("Step two started. Checking the Friendzone bridge.");
    } else if (step === 3) {
      startMatch();
      setJudgeWalkthroughFeedback(formatJudgeWalkthroughActionFeedback(3));
      announce("Step three opened. Play tug of war in the arena.");
    } else {
      resultCountedRef.current = false;
      setResult(team);
      setPull(10);
      setTaps(7);
      setStreak(7);
      setBestStreak((current) => Math.max(current, 7));
      setTotalPulls((current) => current + 7);
      setScreen("results");
      setJudgeWalkthroughFeedback(formatJudgeWalkthroughActionFeedback(4));
      announce("Step four opened. Review the wallet-ready reward receipt.");
    }
  };

  useEffect(() => {
    if (!judgeAutoAdvance || !judgeWalkthroughOpen || screen === "results" || judgeFullWalkthroughRunningRef.current) return;
    if (screen === "social" && friendzoneDemoFlow === "rsvp-saved") {
      const timer = setTimeout(() => {
        if (mountedRef.current && judgeAutoAdvance) retryLivePresence();
      }, getJudgePacingDelay(judgePacingPreset));
      return () => clearTimeout(timer);
    }
    if (screen === "social" && friendzoneDemoFlow === "diagnostics" && !bridgeRetrying) {
      const timer = setTimeout(() => {
        if (mountedRef.current && judgeAutoAdvance) {
          startMatch();
          setJudgeWalkthroughFeedback(formatJudgeWalkthroughActionFeedback(3));
        }
      }, getJudgePacingDelay(judgePacingPreset));
      return () => clearTimeout(timer);
    }
    return undefined;
    // The action handlers intentionally remain local to the screen; mounted and enabled guards protect delayed work.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridgeRetrying, friendzoneDemoFlow, judgeAutoAdvance, judgePacingPreset, judgeWalkthroughOpen, screen]);

  const judgeWalkthroughStep = deriveJudgeWalkthroughStep(friendzoneDemoFlow, screen);
  const judgeWalkthroughCompletedCount = ([1, 2, 3, 4] as const).filter((step) => isJudgeWalkthroughStepComplete(step, judgeWalkthroughStep, rewardClaimed)).length;
  const judgeWalkthroughActiveStep = getJudgeFullWalkthroughActiveStep(judgeFullWalkthroughStage, judgeWalkthroughStep);
  const judgeWalkthroughSummary = formatJudgeWalkthroughDemoSummary({ stage: judgeFullWalkthroughStage, isRunning: judgeFullWalkthroughRunning, isPaused: judgeFullWalkthroughPaused, completedCount: judgeWalkthroughCompletedCount, currentStep: judgeWalkthroughActiveStep });
  const judgeWalkthroughStatusAnnouncement = formatJudgeWalkthroughStatusAnnouncement(judgeWalkthroughSummary);
  const judgeWalkthroughTransitionSummary = formatJudgeWalkthroughTransitionSummary({ stage: judgeFullWalkthroughStage, feedback: judgeWalkthroughFeedback, nextAction: judgeWalkthroughSummary.nextAction });
  const judgeWalkthroughPanelAccessibility = formatJudgeWalkthroughPanelAccessibility(judgeWalkthroughOpen, judgeWalkthroughStatusAnnouncement);
  const judgeWalkthroughProofSummary = formatJudgeWalkthroughProofSummary({ bridgeLabel: bridgeStatusLabel, walletConnected, rewardClaimed });
  const judgeWalkthroughProofFreshness = formatJudgeWalkthroughProofFreshness(bridgeStatusLabel);
  const bridgeHealthFreshness = formatBridgeHealthFreshness(bridgeLastCheckedLabel);
  const bridgeHealthFreshnessPresentation = formatBridgeHealthFreshnessPresentation(bridgeLastCheckedAt, bridgeRetrying);
  const bridgeHealthDiagnosticsSummary = formatBridgeHealthDiagnosticsSummary({ statusLabel: bridgeStatusLabel, freshnessLabel: bridgeHealthFreshness, recoverySummary: formatBridgeRecoveryReason(bridgeRecoveryReason, bridgeRetrying ? "checking" : bridgeRecoveryReason ? "fallback" : "ready") });
  const judgeWalkthroughProofPresentation = formatJudgeWalkthroughProofPresentation({ bridgeLabel: bridgeStatusLabel, walletConnected, rewardClaimed });
  const judgeWalkthroughProofLiveRegion = formatJudgeWalkthroughProofLiveRegion(judgeWalkthroughProofSummary);
  const judgeWalkthroughPanelLiveRegion = formatJudgeWalkthroughPanelLiveRegion(judgeWalkthroughOpen);
  const matchResultAccessibilityPresentation = formatMatchResultAccessibilityPresentation(playerWon);
  const judgeWalkthroughLifecycleLiveRegion = formatJudgeWalkthroughLifecycleLiveRegion(judgeWalkthroughSummary);
  const judgeWalkthroughResetIntent = resolveJudgeWalkthroughResetIntent({ isRunning: judgeFullWalkthroughRunning, isPaused: judgeFullWalkthroughPaused, isCompleted: judgeFullWalkthroughStage === "reward" });
  const judgeWalkthroughResetControlPresentation = formatJudgeWalkthroughResetControlPresentation(judgeWalkthroughResetIntent);
  const judgeWalkthroughResetFeedbackLiveRegion = formatJudgeWalkthroughResetFeedbackLiveRegion(judgeWalkthroughResetStatus);
  const judgePrimaryControlPresentation = formatJudgeWalkthroughPrimaryControlPresentation({ stage: judgeFullWalkthroughStage, isRunning: judgeFullWalkthroughRunning, isPaused: judgeFullWalkthroughPaused, nextAction: judgeWalkthroughSummary.nextAction });
  const judgeWalkthroughLifecyclePresentation = formatJudgeWalkthroughLifecyclePresentation({ stage: judgeFullWalkthroughStage, isRunning: judgeFullWalkthroughRunning, isPaused: judgeFullWalkthroughPaused });
  const judgeWalkthroughLifecycleAccessibilityState = formatJudgeWalkthroughLifecycleAccessibilityState({ stage: judgeFullWalkthroughStage, isRunning: judgeFullWalkthroughRunning, isPaused: judgeFullWalkthroughPaused });
  const judgeCurrentStepNavigation = resolveJudgeCurrentStepNavigation({ stage: judgeFullWalkthroughStage, isRunning: judgeFullWalkthroughRunning, isPaused: judgeFullWalkthroughPaused });
  const judgeCurrentStepNavigationFeedback = formatJudgeCurrentStepNavigationFeedback(judgeCurrentStepNavigation, judgeWalkthroughSummary.nextAction);

  if (screen === "home") {
    return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#11142B]" className="px-5">
      {header("MATCHMAKING / 01", "Pick your side", true)}
      {acceptedInviteCode && <View accessibilityRole="alert" style={styles.inviteArrivalBanner}><View style={styles.inviteArrivalIcon}><MaterialIcons name="mark-email-read" size={18} color={C.ink} /></View><View style={styles.inviteArrivalCopy}><Text style={styles.cardKicker}>FRIENDZONE INVITE ACCEPTED</Text><Text style={styles.inviteArrivalTitle}>{acceptedInviteCode} is ready</Text><Text style={styles.inviteArrivalMeta}>Choose a crew below, then enter the arena with your Decentraland party.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Dismiss invite arrival" onPress={() => setAcceptedInviteCode(null)} style={({ pressed }) => [styles.inviteDismiss, pressed && styles.pressed]}><MaterialIcons name="close" size={17} color={C.fog} /></Pressable></View>}
      <View style={styles.lobbyCard}>
        <Text style={styles.cardKicker}>{acceptedInviteCode ? "DECENTRALAND PARTY HANDOFF" : "QUICK MATCH FOUND"}</Text>
        <Text style={styles.lobbyTitle}>{acceptedInviteCode ? "Your crew is calling." : "Two teams. One rope."}</Text>
        <Text style={styles.body}>{acceptedInviteCode ? "This invite brought you from the Friendzone plaza. Pick your banner, ready up, and keep the party moving." : "Choose your banner, ready up, and pull your crew across the line."}</Text>
        <Text accessibilityRole="summary" accessibilityLiveRegion="polite" accessibilityLabel={firstMatchProgressPresentation.accessibilityLabel} style={styles.historyMeta}>{firstMatchProgressPresentation.label}</Text>
      </View>
      <View style={styles.teamGrid}>
        {(["sun", "moon"] as Team[]).map((candidate) => {
          const selected = candidate === team;
          const color = candidate === "sun" ? C.coral : C.cyan;
          return <Pressable key={candidate} onPress={() => { setTeam(candidate); fireHaptic("light"); }} style={({ pressed }) => [styles.teamCard, { borderColor: selected ? color : "#3A407A", backgroundColor: selected ? `${color}1A` : C.midnight }, pressed && styles.pressed]}>
            <View style={[styles.teamOrb, { backgroundColor: color }]}><MaterialIcons name={candidate === "sun" ? "wb-sunny" : "nightlight-round"} size={28} color={C.ink} /></View>
            <Text style={styles.teamName}>{candidate === "sun" ? "SUN CREW" : "MOON CREW"}</Text>
            <Text style={styles.teamMeta}>{candidate === "sun" ? "Bright. Bold. Unstoppable." : "Cool. Calm. Calculated."}</Text>
            {selected && <View style={[styles.selectedPill, { backgroundColor: color }]}><Text style={styles.selectedText}>SELECTED</Text></View>}
          </Pressable>;
        })}
      </View>
      <Animated.View accessibilityLiveRegion="polite" style={[styles.readyRow, { transform: [{ scale: readinessScale }] }]}><View><Text style={styles.readyTitle}>{readinessPresentation.statusTitle}</Text><Text style={styles.body}>{readinessPresentation.statusHint}</Text></View><Pressable accessibilityRole="switch" accessibilityLabel={readinessPresentation.readyAccessibilityLabel} accessibilityHint={readinessPresentation.readyHint} accessibilityState={{ checked: ready }} onPress={() => { const nextReady = !ready; if (!reduceMotion) { readinessScale.setValue(0.985); Animated.timing(readinessScale, { toValue: 1, duration: 180, useNativeDriver: true }).start(); } setReady(nextReady); fireHaptic("medium"); }} style={({ pressed }) => [styles.readyButton, { backgroundColor: ready ? C.mint : C.gold }, pressed && styles.pressed]}><Text style={styles.readyButtonText}>{readinessPresentation.readyLabel}</Text></Pressable></Animated.View>
      <Pressable accessibilityRole="button" accessibilityLabel={readinessPresentation.entryAccessibilityLabel} accessibilityHint={readinessPresentation.entryHint} accessibilityState={{ disabled: readinessPresentation.entryDisabled }} disabled={readinessPresentation.entryDisabled} onPress={startMatch} style={({ pressed }) => [styles.primaryButton, { opacity: ready ? 1 : 0.45 }, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>ENTER THE ARENA</Text><MaterialIcons name="arrow-forward" size={22} color={C.ink} /></Pressable>
    </ScreenContainer>;
  }

  if (screen === "arena") {
    const arenaActionsEnabled = canInteractWithArena({ screen, showTutorial, resultCounted: resultCountedRef.current, timeRemaining: time });
    return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#11142B]" className="px-5">
      <View style={styles.arenaTop}><View><Text style={styles.eyebrow}>DECENTRALAND FRIENDZONE / PLAZA</Text><Text style={styles.arenaTitle}>PULL TO WIN</Text></View><View accessibilityRole="timer" accessibilityLabel={arenaTimerAccessibilityPresentation.label} accessibilityHint={arenaTimerAccessibilityPresentation.hint} accessibilityValue={{ min: 0, max: 60, now: arenaTimerAccessibilityPresentation.now, text: arenaTimerAccessibilityPresentation.valueText }} style={styles.timer}><Text style={styles.timerValue}>{String(arenaTimerAccessibilityPresentation.now).padStart(2, "0")}</Text><Text style={styles.timerLabel}>SEC</Text></View></View>
      <View style={styles.scoreRow}><View><Text accessibilityRole="summary" accessibilityLabel={`${arenaScoreAccessibilityPresentation.crew.label}: ${arenaScoreAccessibilityPresentation.crew.now} percent`} style={[styles.scoreNumber, { color: teamColor }]}>{arenaScoreAccessibilityPresentation.crew.now}</Text><Text style={styles.scoreLabel}>{arenaScoreAccessibilityPresentation.crew.label.toUpperCase()}</Text></View><Text style={styles.vs}>VS</Text><View style={styles.scoreRight}><Text accessibilityRole="summary" accessibilityLabel={`${arenaScoreAccessibilityPresentation.opponent.label}: ${arenaScoreAccessibilityPresentation.opponent.now} percent`} style={[styles.scoreNumber, { color: opponentColor }]}>{arenaScoreAccessibilityPresentation.opponent.now}</Text><Text style={styles.scoreLabel}>{arenaScoreAccessibilityPresentation.opponent.label.toUpperCase()}</Text></View></View>
      <View accessibilityRole="progressbar" accessibilityLabel={powerTrackAccessibilityPresentation.label} accessibilityHint={powerTrackAccessibilityPresentation.hint} accessibilityValue={{ min: 0, max: 100, now: powerTrackAccessibilityPresentation.now, text: powerTrackAccessibilityPresentation.valueText }} style={styles.powerTrack}><View style={[styles.powerFill, { width: `${powerLeft}%`, backgroundColor: teamColor }]} /><View style={styles.centerMarker} /></View>
      <View style={styles.arenaPanel}><View style={styles.fenceLine} /><View style={[styles.rope, { transform: [{ translateX: pull * 1.1 }] }]}><View style={[styles.ropeKnot, { backgroundColor: teamColor }]} /><View style={styles.ropeLine} /><View style={[styles.ropeKnot, { backgroundColor: opponentColor }]} /></View><View style={styles.playersRow}><Text style={styles.playerEmoji}>☀</Text><Text style={styles.playerEmoji}>☀</Text><View style={styles.centerFlag}><Text style={styles.flagText}>GO</Text></View><Text style={styles.playerEmoji}>☾</Text><Text style={styles.playerEmoji}>☾</Text></View><Text accessibilityRole="summary" accessibilityLiveRegion="polite" accessibilityLabel={firstPullCoachingPresentation.accessibilityLabel} style={styles.arenaHint}>{firstPullCoachingPresentation.label}</Text></View>
      <View style={styles.streakRow}><Text style={styles.streakLabel}>CURRENT STREAK</Text><Text style={[styles.streakValue, { color: streak > 0 ? C.gold : C.fog }]}>{streak} taps</Text><Text style={styles.streakBoost}>{streak > 0 && streak % 7 === 0 ? "+3 BOOST" : "BUILD MOMENTUM"}</Text></View>
      <View style={styles.arenaActions}><Pressable accessibilityLabel="Pull the rope" accessibilityHint={arenaActionsEnabled ? "Tap repeatedly to move the rope toward your team" : "Pulling is unavailable while the match is paused, finished, or onboarding is open"} accessibilityState={{ disabled: !arenaActionsEnabled }} onPress={tapRope} disabled={!arenaActionsEnabled} style={({ pressed }) => [styles.tapButton, { backgroundColor: teamColor, opacity: arenaActionsEnabled ? 1 : 0.45 }, pressed && styles.tapPressed]}><MaterialIcons name="touch-app" size={36} color={C.ink} /><Text style={styles.tapText}>PULL!</Text><Text style={styles.tapSubtext}>tap fast</Text></Pressable><Pressable accessibilityLabel="Use power surge" accessibilityHint={surgeReady && arenaActionsEnabled ? "Activates your charged Power Surge" : "Power Surge is unavailable until seven taps are charged and the match is active"} accessibilityState={{ disabled: !surgeReady || !arenaActionsEnabled }} onPress={useSurge} disabled={!surgeReady || !arenaActionsEnabled} style={({ pressed }) => [styles.surgeButton, { borderColor: surgeReady && arenaActionsEnabled ? C.gold : "#3A407A", opacity: surgeReady && arenaActionsEnabled ? 1 : 0.45 }, pressed && styles.pressed]}><MaterialIcons name="bolt" size={25} color={C.gold} /><Text style={styles.surgeText}>{surgeActive ? "SURGING" : "SURGE"}</Text><Text style={styles.surgeSubtext}>{surgeReady && arenaActionsEnabled ? "ready" : "7 streak"}</Text></Pressable></View>
      <Text accessibilityRole="summary" accessibilityLiveRegion="polite" accessibilityLabel={`Arena progress: ${taps} total pulls, current streak ${streak} taps, best streak ${bestStreak}`} style={styles.tapCount}>{taps} total pulls · best {bestStreak}</Text>
      {showTutorial && <View accessibilityRole="summary" accessibilityViewIsModal accessibilityLiveRegion="polite" accessibilityLabel={`First match onboarding, step ${tutorialStep} of 3`} style={styles.tutorialBackdrop}><Animated.View style={[styles.tutorialCard, { opacity: tutorialOpacity, transform: [{ scale: tutorialScale }] }]}><View style={styles.tutorialIcon}><MaterialIcons name={tutorialStep === 1 ? "touch-app" : tutorialStep === 2 ? "groups" : "bolt"} size={30} color={C.ink} /></View><Text style={styles.tutorialKicker}>FIRST MATCH / 0{tutorialStep}</Text><Text style={styles.tutorialTitle}>{tutorialStep === 1 ? "Find your rhythm." : tutorialStep === 2 ? "Pull with your crew." : "Charge the surge."}</Text><Text style={styles.bodyCenter}>{tutorialStep === 1 ? "Tap Pull rapidly to move the rope." : tutorialStep === 2 ? "Your chosen crew sets the banner, color, and social context for the round." : "Hit seven taps in a row to charge Power Surge, then spend it to swing the rope."}</Text><View accessibilityRole="progressbar" accessibilityLabel="First match onboarding progress" accessibilityValue={{ min: 1, max: 3, now: tutorialStep }} style={styles.tutorialSteps}>{([1, 2, 3] as const).map((step) => <View key={step} style={[styles.tutorialStep, step <= tutorialStep && styles.tutorialStepActive]} />)}<Text style={styles.tutorialStepLabel}>{tutorialStep} of 3 · {tutorialStep === 1 ? "Learn the pull" : tutorialStep === 2 ? "Choose your crew" : "Use Power Surge"}</Text></View><View style={styles.tutorialActions}><Pressable accessibilityRole="button" accessibilityLabel={tutorialStep === 3 ? "Start the match" : "Show the next onboarding tip"} accessibilityHint={tutorialStep === 3 ? "Closes onboarding and starts your first pull" : "Moves to the next first-match tip"} accessibilityState={{ disabled: tutorialStepLocked }} onPress={advanceTutorial} disabled={tutorialStepLocked} style={({ pressed }) => [styles.primaryButton, styles.tutorialNext, tutorialStepLocked && { opacity: 0.65 }, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{tutorialStep === 3 ? "START MATCH" : "NEXT TIP"}</Text><MaterialIcons name="arrow-forward" size={22} color={C.ink} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Skip first-match onboarding" accessibilityHint="Closes onboarding and keeps offline play available" onPress={dismissTutorial} style={({ pressed }) => [styles.tutorialSkip, pressed && styles.pressed]}><Text style={styles.tutorialSkipText}>SKIP FOR NOW</Text></Pressable></View></Animated.View></View>}{tutorialFeedback && <Animated.View accessibilityRole="alert" accessibilityLabel={tutorialFeedback} accessibilityLiveRegion="polite" style={[styles.judgeSettingsToastRow, { opacity: tutorialFeedbackOpacity, transform: [{ scale: tutorialFeedbackScale }] }]}><View style={styles.judgeSettingsToastContent}><MaterialIcons name="check-circle" size={16} color={C.mint} /><Text style={[styles.activityMeta, { color: C.mint }]}>{tutorialFeedback}</Text><Pressable accessibilityRole="button" accessibilityLabel="Replay first-match onboarding" accessibilityHint="Starts the three-step tutorial again without clearing saved progress" onPress={replayTutorial} style={({ pressed }) => [styles.judgeSettingsToastAction, pressed && styles.pressed]}><Text style={styles.judgeSettingsToastActionText}>REPLAY</Text><MaterialIcons name="replay" size={15} color={C.gold} /></Pressable></View></Animated.View>}
    </ScreenContainer>;
  }

  if (screen === "results") {
    return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#11142B]" className="px-5">
      <View accessibilityRole="summary" accessibilityLabel={matchResultAccessibilityPresentation.label} accessibilityHint={matchResultAccessibilityPresentation.hint} accessibilityLiveRegion="polite" style={styles.resultHero}>{playerWon && !reduceMotion && <Animated.View accessibilityLabel="Victory celebration" style={[styles.celebrationBurst, { opacity: celebrationOpacity, transform: [{ scale: celebrationScale }] }]}><View style={styles.confettiRow}><Text style={styles.confetti}>✦</Text><Text style={styles.confetti}>✧</Text><Text style={styles.confetti}>✦</Text></View></Animated.View>}<View style={[styles.resultOrb, { backgroundColor: playerWon ? C.gold : C.coral }]}><MaterialIcons name={playerWon ? "emoji-events" : "refresh"} size={44} color={C.ink} /></View><Text style={styles.eyebrow}>MATCH COMPLETE · {playerWon ? "VICTORY" : "DEFEAT"}</Text><Text style={styles.resultTitle}>{playerWon ? "YOU PULLED IT OFF" : "THE ROPE SLIPPED"}</Text><Text style={styles.bodyCenter}>{playerWon ? `Your ${team === "sun" ? "Sun Crew" : "Moon Crew"} found the final burst.` : "Your crew held strong. Run it back and own the next round."}</Text></View>
      <View accessibilityLabel={`Match recap: ${taps} pulls, ${streak} streak, ${playerWon ? "win" : "loss"}`} style={styles.resultStats}><View><Text style={styles.statValue}>{taps}</Text><Text style={styles.statLabel}>TOTAL PULLS</Text></View><View><Text style={styles.statValue}>{Math.max(1, Math.round(Math.abs(pull) * 1.8))}</Text><Text style={styles.statLabel}>POWER SCORE</Text></View><View><Text style={styles.statValue}>0,0</Text><Text style={styles.statLabel}>PLAZA PARCEL</Text></View></View>
      <View accessibilityRole="summary" accessibilityLabel={rewardPresentation.accessibilityLabel} style={styles.rewardCard}><View><Text style={styles.cardKicker}>DECENTRALAND REWARD PREVIEW</Text><Text style={styles.rewardTitle}>{rewardPresentation.title}</Text><Text style={styles.rewardMeta}>{rewardPresentation.metadata}</Text></View><Animated.View style={rewardClaimed ? { opacity: receiptSavedOpacity, transform: [{ scale: receiptSavedScale }] } : undefined}><MaterialIcons name={rewardPresentation.icon} size={28} color={rewardPresentation.tone === "success" ? C.mint : C.gold} /></Animated.View></View><View accessibilityRole="summary" accessibilityLabel={formatJudgeWalkthroughCompletion(rewardClaimed)} style={[styles.activityCard, { borderColor: C.mint }]}><Text style={styles.cardKicker}>JUDGE WALKTHROUGH</Text><Text accessibilityLiveRegion="polite" style={styles.activityTitle}>{formatJudgeWalkthroughCompletion(rewardClaimed)}</Text><Text style={styles.activityMeta}>RSVP, reconnect, gameplay, and reward surfaces are ready to review.</Text></View>
      {playerWon && walletConnected && <Pressable accessibilityRole="button" accessibilityLabel={rewardActionPresentation.label} accessibilityHint={rewardActionPresentation.hint} accessibilityState={rewardActionPresentation.accessibilityState} disabled={rewardActionPresentation.disabled} onPress={claimRewardPreview} style={({ pressed }) => [styles.rewardButton, rewardClaimed && { opacity: 0.7 }, pressed && styles.pressed]}><Text style={styles.rewardButtonText}>{rewardClaimed ? "REWARD RECEIPT SAVED" : "SAVE CLAIM RECEIPT"}</Text></Pressable>}
      {playerWon && <Pressable accessibilityRole="button" accessibilityLabel={receiptDetailsPresentation.label} accessibilityHint={receiptDetailsPresentation.hint} accessibilityState={receiptDetailsPresentation.accessibilityState} onPress={() => setReceiptDetailsOpen((current) => !current)} style={({ pressed }) => [styles.wearableDetailsButton, pressed && styles.pressed]}><Text style={styles.wearableDetailsText}>{receiptDetailsOpen ? "HIDE RECEIPT DETAILS" : "VIEW RECEIPT DETAILS"}</Text><MaterialIcons name={receiptDetailsOpen ? "expand-less" : "expand-more"} size={19} color={C.gold} /></Pressable>}
      {playerWon && receiptDetailsOpen && <Animated.View accessibilityRole="summary" accessibilityLiveRegion="polite" accessibilityLabel="Local receipt details: Friendzone Plaza Wearable, Sunlit Thread trait, earned from this local match, ready to mint only after approved live services" style={[styles.wearableDetailsCard, { opacity: receiptDetailsOpacity, transform: [{ scale: receiptDetailsScale }] }]}><Text style={styles.cardKicker}>LOCAL RECEIPT DETAILS</Text><Text style={styles.activityMeta}>Asset · Friendzone Plaza Wearable</Text><Text style={styles.activityMeta}>Trait · Sunlit Thread</Text><Text style={styles.activityMeta}>Source · This local match</Text><Text style={styles.activityMeta}>Claim boundary · Minting awaits approved live services</Text></Animated.View>}
      <View style={styles.plazaCard}><View style={styles.plazaCardCopy}><Text style={styles.cardKicker}>DECENTRALAND PLAZA MATCH CARD</Text><Text style={styles.plazaCardTitle}>{playerWon ? "Victory at Plaza 0,0" : "Run it back at Plaza 0,0"}</Text><Text style={styles.plazaCardMeta}>{rsvpEvent ?? "Friendzone open play"} · {partyCode}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Share Decentraland Plaza match card" onPress={() => sharePlazaEvent("Plaza Match Recap")} style={({ pressed }) => [styles.plazaShare, pressed && styles.pressed]}><MaterialIcons name="ios-share" size={19} color={C.ink} /></Pressable></View><View style={styles.recapSummary}><Text style={styles.cardKicker}>MATCH RECAP</Text><Text style={styles.recapSummaryText}>{playerWon ? "Momentum secured" : "Momentum is building"} · {taps} pulls · best streak {bestStreak}</Text><Pressable accessibilityRole="button" accessibilityLabel="Prepare this match recap to share" onPress={prepareRecapShare} style={({ pressed }) => [styles.recapShareButton, pressed && styles.pressed]}><Text style={styles.recapShareText}>{shareStatus.toUpperCase()}</Text><MaterialIcons name="ios-share" size={17} color={C.gold} /></Pressable></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Run the match again" onPress={startMatch} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>RUN IT BACK</Text><MaterialIcons name="replay" size={22} color={C.ink} /></Pressable>
      <Pressable accessibilityLabel="Return to the arena home screen" onPress={() => setScreen("home")} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>BACK TO HOME</Text></Pressable>
    </ScreenContainer>;
  }

  if (screen === "leaderboard") {
    return <ScreenContainer className="px-5">{header("FRIENDZONE / GLOBAL", "Top pullers")}<Text style={styles.body}>A lightweight local leaderboard for the live demo. Climb it by building a faster streak.</Text><View style={styles.rankList}>{leaderboard.map((entry) => <View key={entry.rank} style={[styles.rankRow, entry.name === "You" && styles.youRow]}><Text style={[styles.rankNumber, entry.rank === 1 && { color: C.gold }]}>{String(entry.rank).padStart(2, "0")}</Text><View style={styles.rankNameWrap}><Text style={styles.rankName}>{entry.name}</Text><Text style={styles.rankMeta}>{entry.wins} wins · {entry.taps} pulls</Text></View>{entry.rank === 1 ? <MaterialIcons name="emoji-events" size={22} color={C.gold} /> : <Text style={styles.rankArrow}>›</Text>}</View>)}</View>{nav}</ScreenContainer>;
  }

  if (screen === "social") {
    const crew = demoCrew;
    const liveEvents: { title: FriendzoneEventTitle; detail: string }[] = [{ title: "Plaza Sprint", detail: `Starts in ${String(Math.floor(eventCountdown / 60)).padStart(2, "0")}:${String(eventCountdown % 60).padStart(2, "0")} · 14/16 seats` }, { title: "Wearable Rush", detail: `${eventWaitlisted ? "Waitlist joined" : "24/24 seats"} · badge preview` }];
    const friendzoneContacts = demoFriendzoneContacts;
    return <ScreenContainer className="px-5">{header("FRIENDZONE / CREW LOUNGE", "Pull together")}<View accessibilityLabel="Decentraland bridge status" style={styles.partyBanner}><View><Text style={styles.cardKicker}>DECENTRALAND BRIDGE</Text><Text style={styles.partyTitle}>Friendzone relay · local demo</Text><Text style={styles.body}>Party, parcel, and reward context are ready offline. Live presence and minting connect when approved services are available.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Open the Decentraland Plaza world" onPress={openPlazaWorld} style={({ pressed }) => [styles.partyButton, pressed && styles.pressed]}><Text style={styles.partyButtonText}>OPEN</Text></Pressable></View><View accessibilityLabel={`Friendzone handoff step ${formatFriendzoneDemoFlowStep(friendzoneDemoFlow).toLowerCase()}`} style={styles.activityCard}><Text style={styles.cardKicker}>FRIENDZONE HANDOFF</Text><Text style={styles.activityTitle}>{formatFriendzoneDemoFlowStep(friendzoneDemoFlow)}</Text><Text style={styles.activityMeta}>RSVP → reconnect → Diagnostics · offline mirror stays available</Text></View><Pressable accessibilityRole="button" accessibilityLiveRegion={judgeWalkthroughPanelLiveRegion.accessibilityLiveRegion} accessibilityLabel={judgeWalkthroughPanelLiveRegion.accessibilityLabel} accessibilityHint={judgeWalkthroughOpen ? "Collapses the four-step judge demo guide" : "Expands the four-step judge demo guide"} accessibilityState={{ expanded: judgeWalkthroughOpen }} onPress={() => setJudgeWalkthroughOpen((value) => !value)} style={({ pressed }) => [styles.recapButton, pressed && styles.pressed]}><Text style={styles.recapButtonText}>{judgeWalkthroughOpen ? "HIDE JUDGE WALKTHROUGH" : "SHOW JUDGE WALKTHROUGH"}</Text><MaterialIcons name={judgeWalkthroughOpen ? "expand-less" : "expand-more"} size={17} color={C.gold} /></Pressable>{judgeWalkthroughOpen && <View accessibilityRole="summary" accessibilityLabel={`${judgeWalkthroughPanelAccessibility.accessibilityLabel} ${judgeWalkthroughProofSummary}`} accessibilityState={judgeWalkthroughPanelAccessibility.accessibilityState} style={styles.activityCard}><Text style={styles.cardKicker}>JUDGE WALKTHROUGH</Text><Text style={styles.activityTitle}>Four moments to show</Text><View accessibilityLabel={`Walkthrough lifecycle: ${judgeWalkthroughLifecyclePresentation.badge}`} accessibilityState={judgeWalkthroughLifecycleAccessibilityState} style={styles.judgeBridgeSummary}><MaterialIcons name={judgeWalkthroughLifecyclePresentation.icon} size={15} color={judgeWalkthroughLifecyclePresentation.tone === "success" ? C.mint : judgeWalkthroughLifecyclePresentation.tone === "warning" ? C.gold : judgeWalkthroughLifecyclePresentation.tone === "accent" ? C.cyan : C.fog} /><Text style={[styles.activityMeta, { color: judgeWalkthroughLifecyclePresentation.tone === "success" ? C.mint : judgeWalkthroughLifecyclePresentation.tone === "warning" ? C.gold : judgeWalkthroughLifecyclePresentation.tone === "accent" ? C.cyan : C.fog, marginTop: 0 }]}>{judgeWalkthroughLifecyclePresentation.badge}</Text></View><View accessibilityLabel={`Bridge status ${bridgeStatusLabel.toLowerCase()}. Offline mirror ready.`} style={styles.judgeBridgeSummary}><MaterialIcons name={bridgeStatusIcon} size={15} color={bridgeStatusColor} /><Text style={[styles.activityMeta, { color: bridgeStatusColor, marginTop: 0 }]}>Bridge · {bridgeStatusLabel} · offline mirror ready</Text></View><View accessibilityLabel={`Wallet ${walletConnected ? "connected" : "not connected"}. Local receipt ${rewardClaimed ? "saved" : "ready"}.`} style={styles.judgeBridgeSummary}><MaterialIcons name="account-balance-wallet" size={15} color={walletConnected ? C.mint : C.gold} /><Text style={[styles.activityMeta, { color: walletConnected ? C.mint : C.gold, marginTop: 0 }]}>Wallet · {walletConnected ? "connected" : "ready to connect"} · local receipt {rewardClaimed ? "saved" : "ready"}</Text>{!walletConnected && <Pressable accessibilityRole="button" accessibilityLabel="Connect demo wallet for the walkthrough" accessibilityHint="Connects a local demo wallet without leaving the offline experience" onPress={connectWallet} style={({ pressed }) => [styles.judgeWalletConnectAction, pressed && styles.pressed]}><Text style={styles.judgeWalletConnectText}>CONNECT</Text></Pressable>}</View><View accessibilityRole="summary" accessibilityLabel={`Friendzone Plaza Wearable receipt ${rewardClaimed ? "saved locally and ready to mint when live services approve" : "preview ready locally; no on-chain mint has occurred"}`} style={styles.judgeReceiptSummary}><MaterialIcons name="receipt-long" size={15} color={C.mint} /><View style={styles.judgeReceiptCopy}><Text style={styles.judgeReceiptTitle}>RECEIPT · {rewardClaimed ? "SAVED LOCALLY" : "LOCAL PREVIEW"}</Text><Text style={styles.judgeReceiptMeta}>Friendzone Plaza Wearable · ready to mint when live services approve</Text></View></View><View accessibilityLabel={judgeWalkthroughProofLiveRegion.accessibilityLabel} accessibilityLiveRegion={judgeWalkthroughProofLiveRegion.accessibilityLiveRegion} style={styles.judgeBridgeSummary}><MaterialIcons name={judgeWalkthroughProofPresentation.icon} size={15} color={judgeWalkthroughProofPresentation.tone === "success" ? C.mint : judgeWalkthroughProofPresentation.tone === "accent" ? C.cyan : C.gold} /><View style={styles.judgeReceiptCopy}><Text style={[styles.activityMeta, { color: judgeWalkthroughProofPresentation.tone === "success" ? C.mint : judgeWalkthroughProofPresentation.tone === "accent" ? C.cyan : C.gold, marginTop: 0 }]}>{judgeWalkthroughProofSummary}</Text><Text style={styles.judgeReceiptMeta}>{judgeWalkthroughProofFreshness} · {bridgeHealthFreshness}</Text></View></View><View accessibilityRole="summary" accessibilityLabel={judgeWalkthroughTransitionSummary.accessibilityLabel} accessibilityLiveRegion="polite" style={styles.judgeTransitionSummary}><Text style={styles.cardKicker}>LATEST TRANSITION</Text><Text style={styles.activityMeta}>{judgeWalkthroughTransitionSummary.label}</Text></View><View accessibilityLiveRegion="polite"><Text style={styles.activityMeta}>{judgeWalkthroughSummary.progress}</Text><Text style={[styles.activityMeta, { color: C.gold, marginTop: 4 }]}>{judgeWalkthroughSummary.nextAction}</Text></View><View accessibilityRole="progressbar" accessibilityLabel={`Judge walkthrough progress: ${judgeWalkthroughSummary.progress}. ${judgeWalkthroughSummary.nextAction}`} accessibilityValue={{ min: 0, max: 4, now: judgeWalkthroughCompletedCount }} style={styles.walkthroughProgress}><View style={styles.walkthroughProgressTrack}><View style={[styles.walkthroughProgressFill, { width: `${(judgeWalkthroughCompletedCount / 4) * 100}%` }]} /></View><View style={styles.walkthroughProgressSteps}>{getJudgeFullWalkthroughSequence().map((step) => { const complete = isJudgeWalkthroughStepComplete(step, judgeWalkthroughStep, rewardClaimed); const active = judgeWalkthroughActiveStep === step; return <View key={step} accessibilityLabel={`Walkthrough step ${step}${complete ? " complete" : active ? " current" : ""}`} accessibilityState={{ checked: complete, selected: active }} style={[styles.walkthroughProgressStep, complete && styles.walkthroughProgressComplete, active && styles.walkthroughProgressActive]}><Text style={[styles.walkthroughProgressStepText, (complete || active) && styles.walkthroughProgressStepTextActive]}>{complete ? "✓" : step}</Text></View>; })}</View></View><Pressable accessibilityRole="button" accessibilityLabel={judgeCurrentStepNavigationFeedback.label} accessibilityHint={judgeCurrentStepNavigationFeedback.hint} accessibilityState={{ disabled: judgeCurrentStepNavigation !== "allow" }} onPress={() => runJudgeWalkthroughStep(judgeWalkthroughActiveStep)} disabled={judgeCurrentStepNavigation !== "allow"} style={({ pressed }) => [styles.recapButton, judgeCurrentStepNavigation !== "allow" && { opacity: 0.45 }, pressed && styles.pressed]}><Text style={styles.recapButtonText}>{judgeCurrentStepNavigationFeedback.label.toUpperCase()}</Text><MaterialIcons name="arrow-forward" size={17} color={C.gold} /></Pressable><Text accessibilityLiveRegion="polite" style={styles.activityMeta}>{judgeCurrentStepNavigationFeedback.hint}</Text><Pressable accessibilityRole="button" accessibilityLabel={judgePrimaryControlPresentation.label} accessibilityHint={judgePrimaryControlPresentation.hint} accessibilityState={{ busy: judgePrimaryControlPresentation.busy, disabled: judgePrimaryControlPresentation.disabled }} onPress={runFullJudgeWalkthrough} disabled={judgePrimaryControlPresentation.disabled} style={({ pressed }) => [styles.primaryButton, judgePrimaryControlPresentation.disabled && { opacity: 0.55 }, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{judgePrimaryControlPresentation.label}</Text><MaterialIcons name={judgePrimaryControlPresentation.icon} size={20} color={C.ink} /></Pressable><Text accessibilityLabel={judgeWalkthroughLifecycleLiveRegion.accessibilityLabel} accessibilityLiveRegion={judgeWalkthroughLifecycleLiveRegion.accessibilityLiveRegion} style={styles.activityMeta}>{judgeWalkthroughSummary.status}</Text><Pressable accessibilityRole="button" accessibilityLabel={judgeFullWalkthroughPaused ? "Resume the full judge walkthrough" : "Pause the full judge walkthrough"} accessibilityHint={judgeFullWalkthroughPaused ? "Continue from the current walkthrough stage" : "Temporarily stop automatic stage transitions"} onPress={judgeFullWalkthroughPaused ? runFullJudgeWalkthrough : pauseFullJudgeWalkthrough} disabled={!judgeFullWalkthroughRunning && !judgeFullWalkthroughPaused} style={({ pressed }) => [styles.recapButton, (!judgeFullWalkthroughRunning && !judgeFullWalkthroughPaused) && { opacity: 0.45 }, pressed && styles.pressed]}><Text style={styles.recapButtonText}>{judgeFullWalkthroughPaused ? "RESUME WALKTHROUGH" : "PAUSE WALKTHROUGH"}</Text><MaterialIcons name={judgeFullWalkthroughPaused ? "play-arrow" : "pause"} size={17} color={C.gold} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Cancel the full judge walkthrough" accessibilityHint="Stops automatic walkthrough transitions and returns to manual controls" onPress={cancelFullJudgeWalkthrough} disabled={!judgeFullWalkthroughRunning && !judgeFullWalkthroughPaused} style={({ pressed }) => [styles.recapButton, (!judgeFullWalkthroughRunning && !judgeFullWalkthroughPaused) && { opacity: 0.45 }, pressed && styles.pressed]}><Text style={styles.recapButtonText}>CANCEL WALKTHROUGH</Text><MaterialIcons name="stop-circle" size={17} color={C.gold} /></Pressable><Pressable accessibilityRole="switch"
 accessibilityState={{ checked: judgeAutoAdvance }} accessibilityLabel="Toggle automatic judge walkthrough advance" accessibilityHint="Automatically continues the RSVP and reconnect handoff steps" onPress={() => { const nextValue = !judgeAutoAdvance; setJudgeAutoAdvance(nextValue); void writeLocalValue(JUDGE_AUTO_ADVANCE_KEY, String(nextValue)).then((ok) => { if (!ok) recordPersistenceFailure("write"); }); setJudgeWalkthroughFeedback(formatJudgeAutoAdvanceStatus(nextValue)); }} style={({ pressed }) => [styles.recapButton, pressed && styles.pressed]}><Text style={styles.recapButtonText}>{judgeAutoAdvance ? "AUTO-ADVANCE ON" : "AUTO-ADVANCE OFF"}</Text><MaterialIcons name={judgeAutoAdvance ? "play-circle-filled" : "pause-circle-outline"} size={17} color={C.gold} /></Pressable><Text accessibilityLiveRegion="polite" style={styles.activityMeta}>{formatJudgeAutoAdvanceStatus(judgeAutoAdvance)}</Text><Pressable accessibilityRole="button" accessibilityLabel="Enable Presenter Mode" accessibilityHint="Turns on auto-advance and selects the slower Presenter pacing" onPress={() => { const presenterMode = getJudgePresenterModeSettings(); setJudgeAutoAdvance(presenterMode.autoAdvance); setJudgePacingPreset(presenterMode.pacingPreset); void Promise.all([writeLocalValue(JUDGE_AUTO_ADVANCE_KEY, String(presenterMode.autoAdvance)), writeLocalValue(JUDGE_PACING_PRESET_KEY, presenterMode.pacingPreset)]).then(([autoAdvanceSaved, pacingSaved]) => { if (mountedRef.current && (!autoAdvanceSaved || !pacingSaved)) recordPersistenceFailure("write"); }); setJudgeWalkthroughFeedback("Presenter Mode on · auto-advance enabled · 1.4s handoffs"); announce("Presenter Mode enabled."); fireHaptic("light"); }} style={({ pressed }) => [styles.recapButton, pressed && styles.pressed]}><Text style={styles.recapButtonText}>ENABLE PRESENTER MODE</Text><MaterialIcons name="slideshow" size={17} color={C.gold} /></Pressable><View accessibilityLabel={`Judge walkthrough pacing presets: ${formatJudgeTimingStatus(judgeAutoAdvance, judgePacingPreset)}`} style={styles.bridgeActions}>{(["quick", "standard", "presenter"] as const).map((preset) => <Pressable key={preset} accessibilityRole="radio" accessibilityState={{ selected: judgePacingPreset === preset }} accessibilityLabel={`Use ${preset} walkthrough pacing`} onPress={() => { setJudgePacingPreset(preset); void writeLocalValue(JUDGE_PACING_PRESET_KEY, preset).then((ok) => { if (mountedRef.current && !ok) recordPersistenceFailure("write"); }); announce(`${formatJudgePacingPreset(preset)} selected.`); fireHaptic("light"); }} style={({ pressed }) => [styles.recapButton, judgePacingPreset === preset && styles.matchHistorySelected, pressed && styles.pressed]}><Text style={styles.recapButtonText}>{(formatJudgePacingPreset(preset).split(" · ")[0] ?? "").toUpperCase()}</Text></Pressable>)}</View><Text accessibilityLiveRegion="polite" style={styles.activityMeta}>{formatJudgeTimingStatus(judgeAutoAdvance, judgePacingPreset)}</Text>{([1, 2, 3, 4] as const).map((step) => <Pressable key={step} accessibilityRole="button" accessibilityState={{ selected: judgeWalkthroughStep === step, checked: isJudgeWalkthroughStepComplete(step, judgeWalkthroughStep, rewardClaimed) }} accessibilityLabel={`${isJudgeWalkthroughStepComplete(step, judgeWalkthroughStep, rewardClaimed) ? "Completed" : judgeWalkthroughStep === step ? "Current" : "Open"} walkthrough step ${step}: ${formatJudgeWalkthroughStep(step).toLowerCase()}`} onPress={() => runJudgeWalkthroughStep(step)} style={({ pressed }) => [styles.activityLine, judgeWalkthroughStep === step && styles.matchHistorySelected, isJudgeWalkthroughStepComplete(step, judgeWalkthroughStep, rewardClaimed) && styles.reactionSelected, pressed && styles.pressed]}><Text style={styles.activityLine}>{step}. {formatJudgeWalkthroughStep(step)}{isJudgeWalkthroughStepComplete(step, judgeWalkthroughStep, rewardClaimed) ? " · COMPLETE" : judgeWalkthroughStep === step ? " · CURRENT" : ""}</Text><MaterialIcons name={isJudgeWalkthroughStepComplete(step, judgeWalkthroughStep, rewardClaimed) ? "check-circle" : judgeWalkthroughStep === step ? "radio-button-checked" : "arrow-forward"} size={16} color={isJudgeWalkthroughStepComplete(step, judgeWalkthroughStep, rewardClaimed) ? C.mint : C.gold} /></Pressable>)}<Text accessibilityLiveRegion="polite" style={styles.activityMeta}>Current step: {formatJudgeWalkthroughStep(judgeWalkthroughStep)} · offline mirror stays available.</Text><Pressable accessibilityRole="button" accessibilityLabel="Reset Presenter settings" accessibilityHint="Turns off auto-advance and restores Standard pacing without clearing gameplay data" onPress={resetJudgeSettings} style={({ pressed }) => [styles.recapButton, pressed && styles.pressed]}><Text style={styles.recapButtonText}>RESET PRESENTER SETTINGS</Text><MaterialIcons name="settings-backup-restore" size={17} color={C.gold} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={judgeWalkthroughResetControlPresentation.label} accessibilityHint={judgeWalkthroughResetControlPresentation.hint} accessibilityState={{ busy: judgeWalkthroughResetIntent === "reset-active" }} onPress={resetJudgeWalkthrough} style={({ pressed }) => [styles.recapButton, pressed && styles.pressed]}><Text style={styles.recapButtonText}>{judgeWalkthroughResetControlPresentation.label}</Text><MaterialIcons name="replay" size={17} color={C.gold} /></Pressable><Text accessibilityLabel={judgeWalkthroughResetFeedbackLiveRegion.accessibilityLabel} accessibilityLiveRegion={judgeWalkthroughResetFeedbackLiveRegion.accessibilityLiveRegion} style={styles.activityMeta}>{judgeWalkthroughResetStatus}</Text><Text accessibilityLiveRegion="polite" style={styles.activityMeta}>{judgeWalkthroughFeedback}</Text>{judgeSettingsToast && <View style={styles.judgeSettingsToastRow}><View accessibilityRole="alert" accessibilityLabel={judgeWalkthroughRestarting ? "Restarting the full judge walkthrough" : judgeSettingsToast} accessibilityState={{ busy: judgeWalkthroughRestarting }} accessibilityLiveRegion="polite" style={styles.judgeSettingsToastContent}><MaterialIcons accessibilityElementsHidden accessible={false} name={judgeWalkthroughRestarting ? "sync" : judgeSettingsToast.includes("complete") ? "check-circle" : "info-outline"} size={16} color={judgeWalkthroughRestarting || !judgeSettingsToast.includes("complete") ? C.gold : C.mint} /><Text style={[styles.activityMeta, { color: C.mint }]}>{judgeSettingsToast}</Text>{judgeWalkthroughRestarting && <View accessibilityLabel="Restarting the full judge walkthrough" accessibilityLiveRegion="polite" style={styles.judgeRestartingIndicator}>{reduceMotion ? <MaterialIcons accessibilityLabel="Restarting" name="sync" size={15} color={C.gold} /> : <ActivityIndicator accessibilityLabel="Restarting" size="small" color={C.gold} />}<Text style={styles.judgeRestartingText}>RESTARTING…</Text></View>}</View>{(judgeSettingsToast === formatJudgeFullWalkthroughCancelStatus() || judgeSettingsToast === formatJudgeFullWalkthroughCompleteStatus()) && <Pressable accessibilityRole="button" accessibilityLabel="Run the full judge walkthrough again" accessibilityHint="Starts a fresh walkthrough from the RSVP step without clearing saved demo data" onPress={restartFullJudgeWalkthrough} style={({ pressed }) => [styles.judgeSettingsToastAction, pressed && styles.pressed]}><Text style={styles.judgeSettingsToastActionText}>{judgeSettingsToast === formatJudgeFullWalkthroughCompleteStatus() ? "RUN AGAIN" : "RESTART"}</Text><MaterialIcons name="replay" size={15} color={C.gold} /></Pressable>}</View>}</View>}<View accessibilityLabel={`Decentraland bridge health. ${bridgeHealthDiagnosticsSummary}`} accessibilityLiveRegion="polite" style={styles.activityCard}><Text style={styles.cardKicker}>BRIDGE HEALTH</Text><Text accessibilityLiveRegion="polite" style={styles.historyMeta}>{bridgeHealthDiagnosticsSummary}</Text><Text style={styles.activityLine}>Offline mirror · READY</Text><Text style={styles.activityLine}>Party handoff · READY</Text><View accessibilityLabel={`Live presence ${bridgeStatusLabel.toLowerCase()}`} style={styles.bridgeStatusRow}><MaterialIcons name={bridgeStatusIcon} size={16} color={bridgeStatusColor} /><Text style={[styles.activityLine, { color: bridgeStatusColor }]}>Live presence · {bridgeStatusLabel}</Text></View><Text style={styles.activityLine}>Wallet rewards · WALLET-READY</Text><View style={styles.bridgeActions}><Pressable accessibilityRole="button" accessibilityLabel={bridgeRetrying ? "Checking live Friendzone presence" : "Retry live Friendzone presence"} accessibilityHint="Checks the live bridge and keeps the offline mirror available" accessibilityState={{ busy: bridgeRetrying, disabled: bridgeRetrying }} onPress={retryLivePresence} disabled={bridgeRetrying} style={({ pressed }) => [styles.recapButton, bridgeRetrying && { opacity: 0.55 }, pressed && styles.pressed]}>{bridgeRetrying && <ActivityIndicator accessibilityLabel="Checking live Friendzone presence" color={C.gold} size="small" />}<Text style={styles.recapButtonText}>{bridgeRetrying ? "CHECKING…" : "RETRY PRESENCE"}</Text><MaterialIcons name="sync" size={17} color={C.gold} /></Pressable>{bridgeToast && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.activityMeta, { color: C.gold }]}>STATUS · {bridgeToast}</Text>}<Pressable accessibilityRole="button" accessibilityLabel="Open Decentraland bridge diagnostics" onPress={() => { setScreen("settings"); setDiagnosticsOpen(true); announce("Bridge diagnostics opened. Offline mirror remains ready."); }} style={({ pressed }) => [styles.recapButton, pressed && styles.pressed]}><Text style={styles.recapButtonText}>DIAGNOSTICS</Text><MaterialIcons name="arrow-forward" size={17} color={C.gold} /></Pressable></View></View><View style={styles.eventTicker}><View style={styles.eventTickerHeader}><Text style={styles.cardKicker}>DECENTRALAND PLAZA / LOCAL MIRROR</Text><Text style={styles.eventTickerStatus}>PLAZA 0,0</Text></View>{liveEvents.map((event) => <Pressable key={event.title} accessibilityRole="button" accessibilityLabel={`View details for ${event.title}`} onPress={() => { setSelectedEvent(event.title); fireHaptic("light"); }} style={({ pressed }) => [styles.eventRow, pressed && styles.pressed]}><MaterialIcons name="event" size={18} color={C.gold} /><View style={styles.eventCopy}><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventMeta}>{event.title === "Wearable Rush" ? (eventWaitlisted ? "Waitlist position #3 · party handoff ready" : event.detail) : (rsvpEvent === event.title ? "RSVP saved · party handoff ready" : event.detail)}</Text>{event.title === "Plaza Sprint" && <View accessibilityLabel="14 of 16 Plaza Sprint seats claimed" style={styles.capacityTrack}><View style={[styles.capacityFill, { width: "87.5%" }]} /></View>}{event.title === "Wearable Rush" && <View accessibilityLabel={eventWaitlisted ? "Waitlist position 3" : "Event full, waitlist open"} style={styles.capacityTrack}><View style={[styles.capacityFill, styles.capacityFillFull, { width: "100%" }]} /></View>}</View><Text style={styles.eventArrow}>›</Text></Pressable>)}</View><View accessibilityLabel="Decentraland Friendzone Plaza Chronicle" style={styles.chronicleCard}><View style={styles.chronicleIcon}><MaterialIcons name="auto-stories" size={22} color={C.ink} /></View><View style={styles.chronicleCopy}><Text style={styles.cardKicker}>PLAZA CHRONICLE · CHAPTER 01</Text><Text style={styles.chronicleTitle}>The relay wakes at parcel 0,0.</Text><Text style={styles.chronicleMeta}>{rsvpEvent ? `${rsvpEvent} is on your crew route.` : "The Friendzone gathers when the rope starts to move."} {wearableEquipped ? "Your Plaza Band is equipped for the next pull." : "Win a round to record a wearable-ready receipt."}</Text><Pressable accessibilityRole="button" accessibilityLabel="Open the Plaza Sprint chronicle event" onPress={() => { setSelectedEvent("Plaza Sprint"); announce("Plaza Chronicle opened. The relay is waiting at parcel 0,0."); fireHaptic("light"); }} style={({ pressed }) => [styles.chronicleAction, pressed && styles.pressed]}><Text style={styles.chronicleActionText}>FOLLOW THE RELAY</Text><MaterialIcons name="arrow-forward" size={16} color={C.gold} /></Pressable></View></View><View style={styles.partyBanner}><View><Text style={styles.cardKicker}>QUICK PARTY</Text><Text style={styles.partyTitle}>{partyReady ? "Your crew is ready" : "Build a crew for the next match"}</Text><Text style={styles.body}>{partyReady ? "Three players are waiting in the lounge." : "Invite energy, emotes, and friendly rivalry into the arena."}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={partyReady ? "Leave quick party" : "Join quick party"} accessibilityHint={partyReady ? "Leaves the local three-player party" : "Joins the local quick party for the next match"} accessibilityState={{ selected: partyReady }} onPress={() => { setPartyReady((value) => !value); fireHaptic("medium"); }} style={({ pressed }) => [styles.partyButton, pressed && styles.pressed]}><Text style={styles.partyButtonText}>{partyReady ? "LEAVE" : "JOIN"}</Text></Pressable></View><View style={styles.inviteCard}><View><Text style={styles.cardKicker}>PARTY INVITE</Text><Text style={styles.inviteCode}>{partyCode}</Text><Text style={styles.inviteMeta}>{inviteStatus} · 3 member slots</Text></View><View style={styles.inviteActions}><Pressable accessibilityRole="button" accessibilityLabel={shareInFlight && handoffAction === "copying" ? "Copying party code" : `Copy party code ${partyCode}`} accessibilityHint={shareInFlight ? "Wait for the current handoff to finish" : "Copies the party code to the clipboard"} accessibilityState={{ busy: shareInFlight && handoffAction === "copying", disabled: shareInFlight }} onPress={copyPartyCode} disabled={shareInFlight} style={({ pressed }) => [styles.inviteActionSecondary, shareInFlight && { opacity: 0.55 }, pressed && styles.pressed]}><MaterialIcons name="content-copy" size={19} color={C.gold} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={shareInFlight ? "Sharing party invite link" : "Share party invite link"} accessibilityHint="Shares the local party link through the available native handoff" accessibilityState={{ busy: shareInFlight, disabled: shareInFlight }} onPress={shareInviteLink} disabled={shareInFlight} style={({ pressed }) => [styles.inviteActionSecondary, shareInFlight && { opacity: 0.55 }, pressed && styles.pressed]}><MaterialIcons name="link" size={19} color={C.gold} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={shareInFlight ? "Sharing party invite" : "Share party invite"} accessibilityHint="Opens the native share sheet when available" accessibilityState={{ busy: shareInFlight, disabled: shareInFlight }} onPress={sharePartyInvite} disabled={shareInFlight} style={({ pressed }) => [styles.inviteAction, shareInFlight && { opacity: 0.55 }, pressed && styles.pressed]}><MaterialIcons name="ios-share" size={19} color={C.ink} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Generate a new party code" onPress={refreshPartyCode} style={({ pressed }) => [styles.inviteActionSecondary, pressed && styles.pressed]}><MaterialIcons name="refresh" size={19} color={C.gold} /></Pressable></View></View>{recentCrew.length > 0 && <><Text style={styles.sectionTitle}>RECENT CREW</Text><View style={styles.contactList}>{recentCrew.map((member) => <View key={member} style={styles.contactRow}><View style={styles.contactAvatar}><MaterialIcons name="history" size={19} color={C.gold} /></View><View style={styles.crewCopy}><Text style={styles.crewName}>{member}</Text><Text style={styles.crewMeta}>Recent Friendzone teammate</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Re-invite ${member}`} onPress={() => inviteRecentCrewMember(member)} style={({ pressed }) => [styles.contactInvite, pressed && styles.pressed]}><Text style={styles.contactInviteText}>RE-INVITE</Text></Pressable></View>)}</View></>}{recentCrew.length === 0 && <View accessibilityRole="summary" accessibilityLabel="No recent crew yet. Invite a friend to build your first local party." style={styles.activityCard}><MaterialIcons name="group-add" size={22} color={C.gold} /><Text style={styles.activityTitle}>Bring your first teammate</Text><Text style={styles.body}>Share the party code so a friend can join the Friendzone relay and appear here after your first match.</Text><Pressable accessibilityRole="button" accessibilityLabel="Share a party invite to build your first crew" accessibilityHint="Opens the available native share handoff for your local party invite" onPress={sharePartyInvite} disabled={shareInFlight} style={({ pressed }) => [styles.recapButton, shareInFlight && { opacity: 0.55 }, pressed && styles.pressed]}><Text style={styles.recapButtonText}>{shareInFlight ? "SHARING…" : "SHARE PARTY INVITE"}</Text><MaterialIcons name="ios-share" size={17} color={C.gold} /></Pressable></View>}<Text style={styles.sectionTitle}>CREW ONLINE</Text><View style={styles.crewList}>{crew.map((member) => <View key={member.name} style={styles.crewRow}><View style={[styles.avatar, { backgroundColor: member.online ? C.cyan : "#3A407A" }]}><Text style={styles.avatarText}>{member.name.slice(0, 1)}</Text></View><View style={styles.crewCopy}><Text style={styles.crewName}>{member.name}</Text><Text style={styles.crewMeta}>{member.role}</Text></View><View style={[styles.onlineDot, { backgroundColor: member.online ? C.mint : C.fog }]} /></View>)}</View><Text style={styles.sectionTitle}>QUICK REACTIONS</Text><View style={styles.reactionRow}>{[{ icon: "⚡", name: "Energy" }, { icon: "🔥", name: "Fire" }, { icon: "👏", name: "Clap" }, { icon: "😤", name: "Flex" }, { icon: "🏆", name: "Celebrate" }].map((emote) => <Pressable key={emote.icon} accessibilityRole="button" accessibilityLabel={`Send ${emote.name} emote`} accessibilityState={{ selected: reaction === emote.icon }} onPress={() => { setReaction(emote.icon); announce(`${emote.name} emote sent.`); fireHaptic("light"); }} style={({ pressed }) => [styles.reactionButton, reaction === emote.icon && styles.reactionSelected, pressed && styles.pressed]}><Text style={styles.reactionText}>{emote.icon}</Text><Text style={styles.reactionLabel}>{emote.name}</Text></Pressable>)}</View><Text style={styles.sectionTitle}>FRIENDZONE CONTACTS NEARBY</Text><View style={styles.contactList}>{friendzoneContacts.map((contact) => <View key={contact.name} style={styles.contactRow}><View style={styles.contactAvatar}><MaterialIcons name="person-pin-circle" size={20} color={C.gold} /></View><View style={styles.crewCopy}><Text style={styles.crewName}>{contact.name}</Text><Text style={styles.crewMeta}>{contact.status} · {contact.distance}</Text></View><Pressable accessibilityLabel={`Invite ${contact.name}`} onPress={() => { rememberCrewMember(contact.name); setPartyReady(true); setInviteStatus(`Invite sent to ${contact.name}`); announce(`${contact.name} was invited from the Decentraland Friendzone.`); fireHaptic("light"); }} style={({ pressed }) => [styles.contactInvite, pressed && styles.pressed]}><Text style={styles.contactInviteText}>INVITE</Text></Pressable></View>)}</View><View style={styles.activityCard}><Text style={styles.cardKicker}>ACTIVITY FEED</Text><Text style={styles.activityTitle}>You are {reaction} ready for the next pull.</Text><Text style={styles.activityMeta}>Local demo activity · updates instantly on this device</Text><View style={styles.activityDivider} /><Text style={styles.activityLine}>NovaNina joined the Sun Crew lounge</Text><Text style={styles.activityLine}>PixelPuller sent a “run it back” reaction</Text>{rewardHistory.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Open latest match recap" onPress={() => setScreen("results")} style={({ pressed }) => [styles.recapButton, pressed && styles.pressed]}><Text style={styles.recapButtonText}>OPEN LATEST MATCH RECAP</Text><MaterialIcons name="arrow-forward" size={17} color={C.gold} /></Pressable>}</View>{nav}{selectedEvent && <View style={styles.tutorialBackdrop}><View style={styles.tutorialCard}><View style={styles.tutorialIcon}><MaterialIcons name="event" size={30} color={C.ink} /></View><Text style={styles.tutorialKicker}>PLAZA EVENT / {selectedEvent.toUpperCase()}</Text><Text style={styles.tutorialTitle}>{selectedEvent === "Plaza Sprint" ? "A fast, social relay." : "Unlock a badge preview."}</Text><Text style={styles.eventCapacity}>{selectedEvent === "Plaza Sprint" ? `14 of 16 seats claimed · ${String(Math.floor(eventCountdown / 60)).padStart(2, "0")}:${String(eventCountdown % 60).padStart(2, "0")} until start` : (eventWaitlisted ? "24 of 24 seats claimed · waitlist position #3" : "24 of 24 seats claimed · waitlist open")}</Text><Text style={styles.bodyCenter}>{selectedEvent === "Plaza Sprint" ? "Join the Sun or Moon crew at Plaza 0,0. The fastest pullers earn a place on the global leaderboard." : "Pull together with your crew to unlock a Wearable Airdrop preview receipt for the next approved mint."}</Text><View accessibilityLabel="Decentraland Plaza parcel map" style={styles.parcelMap}>{Array.from({ length: 9 }, (_, index) => <View key={index} style={[styles.parcelTile, index === 4 && styles.parcelTileActive]}>{index === 4 && <MaterialIcons name="location-on" size={20} color={C.ink} />}</View>)}</View><Text style={styles.parcelMapCaption}>Parcel 0,0 · Friendzone Plaza relay</Text><View style={styles.plazaHandoffActions}><Pressable accessibilityRole="button" accessibilityLabel={plazaCopyAccessibility.label} accessibilityHint={plazaCopyAccessibility.hint} accessibilityState={{ busy: plazaCopyAccessibility.busy, disabled: plazaCopyAccessibility.disabled }} onPress={copyPlazaCoordinates} disabled={shareInFlight} style={({ pressed }) => [styles.plazaHandoffButton, shareInFlight && { opacity: 0.55 }, pressed && styles.pressed]}><MaterialIcons name="content-copy" size={16} color={C.gold} /><Text style={styles.plazaHandoffText}>{handoffAction === "copying" ? "COPYING…" : "COPY 0,0"}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={plazaShareAccessibility.label} accessibilityHint={plazaShareAccessibility.hint} accessibilityState={{ busy: plazaShareAccessibility.busy, disabled: plazaShareAccessibility.disabled }} onPress={() => { const selection = recoverFriendzoneModalSelection(selectedEvent); if (selection.shouldClose) { setSelectedEvent(null); return; } sharePlazaEvent(selection.eventTitle); }} disabled={shareInFlight} style={({ pressed }) => [styles.plazaHandoffButton, shareInFlight && { opacity: 0.55 }, pressed && styles.pressed]}><MaterialIcons name="ios-share" size={16} color={C.gold} /><Text style={styles.plazaHandoffText}>{shareInFlight ? "SHARING…" : "SHARE EVENT"}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={plazaOpenAccessibility.label} accessibilityHint={plazaOpenAccessibility.hint} accessibilityState={{ busy: plazaOpenAccessibility.busy, disabled: plazaOpenAccessibility.disabled }} onPress={openPlazaWorld} disabled={shareInFlight} style={({ pressed }) => [styles.plazaHandoffButton, shareInFlight && { opacity: 0.55 }, pressed && styles.pressed]}><MaterialIcons name="open-in-new" size={16} color={C.gold} /><Text style={styles.plazaHandoffText}>{handoffAction === "opening" ? "OPENING…" : "OPEN PLAZA"}</Text></Pressable></View><View style={styles.eventModalActions}><Pressable accessibilityRole="button" accessibilityLabel={`${rsvpEvent === selectedEvent ? "Cancel" : "RSVP to"} ${selectedEvent}`} onPress={() => { const selection = recoverFriendzoneModalSelection(selectedEvent); if (selection.shouldClose) { setSelectedEvent(null); return; } toggleEventRsvp(selection.eventTitle); setSelectedEvent(null); }} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{selectedEvent === "Wearable Rush" ? (eventWaitlisted ? "LEAVE WAITLIST" : "JOIN WAITLIST") : (rsvpEvent === selectedEvent ? "CANCEL RSVP" : "RSVP & JOIN PARTY")}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Close event details" onPress={() => setSelectedEvent(null)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>CLOSE</Text></Pressable></View></View></View>}</ScreenContainer>;
  }

  if (screen === "settings") {
    return <ScreenContainer className="px-5">{header("PLAYER CONTROL", "Settings")}<Text style={styles.body}>Tune the arena for your demo. These preferences stay local to this device.</Text>{storageWarning && <Text accessibilityRole="alert" style={styles.storageWarning}>Local progress could not be loaded. You can still play normally.</Text>}<Pressable accessibilityRole="button" accessibilityLabel="Replay first-match onboarding" accessibilityHint="Opens the three-step tutorial without clearing your saved progress" onPress={replayTutorial} style={({ pressed }) => [styles.recapButton, pressed && styles.pressed]}><Text style={styles.recapShareText}>REPLAY TUTORIAL</Text><MaterialIcons name="school" size={19} color={C.gold} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={diagnosticsOpen ? "Hide demo diagnostics" : "Open demo diagnostics"} accessibilityHint={diagnosticsOpen ? "Collapses bridge, storage, reset, and presenter status" : "Expands bridge, storage, reset, and presenter status"} accessibilityState={{ expanded: diagnosticsOpen }} onPress={() => setDiagnosticsOpen((value) => !value)} style={({ pressed }) => [styles.recapButton, pressed && styles.pressed]}><Text style={styles.recapShareText}>{diagnosticsOpen ? "HIDE DEMO DIAGNOSTICS" : "OPEN DEMO DIAGNOSTICS"}</Text><MaterialIcons name={diagnosticsOpen ? "expand-less" : "expand-more"} size={19} color={C.gold} /></Pressable>{diagnosticsOpen && <View style={styles.howTo}><Text style={styles.cardKicker}>DEMO DIAGNOSTICS</Text><Text style={styles.historyTitle}>Offline gameplay ready</Text><Text style={styles.historyMeta}>Native share: ready · Reduced motion: {reduceMotion ? "on" : "off"}</Text><Text style={styles.historyMeta}>Local storage: {storageWarning ? "fallback · gameplay remains available" : "ready · local demo state available"}</Text><Text style={styles.historyMeta}>Storage schema: {storageSchemaVersion ?? "not initialized"}</Text><Text accessibilityLiveRegion="polite" style={styles.historyMeta}>Presenter settings: {formatJudgeSettingsStatus(judgeAutoAdvance, judgePacingPreset, judgeSettingsStorageStatus)}</Text><Pressable accessibilityRole="button" accessibilityLabel="Copy or share Presenter settings summary" accessibilityHint="Copies the redacted judge settings status, or opens the native Share sheet if clipboard access is unavailable" onPress={copyJudgeSettingsSummary} disabled={shareInFlight} style={({ pressed }) => [styles.recapButton, shareInFlight && { opacity: 0.55 }, pressed && styles.pressed]}><Text style={styles.recapButtonText}>{shareInFlight ? "COPYING…" : "COPY / SHARE SETTINGS"}</Text><MaterialIcons name="content-copy" size={17} color={C.gold} /></Pressable><Text accessibilityLiveRegion="polite" style={styles.historyMeta}>{judgeSettingsCopyStatus}</Text>{judgeSettingsToast && <Text accessibilityLiveRegion="polite" style={[styles.historyMeta, { color: C.mint }]}>{judgeSettingsToast}</Text>}<Text style={styles.historyMeta}>Schema event: {storageSchemaEvent}</Text><Text style={styles.historyMeta}>Last persistence failure: {formatPersistenceFailureCategory(persistenceFailureCategory)}</Text><Text style={styles.historyMeta}>Friendzone demo flow: {formatFriendzoneDemoFlowStep(friendzoneDemoFlow)}</Text><View accessibilityRole="summary" accessibilityLabel={`Bridge health diagnostics. ${bridgeHealthDiagnosticsSummary}`} accessibilityState={{ busy: bridgeRetrying, selected: bridgeHealthFreshnessPresentation.tone === "success" }} accessibilityLiveRegion="polite" style={styles.bridgeStatusRow}><MaterialIcons name={bridgeHealthFreshnessPresentation.icon} size={16} color={bridgeHealthFreshnessPresentation.tone === "success" ? C.mint : bridgeHealthFreshnessPresentation.tone === "accent" ? C.cyan : C.gold} /><Text style={styles.historyMeta}>Bridge health: {bridgeStatusLabel} · {formatBridgeAge(bridgeLastCheckedAt)} · {bridgeHealthFreshnessPresentation.label}</Text></View><Text style={styles.historyMeta}>{formatBridgeRecoverySummary(bridgeRetrying ? "checking" : bridgeLastCheckedAt ? "fallback" : "ready", bridgeLastCheckedAt)}</Text><Text style={styles.historyMeta}>Recovery reason: {formatBridgeRecoveryReason(bridgeRecoveryReason, bridgeRetrying ? "checking" : bridgeLastCheckedAt ? "fallback" : "ready")}</Text>{bridgeToast && <Text accessibilityLiveRegion="polite" style={[styles.historyMeta, { color: C.gold }]}>Status: {bridgeToast}</Text>}<Text style={styles.historyMeta}>Last checked: {formatBridgeTimestamp(bridgeLastCheckedAt)}</Text><Text accessibilityLiveRegion="polite" accessibilityLabel={`Demo reset status: ${resetStatus}`} style={styles.historyMeta}>Demo reset: {resetStatus}</Text>{resetStatus === "Reset complete" && <View accessibilityRole="alert" accessibilityLabel="Demo reset complete. Local state is ready for a fresh walkthrough." style={styles.judgeSettingsToastRow}><MaterialIcons name="check-circle" size={16} color={C.mint} /><Text style={[styles.historyMeta, { color: C.mint, marginTop: 0 }]}>Reset complete · ready for a fresh walkthrough</Text></View>}{resetStatus === "Reset complete" && <View accessibilityRole="alert" accessibilityLabel="Demo reset complete. Local state is ready for a fresh walkthrough." style={styles.judgeSettingsToastRow}><MaterialIcons name="check-circle" size={16} color={C.mint} /><Text style={[styles.historyMeta, { color: C.mint, marginTop: 0 }]}>Reset complete · ready for a fresh walkthrough</Text></View>}<Pressable accessibilityRole="button" accessibilityLabel={shareInFlight ? "Sharing sanitized Diagnostics report" : "Share sanitized Diagnostics report"} accessibilityHint="Shares bridge, storage, and local gameplay status without wallet or account identifiers" accessibilityState={{ busy: shareInFlight, disabled: shareInFlight }} onPress={shareDiagnosticsReport} disabled={shareInFlight} style={({ pressed }) => [styles.recapButton, shareInFlight && { opacity: 0.55 }, pressed && styles.pressed]}><Text style={styles.recapButtonText}>{shareInFlight ? "SHARING REPORT…" : "SHARE SANITIZED REPORT"}</Text><MaterialIcons name="ios-share" size={17} color={C.gold} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={reportPreviewOpen ? "Hide sanitized Diagnostics report preview" : "Preview sanitized Diagnostics report"} accessibilityHint={reportPreviewOpen ? "Collapses the redacted bridge, storage, and gameplay report" : "Expands the redacted bridge, storage, and gameplay report"} accessibilityState={{ expanded: reportPreviewOpen }} onPress={() => setReportPreviewOpen((value) => !value)} style={({ pressed }) => [styles.recapButton, pressed && styles.pressed]}><Text style={styles.recapButtonText}>{reportPreviewOpen ? "HIDE REPORT PREVIEW" : "PREVIEW REPORT"}</Text><MaterialIcons name={reportPreviewOpen ? "expand-less" : "expand-more"} size={17} color={C.gold} /></Pressable>{reportPreviewOpen && <View accessibilityLabel="Sanitized Diagnostics report preview" style={styles.assetPassport}><Text style={styles.cardKicker}>SANITIZED REPORT PREVIEW</Text><Text selectable style={styles.historyMeta}>{buildSanitizedDemoReport()}</Text><Text style={styles.historyMeta}>Wallet, account, and party identifiers are omitted.</Text><Pressable accessibilityRole="button" accessibilityLabel={shareInFlight ? "Copying sanitized Diagnostics report" : "Copy sanitized Diagnostics report"} onPress={copyDiagnosticsReport} disabled={shareInFlight} style={({ pressed }) => [styles.recapButton, shareInFlight && { opacity: 0.55 }, pressed && styles.pressed]}><Text style={styles.recapButtonText}>{shareInFlight ? "COPYING REPORT…" : "COPY REPORT"}</Text><MaterialIcons name="content-copy" size={17} color={C.gold} /></Pressable><Text accessibilityLiveRegion="polite" style={styles.historyMeta}>{reportCopyStatus}</Text></View>}{resetStatus === "Reset needs retry" && <Pressable accessibilityRole="button" accessibilityLabel="Open Diagnostics for demo reset recovery" onPress={openDiagnostics} style={({ pressed }) => [styles.recapButton, pressed && styles.pressed]}><Text style={styles.recapButtonText}>OPEN RECOVERY DIAGNOSTICS</Text><MaterialIcons name="build" size={17} color={C.gold} /></Pressable>}<Pressable accessibilityRole="button" accessibilityLabel={resetAccessibilityState.label} accessibilityHint={resetAccessibilityState.hint} accessibilityState={{ busy: resetAccessibilityState.busy, disabled: resetAccessibilityState.disabled }} onPress={resetDemo} disabled={resetAccessibilityState.disabled} style={({ pressed }) => [styles.secondaryButton, resetAccessibilityState.disabled && { opacity: 0.55 }, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{resetAccessibilityState.disabled ? "RESETTING…" : "RESET DEMO PROGRESS"}</Text></Pressable></View>}<View style={styles.settingsCard}><SettingRow icon="volume-up" title="Sound effects" detail="Arena cues and victory hits" /><SettingRow icon="vibration" title="Haptics" detail="Tactile feedback on every pull" /><SettingRow icon="visibility" title="High contrast" detail="Keep team colors extra bright" /></View><Pressable accessibilityRole="button" accessibilityLabel={walletConnected ? "Disconnect demo wallet" : "Connect demo wallet"} accessibilityHint={walletConnected ? "Disconnects the local demo wallet without changing saved receipts" : "Connects a local demo wallet for the reward-readiness demonstration"} accessibilityState={{ selected: walletConnected }} onPress={connectWallet} style={({ pressed }) => [styles.walletSettingsRow, pressed && styles.pressed]}><MaterialIcons name="account-balance-wallet" size={23} color={C.gold} /><View style={styles.settingCopy}><Text style={styles.settingTitle}>{walletConnected ? "Wallet connected" : "Wallet-ready profile"}</Text><Text style={styles.settingDetail}>{walletConnected ? walletAddress : "Optional for future on-chain rewards"}</Text></View><Text style={styles.walletSettingsAction}>{walletConnected ? "DISCONNECT" : "CONNECT"}</Text></Pressable><Pressable accessibilityRole="switch" accessibilityState={{ checked: wearableEquipped }} accessibilityLabel={wearableEquipped ? "Unequip Friendzone Plaza Band" : "Equip Friendzone Plaza Band"} accessibilityHint={wearableEquipped ? "Removes the local wearable preview from your next Plaza round" : "Equips a local wearable preview; this does not mint or claim an on-chain asset"} onPress={() => { setWearableEquipped((value) => !value); announce(wearableEquipped ? "Friendzone Plaza Band unequipped." : "Friendzone Plaza Band equipped."); fireHaptic("light"); }} style={({ pressed }) => [styles.wearablePreview, pressed && styles.pressed]}><View style={[styles.wearableIcon, wearableEquipped && styles.wearableIconEquipped]}><MaterialIcons name={wearableEquipped ? "check" : "checkroom"} size={23} color={C.ink} /></View><View style={styles.settingCopy}><Text style={styles.cardKicker}>PLAYER WEARABLE</Text><Text style={styles.settingTitle}>Friendzone Plaza Band</Text><Text style={styles.settingDetail}>{wearableEquipped ? "Equipped for your next Plaza round · gold trim" : "Preview slot · Plaza Band · MANA-ready trait"}</Text></View><Text style={styles.wearableStatus}>{wearableEquipped ? "EQUIPPED" : "EQUIP"}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={wearableDetailOpen ? "Hide Friendzone Plaza Band details" : "Show Friendzone Plaza Band details"} accessibilityHint={wearableDetailOpen ? "Collapses the local wearable trait and mint-readiness details" : "Expands the local wearable trait and mint-readiness details"} accessibilityState={{ expanded: wearableDetailOpen }} onPress={() => setWearableDetailOpen((value) => !value)} style={({ pressed }) => [styles.wearableDetailsButton, pressed && styles.pressed]}><Text style={styles.wearableDetailsText}>{wearableDetailOpen ? "HIDE WEARABLE DETAILS" : "VIEW WEARABLE DETAILS"}</Text><MaterialIcons name={wearableDetailOpen ? "expand-less" : "expand-more"} size={18} color={C.gold} /></Pressable>{wearableDetailOpen && <View accessibilityLabel="Friendzone Plaza Band details" style={styles.wearableDetailsCard}><Text style={styles.cardKicker}>DECENTRALAND WEARABLE PREVIEW</Text><Text style={styles.historyTitle}>Friendzone Plaza Band</Text><Text style={styles.historyMeta}>Trait set: gold trim · MANA-ready · Plaza edition</Text><Text style={styles.historyMeta}>Mint status: claimable after the next approved reward drop</Text><View style={styles.assetPassport}><Text style={styles.cardKicker}>ASSET PASSPORT</Text><Text style={styles.historyMeta}>Collection: Friendzone Plaza Wearables</Text><Text style={styles.historyMeta}>Slot: wrist · Rarity: Plaza Edition</Text><Text style={styles.historyMeta}>Traits: gold trim · social relay badge</Text><Text style={styles.historyMeta}>Metadata: preview-ready · token ID pending</Text><View style={styles.claimStatusRow}><MaterialIcons name={walletConnected && rewardClaimed ? "check-circle" : "schedule"} size={17} color={walletConnected && rewardClaimed ? C.mint : C.gold} /><Text style={styles.claimStatusText}>{walletConnected && rewardClaimed ? "Claim path ready for an approved mint" : walletConnected ? "Wallet linked · save a winning receipt to unlock claim readiness" : "Connect wallet and save a winning receipt to prepare a future claim"}</Text></View></View></View>}<View style={styles.historyCard}><View style={styles.historyHeader}><Text style={styles.cardKicker}>REWARD HISTORY</Text><Text style={styles.historyCount}>{rewardHistory.length}/5</Text></View>{rewardHistory.length === 0 ? <View accessibilityRole="summary" accessibilityLabel="No reward receipts yet. Win a match to create a wallet-ready local receipt." style={styles.claimStatusRow}><MaterialIcons name="emoji-events" size={20} color={C.gold} /><View style={styles.historyCopy}><Text style={styles.historyTitle}>Your first Plaza Band is one win away</Text><Text style={styles.body}>Pull with your crew, then save the local receipt. It stays wallet-ready without claiming anything on-chain.</Text><Pressable accessibilityRole="button" accessibilityLabel="Enter the arena to earn your first Plaza Band" accessibilityHint="Opens matchmaking so you can choose a crew and play a local match" onPress={() => setScreen("lobby")} style={({ pressed }) => [styles.recapShareButton, pressed && styles.pressed]}><Text style={styles.recapShareText}>ENTER THE ARENA</Text><MaterialIcons name="arrow-forward" size={17} color={C.gold} /></Pressable></View></View> : rewardHistory.map((receipt) => <View key={receipt.id} style={styles.historyRow}><MaterialIcons name="verified" size={20} color={C.mint} /><View style={styles.historyCopy}><Text style={styles.historyTitle}>{receipt.title}</Text><Text style={styles.historyMeta}>{receipt.pulls} pulls · {receipt.status}</Text></View></View>)}</View><View accessibilityLabel="Recent match history" style={styles.matchHistoryCard}><View style={styles.historyHeader}><Text style={styles.cardKicker}>MATCH HISTORY</Text><Text style={styles.historyCount}>{matchHistory.length}/6</Text></View><Text style={styles.historySummary}>{historySummary.wins} wins · {historySummary.defeats} defeats · {historySummary.total} total</Text><View accessibilityRole="summary" accessibilityLabel="Recent match streak trend, oldest on the left and newest on the right" style={styles.streakTrend}>{[0, 1, 2, 3, 4, 5].map((index) => { const match = matchHistory[index]; return <View key={index} accessibilityLabel={match ? `Match ${index + 1}, ${match.result}, ${match.pulls} pulls` : `Match slot ${index + 1}, no result recorded`} accessibilityState={{ disabled: !match }} style={[styles.trendBar, { backgroundColor: match?.result === "Victory" ? C.mint : match?.result === "Defeat" ? C.coral : "#3A407A", height: match ? (match.result === "Victory" ? 26 : 16) : 10 }]} />; })}</View><Text style={styles.historyMeta}>Oldest ← recent</Text>{matchHistory.length === 0 ? <Text style={styles.body}>Your first match recap will appear here after you pull the rope.</Text> : matchHistory.map((match) => <Pressable key={match.id} accessibilityRole="button" accessibilityLabel={formatMatchHistoryRecapPresentation({ result: match.result, selected: selectedHistoryId === match.id, shareInFlight }).label} accessibilityHint={formatMatchHistoryRecapPresentation({ result: match.result, selected: selectedHistoryId === match.id, shareInFlight }).hint} accessibilityState={formatMatchHistoryRecapPresentation({ result: match.result, selected: selectedHistoryId === match.id, shareInFlight }).accessibilityState} onPress={() => { setSelectedHistoryId(match.id); prepareRecapShare(); }} style={({ pressed }) => [styles.matchHistoryRow, selectedHistoryId === match.id && styles.matchHistorySelected, pressed && styles.pressed]}><View style={[styles.matchResultDot, { backgroundColor: match.result === "Victory" ? C.mint : C.coral }]} /><View style={styles.historyCopy}><Text style={styles.historyTitle}>{match.result} · {match.team}</Text><Text style={styles.historyMeta}>{match.pulls} pulls · {match.date}</Text>{selectedHistoryId === match.id && <Text accessibilityLiveRegion="polite" style={[styles.historyMeta, { color: C.gold }]}>{shareStatus}</Text>}</View><MaterialIcons name={formatMatchHistoryRecapPresentation({ result: match.result, selected: selectedHistoryId === match.id, shareInFlight }).icon} size={18} color={selectedHistoryId === match.id ? C.gold : (match.result === "Victory" ? C.mint : C.fog)} /></Pressable>)}</View><View style={styles.howTo}><Text style={styles.cardKicker}>HOW TO PLAY</Text><Text style={styles.howTitle}>Tap fast. Find your rhythm.</Text><Text style={styles.body}>Every pull moves the rope. Build a seven-tap streak for a small power burst, then push your crew across the center line before the clock hits zero.</Text></View>{nav}</ScreenContainer>;
  }

  return <ScreenContainer className="px-5">{header("FRIENDZONE / SEASON 01", "Tug of War Arena")}<Pressable accessibilityLabel={walletConnected ? `Wallet connected ${walletAddress}` : "Connect demo wallet"} onPress={connectWallet} style={({ pressed }) => [styles.walletPill, pressed && styles.pressed]}><MaterialIcons name={walletConnected ? "account-balance-wallet" : "link"} size={17} color={walletConnected ? C.mint : C.gold} /><Text style={styles.walletText}>{walletConnected ? walletAddress : "CONNECT WALLET"}</Text><Text style={styles.walletMode}>{walletConnected ? "DEMO" : "OPTIONAL"}</Text></Pressable><View style={styles.statusBanner}><View style={styles.statusLiveDot} /><View style={styles.statusCopy}><Text style={styles.statusTitle}>{partyReady ? "Crew party is live" : "Arena is open"}</Text><Text style={styles.statusMeta}>{partyReady ? `${partyCode} · 3 slots ready` : "Decentraland Plaza relay · offline demo ready"}</Text></View><MaterialIcons name={partyReady ? "groups" : "bolt"} size={20} color={C.gold} /></View><View style={styles.howTo}><Text style={styles.cardKicker}>WHY IT MATTERS</Text><Text style={styles.howTitle}>Social pulls, portable rewards.</Text><Text style={styles.body}>Play offline now, bring your crew from the Decentraland Friendzone into the lounge, and keep a wallet-ready receipt for the Web3 layer that comes next.</Text></View><View style={styles.hero}><View style={styles.heroBadge}><MaterialIcons name="bolt" size={20} color={C.ink} /><Text style={styles.heroBadgeText}>LIVE MATCHES</Text></View><Text style={styles.heroTitle}>Pull together.{"\n"}<Text style={{ color: C.gold }}>Own the line.</Text></Text><Text style={styles.body}>A fast, social tug-of-war built for tiny screens and big comebacks.</Text><View style={styles.heroRope}><View style={[styles.heroTeam, { backgroundColor: C.coral }]} /><View style={styles.heroRopeLine} /><View style={[styles.heroTeam, { backgroundColor: C.cyan }]} /></View></View><View style={styles.matchCard}><View><Text style={styles.cardKicker}>NEXT MATCH</Text><Text style={styles.matchTitle}>Quick match</Text><Text style={styles.body}>30 sec · 2 crews · 1 winner</Text></View><View style={styles.matchIcon}><MaterialIcons name="sports-kabaddi" size={28} color={C.ink} /></View></View><Pressable accessibilityRole="button" accessibilityLabel="Play a quick tug-of-war match" onPress={enterLobby} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>PLAY NOW</Text><MaterialIcons name="arrow-forward" size={22} color={C.ink} /></Pressable><View style={styles.statsStrip}><View><Text style={styles.statValue}>{String(wins).padStart(2, "0")}</Text><Text style={styles.statLabel}>WINS</Text></View><View><Text style={styles.statValue}>{totalPulls}</Text><Text style={styles.statLabel}>PULLS</Text></View><View><Text style={styles.statValue}>{bestStreak}</Text><Text style={styles.statLabel}>BEST STREAK</Text></View><View><Text style={styles.statValue}>#04</Text><Text style={styles.statLabel}>RANK</Text></View></View>{nav}</ScreenContainer>;
}

function SettingRow({ icon, title, detail }: { icon: string; title: string; detail: string }) {
  const [enabled, setEnabled] = useState(true);
  return <Pressable onPress={() => setEnabled((value) => !value)} style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}><MaterialIcons name={icon as never} size={23} color={C.gold} /><View style={styles.settingCopy}><Text style={styles.settingTitle}>{title}</Text><Text style={styles.settingDetail}>{detail}</Text></View><View style={[styles.toggle, enabled && styles.toggleOn]}><View style={[styles.toggleKnob, enabled && styles.toggleKnobOn]} /></View></Pressable>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12, paddingBottom: 26 }, inviteArrivalBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: C.panel, borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: `${C.gold}66` }, inviteArrivalIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" }, inviteArrivalCopy: { flex: 1 }, inviteArrivalTitle: { color: C.cloud, fontSize: 15, fontWeight: "900", marginTop: 3 }, inviteArrivalMeta: { color: C.fog, fontSize: 12, lineHeight: 17, marginTop: 4 }, inviteDismiss: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1 }, eyebrow: { color: C.fog, fontSize: 11, fontWeight: "800", letterSpacing: 1.7 }, title: { color: C.cloud, fontSize: 28, fontWeight: "900", letterSpacing: -0.8, marginTop: 4 }, livePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99, backgroundColor: "#252A5E" }, liveDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: C.mint }, liveText: { color: C.mint, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.midnight, alignItems: "center", justifyContent: "center" }, hero: { backgroundColor: C.midnight, borderRadius: 28, padding: 22, overflow: "hidden", minHeight: 240 }, heroBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: C.gold, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7 }, heroBadgeText: { color: C.ink, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, heroTitle: { color: C.cloud, fontSize: 38, fontWeight: "900", lineHeight: 39, letterSpacing: -1.4, marginTop: 22 }, body: { color: C.fog, fontSize: 14, lineHeight: 20, marginTop: 8 }, bodyCenter: { color: C.fog, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8, maxWidth: 280 }, heroRope: { flexDirection: "row", alignItems: "center", position: "absolute", bottom: 22, right: 22, left: 22, opacity: 0.9 }, heroTeam: { width: 20, height: 20, borderRadius: 10 }, heroRopeLine: { flex: 1, height: 5, backgroundColor: C.cloud, borderRadius: 5, marginHorizontal: 8 }, matchCard: { backgroundColor: C.panel, borderRadius: 20, padding: 18, marginTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, cardKicker: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 }, matchTitle: { color: C.cloud, fontSize: 20, fontWeight: "800", marginTop: 5 }, matchIcon: { width: 54, height: 54, borderRadius: 17, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" }, primaryButton: { backgroundColor: C.gold, minHeight: 58, borderRadius: 18, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18 }, primaryButtonText: { color: C.ink, fontSize: 14, fontWeight: "900", letterSpacing: 1.1 }, secondaryButton: { minHeight: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#3A407A", marginTop: 10 }, secondaryButtonText: { color: C.cloud, fontSize: 13, fontWeight: "900", letterSpacing: 1 }, statsStrip: { flexDirection: "row", justifyContent: "space-around", backgroundColor: C.midnight, borderRadius: 20, paddingVertical: 17, marginTop: 16 }, statValue: { color: C.cloud, fontSize: 22, fontWeight: "900", textAlign: "center" }, statLabel: { color: C.fog, fontSize: 9, fontWeight: "800", letterSpacing: 1.1, textAlign: "center", marginTop: 3 }, nav: { flexDirection: "row", justifyContent: "space-around", paddingTop: 18, marginTop: "auto" }, navItem: { alignItems: "center", gap: 4, paddingHorizontal: 22, paddingVertical: 8, minHeight: 44 }, navLabel: { color: C.fog, fontSize: 11, fontWeight: "700" }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] }, lobbyCard: { backgroundColor: C.midnight, borderRadius: 22, padding: 20 }, lobbyTitle: { color: C.cloud, fontSize: 24, fontWeight: "900", marginTop: 8 }, teamGrid: { flexDirection: "row", gap: 12, marginTop: 16 }, teamCard: { flex: 1, borderRadius: 20, borderWidth: 2, padding: 14, minHeight: 190 }, teamOrb: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center" }, teamName: { color: C.cloud, fontSize: 15, fontWeight: "900", marginTop: 14 }, teamMeta: { color: C.fog, fontSize: 12, lineHeight: 17, marginTop: 5 }, selectedPill: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4, marginTop: 12 }, selectedText: { color: C.ink, fontSize: 9, fontWeight: "900" }, readyRow: { marginTop: 18, padding: 17, borderRadius: 20, backgroundColor: C.panel, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, readyTitle: { color: C.cloud, fontSize: 16, fontWeight: "800" }, readyButton: { paddingHorizontal: 13, paddingVertical: 11, borderRadius: 14 }, readyButtonText: { color: C.ink, fontSize: 10, fontWeight: "900" }, arenaTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }, arenaTitle: { color: C.cloud, fontSize: 27, fontWeight: "900", marginTop: 3 }, timer: { backgroundColor: C.gold, borderRadius: 18, width: 66, height: 66, alignItems: "center", justifyContent: "center" }, timerValue: { color: C.ink, fontSize: 25, fontWeight: "900", lineHeight: 27 }, timerLabel: { color: C.ink, fontSize: 9, fontWeight: "900", letterSpacing: 1 }, scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24 }, scoreRight: { alignItems: "flex-end" }, scoreNumber: { fontSize: 33, fontWeight: "900" }, scoreLabel: { color: C.fog, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, vs: { color: C.fog, fontSize: 12, fontWeight: "900" }, powerTrack: { height: 12, backgroundColor: C.coral, borderRadius: 10, overflow: "hidden", marginTop: 14, position: "relative" }, powerFill: { height: "100%", borderRadius: 10 }, centerMarker: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 3, backgroundColor: C.cloud }, arenaPanel: { height: 220, backgroundColor: C.midnight, borderRadius: 24, marginTop: 24, alignItems: "center", justifyContent: "center", overflow: "hidden" }, fenceLine: { position: "absolute", top: 65, left: 0, right: 0, borderTopWidth: 1, borderColor: "#3A407A", borderStyle: "dashed" }, rope: { flexDirection: "row", alignItems: "center", width: "90%" }, ropeLine: { flex: 1, height: 6, backgroundColor: C.cloud }, ropeKnot: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: C.cloud }, playersRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "88%", marginTop: 54 }, playerEmoji: { fontSize: 26, color: C.cloud }, centerFlag: { width: 39, height: 45, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", borderRadius: 8 }, flagText: { color: C.ink, fontWeight: "900", fontSize: 10, transform: [{ rotate: "-90deg" }] }, arenaHint: { color: C.fog, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 20 }, streakRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 17 }, streakLabel: { color: C.fog, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, streakValue: { fontSize: 17, fontWeight: "900" }, streakBoost: { color: C.gold, fontSize: 10, fontWeight: "900" }, tapButton: { width: 136, height: 136, borderRadius: 68, alignSelf: "center", alignItems: "center", justifyContent: "center", marginTop: 16, borderWidth: 5, borderColor: "#FFFFFF55" }, tapPressed: { transform: [{ scale: 0.94 }] }, tapText: { color: C.ink, fontSize: 24, fontWeight: "900", marginTop: 2 }, tapSubtext: { color: C.ink, fontSize: 10, fontWeight: "800", letterSpacing: 1 }, tapCount: { color: C.fog, fontSize: 11, textAlign: "center", marginTop: 8 }, resultHero: { alignItems: "center", paddingTop: 28 },   celebrationBurst: { alignItems: "center" }, confettiRow: { flexDirection: "row", gap: 20, marginBottom: 6 }, confetti: { color: C.gold, fontSize: 25, fontWeight: "900" }, resultOrb: { width: 92, height: 92, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 22 }, resultTitle: { color: C.cloud, fontSize: 30, fontWeight: "900", textAlign: "center", letterSpacing: -0.7, marginTop: 8 }, resultStats: { flexDirection: "row", justifyContent: "space-around", backgroundColor: C.midnight, borderRadius: 20, paddingVertical: 20, marginTop: 28 }, rankList: { marginTop: 20, gap: 10 }, rankRow: { backgroundColor: C.midnight, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center" }, youRow: { borderWidth: 1, borderColor: C.gold }, rankNumber: { color: C.fog, fontSize: 14, fontWeight: "900", width: 34 }, rankNameWrap: { flex: 1 }, rankName: { color: C.cloud, fontSize: 16, fontWeight: "800" }, rankMeta: { color: C.fog, fontSize: 12, marginTop: 3 }, rankArrow: { color: C.fog, fontSize: 28 }, settingsCard: { backgroundColor: C.midnight, borderRadius: 20, paddingHorizontal: 16, marginTop: 20 }, settingRow: { minHeight: 76, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#343A70" }, settingCopy: { flex: 1, marginLeft: 13 }, settingTitle: { color: C.cloud, fontSize: 15, fontWeight: "800" }, settingDetail: { color: C.fog, fontSize: 12, marginTop: 3 }, toggle: { width: 46, height: 28, borderRadius: 20, backgroundColor: "#3A407A", justifyContent: "center", padding: 3 }, toggleOn: { backgroundColor: C.mint }, toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.cloud }, toggleKnobOn: { alignSelf: "flex-end", backgroundColor: C.ink }, howTo: { backgroundColor: C.panel, borderRadius: 20, padding: 18, marginTop: 18 }, howTitle: { color: C.cloud, fontSize: 18, fontWeight: "900", marginTop: 7 }, arenaActions: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 }, surgeButton: { width: 86, height: 86, borderRadius: 18, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: C.midnight }, surgeText: { color: C.cloud, fontSize: 12, fontWeight: "900", letterSpacing: 0.7, marginTop: 2 }, surgeSubtext: { color: C.fog, fontSize: 9, fontWeight: "800", marginTop: 3 }, tutorialBackdrop: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "#11142BCC", alignItems: "center", justifyContent: "center", padding: 20 }, tutorialCard: { backgroundColor: C.cloud, borderRadius: 26, padding: 22, width: "100%", alignItems: "center" }, tutorialIcon: { width: 62, height: 62, borderRadius: 20, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", marginBottom: 16 }, tutorialKicker: { color: "#65709B", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 }, tutorialTitle: { color: C.ink, fontSize: 25, fontWeight: "900", marginTop: 7 }, tutorialSteps: { width: "100%", alignItems: "center", marginTop: 18 }, tutorialStep: { width: 42, height: 5, borderRadius: 3, backgroundColor: "#D9DDF0", marginHorizontal: 3 }, tutorialStepActive: { backgroundColor: C.gold }, tutorialStepLabel: { color: "#65709B", fontSize: 10, fontWeight: "800", letterSpacing: 0.7, marginTop: 8, textTransform: "uppercase" }, tutorialActions: { width: "100%", alignItems: "stretch" }, tutorialNext: { marginTop: 16 }, tutorialSkip: { minHeight: 40, alignItems: "center", justifyContent: "center", marginTop: 3 }, tutorialSkipText: { color: "#65709B", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, walletPill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 7, backgroundColor: C.midnight, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 14 }, walletText: { color: C.cloud, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 }, walletMode: { color: C.fog, fontSize: 9, fontWeight: "800", letterSpacing: 0.7 }, walletSettingsRow: { minHeight: 76, marginTop: 14, paddingHorizontal: 16, borderRadius: 18, backgroundColor: C.midnight, flexDirection: "row", alignItems: "center" }, walletSettingsAction: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, rewardCard: { marginTop: 18, backgroundColor: C.panel, borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, rewardTitle: { color: C.cloud, fontSize: 15, fontWeight: "900", marginTop: 6 }, rewardMeta: { color: C.fog, fontSize: 11, marginTop: 5 }, rewardButton: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: C.gold, alignItems: "center", justifyContent: "center", marginTop: 10 }, rewardButtonText: { color: C.gold, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 }, historyCard: { marginTop: 14, backgroundColor: C.panel, borderRadius: 20, padding: 16 }, historyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, historyCount: { color: C.fog, fontSize: 10, fontWeight: "900" }, historyRow: { flexDirection: "row", alignItems: "center", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#3A407A" }, historyCopy: { marginLeft: 10 }, historyTitle: { color: C.cloud, fontSize: 13, fontWeight: "800" }, historyMeta: { color: C.fog, fontSize: 11, marginTop: 3 }, partyBanner: { backgroundColor: C.midnight, borderRadius: 22, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, chronicleCard: { backgroundColor: "#252A5E", borderRadius: 22, padding: 16, marginTop: 14, flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: `${C.gold}55` }, chronicleIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", marginRight: 12 }, chronicleCopy: { flex: 1 }, chronicleTitle: { color: C.cloud, fontSize: 16, fontWeight: "900", marginTop: 6 }, chronicleMeta: { color: C.fog, fontSize: 12, lineHeight: 17, marginTop: 5 }, chronicleAction: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 7, marginTop: 11, minHeight: 32 }, chronicleActionText: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, partyTitle: { color: C.cloud, fontSize: 18, fontWeight: "900", marginTop: 6, maxWidth: 220 }, partyButton: { backgroundColor: C.gold, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 }, partyButtonText: { color: C.ink, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, sectionTitle: { color: C.fog, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, marginTop: 22, marginBottom: 10 }, crewList: { backgroundColor: C.panel, borderRadius: 20, paddingHorizontal: 16 }, crewRow: { minHeight: 68, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#3A407A" }, avatar: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center" }, avatarText: { color: C.ink, fontSize: 16, fontWeight: "900" }, crewCopy: { flex: 1, marginLeft: 12 }, crewName: { color: C.cloud, fontSize: 14, fontWeight: "800" }, crewMeta: { color: C.fog, fontSize: 11, marginTop: 3 }, onlineDot: { width: 9, height: 9, borderRadius: 6 }, reactionRow: { flexDirection: "row", justifyContent: "space-between" }, reactionButton: { width: 56, height: 56, borderRadius: 17, backgroundColor: C.midnight, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#3A407A" }, reactionSelected: { borderColor: C.gold, backgroundColor: "#FFC85722" }, reactionText: { fontSize: 24 }, activityCard: { backgroundColor: C.panel, borderRadius: 20, padding: 18, marginTop: 22 }, judgeTransitionSummary: { backgroundColor: C.midnight, borderRadius: 14, padding: 12, marginTop: 12, borderWidth: 1, borderColor: "#3A407A" }, walkthroughProgress: { marginTop: 12 }, walkthroughProgressTrack: { height: 6, borderRadius: 6, backgroundColor: "#3A407A", overflow: "hidden" }, walkthroughProgressFill: { height: "100%", borderRadius: 6, backgroundColor: C.mint }, walkthroughProgressSteps: { flexDirection: "row", justifyContent: "space-between", marginTop: 9 }, walkthroughProgressStep: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#3A407A", borderWidth: 1, borderColor: "#4B528F" }, walkthroughProgressComplete: { backgroundColor: C.mint, borderColor: C.mint }, walkthroughProgressActive: { borderColor: C.gold, borderWidth: 2 }, walkthroughProgressStepText: { color: C.fog, fontSize: 11, fontWeight: "900" }, walkthroughProgressStepTextActive: { color: C.ink }, activityTitle: { color: C.cloud, fontSize: 17, fontWeight: "900", marginTop: 8 }, activityMeta: { color: C.fog, fontSize: 11, marginTop: 5 }, judgeSettingsToastRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 5 }, judgeBridgeSummary: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 7 }, judgeWalletConnectAction: { minHeight: 30, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, borderColor: C.gold, alignItems: "center", justifyContent: "center", marginLeft: "auto" }, judgeWalletConnectText: { color: C.gold, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 }, judgeReceiptSummary: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 8, padding: 9, borderRadius: 11, backgroundColor: "#202557" }, judgeReceiptCopy: { flex: 1, minWidth: 0 }, judgeReceiptTitle: { color: C.mint, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 }, judgeReceiptMeta: { color: C.fog, fontSize: 10, lineHeight: 14, marginTop: 3 }, judgeSettingsToastContent: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 7 }, judgeRestartingIndicator: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }, judgeRestartingText: { color: C.gold, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, judgeSettingsToastAction: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 36, paddingHorizontal: 9, borderRadius: 12, borderWidth: 1, borderColor: C.gold }, judgeSettingsToastActionText: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 }, activityDivider: { height: 1, backgroundColor: "#3A407A", marginVertical: 14 }, activityLine: { color: C.fog, fontSize: 12, marginTop: 8 }, inviteCard: { marginTop: 14, backgroundColor: C.panel, borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, inviteCode: { color: C.cloud, fontSize: 22, fontWeight: "900", letterSpacing: 1.2, marginTop: 6 }, inviteMeta: { color: C.fog, fontSize: 11, marginTop: 4 }, inviteActions: { flexDirection: "row", gap: 8 }, inviteAction: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" }, inviteActionSecondary: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, borderColor: C.gold, alignItems: "center", justifyContent: "center" }, statusBanner: { flexDirection: "row", alignItems: "center", backgroundColor: C.panel, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 }, statusLiveDot: { width: 9, height: 9, borderRadius: 6, backgroundColor: C.mint, marginRight: 10 }, statusCopy: { flex: 1 }, statusTitle: { color: C.cloud, fontSize: 13, fontWeight: "900" }, statusMeta: { color: C.fog, fontSize: 10, marginTop: 3 },   contactList: { backgroundColor: C.panel, borderRadius: 20, paddingHorizontal: 16, marginTop: 4 }, contactRow: { minHeight: 62, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#3A407A" }, contactAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.midnight, alignItems: "center", justifyContent: "center" }, contactInvite: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: `${C.gold}22`, borderWidth: 1, borderColor: C.gold }, contactInviteText: { color: C.gold, fontSize: 10, fontWeight: "900" },   parcelMap: { width: "100%", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 4, marginTop: 14 }, parcelTile: { width: 30, height: 24, borderRadius: 5, backgroundColor: "#D8B04C", opacity: 0.45 }, parcelTileActive: { backgroundColor: C.mint, opacity: 1, alignItems: "center", justifyContent: "center" }, parcelMapCaption: { color: C.fog, fontSize: 10, textAlign: "center", marginTop: 7 }, plazaCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.gold, borderRadius: 20, padding: 15, marginTop: 16 }, plazaCardCopy: { flex: 1 }, plazaCardTitle: { color: C.ink, fontSize: 15, fontWeight: "900", marginTop: 5 }, plazaCardMeta: { color: "#4C3B08", fontSize: 11, marginTop: 4 }, plazaShare: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.cloud, alignItems: "center", justifyContent: "center" }, eventTicker: { backgroundColor: C.midnight, borderRadius: 20, padding: 15, marginBottom: 14 }, eventTickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, eventTickerStatus: { color: C.mint, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },   eventRow: { flexDirection: "row", alignItems: "center", paddingTop: 12, marginTop: 10, borderTopWidth: 1, borderTopColor: "#3A407A" }, eventAction: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, borderWidth: 1, borderColor: C.gold }, eventActionActive: { backgroundColor: C.gold }, eventActionText: { color: C.gold, fontSize: 9, fontWeight: "900", letterSpacing: 0.6 }, eventShare: { width: 28, height: 28, alignItems: "center", justifyContent: "center", marginLeft: 5 }, eventCopy: { flex: 1, marginLeft: 10 }, eventTitle: { color: C.cloud, fontSize: 13, fontWeight: "800" }, eventMeta: { color: C.fog, fontSize: 10, marginTop: 3 },   eventArrow: { color: C.gold, fontSize: 23 },   eventModalActions: { width: "100%", gap: 10, marginTop: 10 }, assetPassport: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#343A70", gap: 4 }, claimStatusRow: { flexDirection: "row", alignItems: "flex-start", gap: 7, marginTop: 8 }, claimStatusText: { flex: 1, color: C.gold, fontSize: 11, lineHeight: 16, fontWeight: "800" }, bridgeStatusRow: { flexDirection: "row", alignItems: "center", gap: 7 }, bridgeActions: { flexDirection: "row", gap: 8, marginTop: 8 }, plazaHandoffActions: { flexDirection: "row", gap: 8, width: "100%", marginTop: 10 }, plazaHandoffButton: { flex: 1, minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: "#3A407A", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, plazaHandoffText: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },   eventCapacity: { color: C.gold, fontSize: 11, fontWeight: "800", textAlign: "center", marginTop: 8 }, capacityTrack: { height: 4, width: "100%", backgroundColor: "#3A407A", borderRadius: 4, marginTop: 7, overflow: "hidden" }, capacityFill: { height: "100%", backgroundColor: C.mint, borderRadius: 4 }, capacityFillFull: { backgroundColor: C.coral }, wearableDetailsButton: { minHeight: 42, marginTop: 8, borderRadius: 14, borderWidth: 1, borderColor: "#3A407A", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, wearableDetailsText: { color: C.gold, fontSize: 11, fontWeight: "900", letterSpacing: 1 }, wearableDetailsCard: { marginTop: 8, padding: 14, borderRadius: 16, backgroundColor: "#202557", gap: 6 }, wearablePreview: { flexDirection: "row", alignItems: "center", backgroundColor: C.panel, borderRadius: 18, padding: 14, marginTop: 14 },   wearableIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" }, wearableIconEquipped: { backgroundColor: C.mint }, wearableStatus: { color: C.gold, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, reactionLabel: { color: C.fog, fontSize: 8, fontWeight: "900", marginTop: 2 }, recapButton: { marginTop: 15, minHeight: 42, borderRadius: 14, borderWidth: 1, borderColor: C.gold, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, recapButtonText: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 }, recapSummary: { backgroundColor: C.midnight, borderRadius: 18, padding: 15, marginTop: 14 }, recapSummaryText: { color: C.cloud, fontSize: 13, fontWeight: "800", marginTop: 7 }, recapShareButton: { minHeight: 44, marginTop: 12, borderTopWidth: 1, borderTopColor: "#3A407A", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, recapShareText: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 }, matchHistoryCard: { marginTop: 14, backgroundColor: C.panel, borderRadius: 20, padding: 16 }, historySummary: { color: C.fog, fontSize: 11, marginTop: 7, marginBottom: 6 }, storageWarning: { color: C.gold, fontSize: 12, lineHeight: 18, marginTop: 10 }, streakTrend: { height: 34, flexDirection: "row", alignItems: "flex-end", gap: 7, paddingVertical: 4, marginBottom: 8 }, trendBar: { flex: 1, borderRadius: 4 }, matchHistorySelected: { backgroundColor: "#FFC85718" }, matchHistoryRow: { flexDirection: "row", alignItems: "center", minHeight: 58, borderTopWidth: 1, borderTopColor: "#3A407A" }, matchResultDot: { width: 10, height: 10, borderRadius: 6 }
});
