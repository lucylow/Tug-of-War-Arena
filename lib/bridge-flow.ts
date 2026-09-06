export type BridgeHealthState = "ready" | "checking" | "fallback";
import type { FriendzoneEventTitle } from "./event-flow";

export type BridgeRecoveryReason = "offline-mirror";
export type FriendzoneDemoFlowStep = "idle" | "rsvp-saved" | "reconnecting" | "diagnostics";
export type FriendzoneDemoFlowAction = "rsvp" | "reconnect" | "reconnect-complete" | "open-diagnostics";

export type JudgeWalkthroughStep = 1 | 2 | 3 | 4;
export type JudgeFullWalkthroughStage = "idle" | "rsvp" | "reconnect" | "play" | "reward";

export type JudgeFullWalkthroughPlanEntry = {
  actionIndex: 0 | 1 | 2 | 3;
  step: JudgeWalkthroughStep;
  stage: Exclude<JudgeFullWalkthroughStage, "idle">;
};

export function getJudgeFullWalkthroughPlan(): readonly [
  JudgeFullWalkthroughPlanEntry,
  JudgeFullWalkthroughPlanEntry,
  JudgeFullWalkthroughPlanEntry,
  JudgeFullWalkthroughPlanEntry,
] {
  return [
    { actionIndex: 0, step: 1, stage: "rsvp" },
    { actionIndex: 1, step: 2, stage: "reconnect" },
    { actionIndex: 2, step: 3, stage: "play" },
    { actionIndex: 3, step: 4, stage: "reward" },
  ];
}

export function getJudgeFullWalkthroughSequence(): readonly [1, 2, 3, 4] {
  return getJudgeFullWalkthroughPlan().map(({ step }) => step) as [1, 2, 3, 4];
}

export function formatJudgeFullWalkthroughStatus(stage: JudgeFullWalkthroughStage): string {
  if (stage === "rsvp") return "Full walkthrough · RSVP in Friendzone";
  if (stage === "reconnect") return "Full walkthrough · checking bridge";
  if (stage === "play") return "Full walkthrough · opening gameplay";
  if (stage === "reward") return "Full walkthrough · reward receipt ready";
  return "Full walkthrough ready";
}

export type JudgeWalkthroughTransitionSummary = { label: string; accessibilityLabel: string };

export function formatJudgeWalkthroughTransitionSummary({
  stage,
  feedback,
  nextAction,
}: {
  stage: JudgeFullWalkthroughStage;
  feedback: string;
  nextAction: string;
}): JudgeWalkthroughTransitionSummary {
  const safeFeedback = feedback.trim() || formatJudgeFullWalkthroughStatus(stage);
  const safeNextAction = nextAction.trim() || "No pending action";
  const stageLabel = stage === "idle" ? "READY" : stage.toUpperCase();
  return {
    label: `${stageLabel} · ${safeFeedback}`,
    accessibilityLabel: `Judge walkthrough transition. ${stageLabel}. ${safeFeedback}. Next action: ${safeNextAction}.`,
  };
}

export function getJudgeFullWalkthroughActiveStep(stage: JudgeFullWalkthroughStage, fallbackStep: JudgeWalkthroughStep): JudgeWalkthroughStep {
  if (stage === "rsvp") return 1;
  if (stage === "reconnect") return 2;
  if (stage === "play") return 3;
  if (stage === "reward") return 4;
  return fallbackStep;
}

export function formatJudgeFullWalkthroughPauseStatus(stage: JudgeFullWalkthroughStage, paused: boolean): string {
  return paused ? `${formatJudgeFullWalkthroughStatus(stage)} · paused` : formatJudgeFullWalkthroughStatus(stage);
}

export type JudgeWalkthroughDemoSummary = { status: string; progress: string; nextAction: string };
export type JudgeWalkthroughPanelAccessibility = { accessibilityLabel: string; accessibilityState: { expanded: boolean } };
export type JudgeWalkthroughPanelLiveRegion = { accessibilityLiveRegion: "polite"; accessibilityLabel: string };
export type JudgeWalkthroughProofSummaryInput = { bridgeLabel: string; walletConnected: boolean; rewardClaimed: boolean };

export function formatJudgeWalkthroughProofSummary({ bridgeLabel, walletConnected, rewardClaimed }: JudgeWalkthroughProofSummaryInput): string {
  return `Bridge ${bridgeLabel.toLowerCase()}. Wallet ${walletConnected ? "connected" : "ready to connect"}. Receipt ${rewardClaimed ? "saved locally" : "local preview ready"}.`;
}

export type JudgeWalkthroughProofPresentation = { tone: "success" | "warning" | "accent"; icon: "verified" | "account-balance-wallet" | "sync" };
export type JudgeWalkthroughProofLiveRegion = { accessibilityLiveRegion: "polite"; accessibilityLabel: string };

export function formatJudgeWalkthroughProofFreshness(bridgeLabel: string): string {
  return `Proof snapshot · ${bridgeLabel}`;
}

export type BridgeHealthFreshnessPresentation = { tone: "success" | "accent" | "warning"; icon: "check-circle" | "sync" | "help-outline"; label: string };

export function formatBridgeHealthFreshness(lastCheckedLabel: string | null): string {
  return lastCheckedLabel ? `Last checked · ${lastCheckedLabel}` : "Last checked · not yet checked";
}

export function formatBridgeHealthFreshnessPresentation(lastCheckedAt: string | null, retrying: boolean): BridgeHealthFreshnessPresentation {
  if (retrying) return { tone: "accent", icon: "sync", label: "Bridge check in progress" };
  if (lastCheckedAt) return { tone: "success", icon: "check-circle", label: "Bridge check recorded" };
  return { tone: "warning", icon: "help-outline", label: "Bridge check not yet recorded" };
}

export type BridgeHealthDiagnosticsSummaryInput = { statusLabel: string; freshnessLabel: string; recoverySummary: string };

export function formatBridgeHealthDiagnosticsSummary({ statusLabel, freshnessLabel, recoverySummary }: BridgeHealthDiagnosticsSummaryInput): string {
  const normalize = (value: string, fallback: string) => value.trim() || fallback;
  return `Live presence: ${normalize(statusLabel, "unknown")}. ${normalize(freshnessLabel, "Bridge check not yet recorded")}. ${normalize(recoverySummary, "Recovery status unavailable")}`;
}

export type ArenaTimerAccessibilityPresentation = { label: string; hint: string; valueText: string; tone: "neutral" | "warning"; now: number };

export function formatArenaTimerAccessibilityPresentation(seconds: number): ArenaTimerAccessibilityPresentation {
  const now = Math.max(0, Math.round(Number.isFinite(seconds) ? seconds : 0));
  if (now === 0) return { label: "Match timer", hint: "Time is up", valueText: "0 seconds remaining", tone: "warning", now };
  if (now <= 10) return { label: "Match timer", hint: "Final countdown", valueText: `${now} seconds remaining`, tone: "warning", now };
  return { label: "Match timer", hint: "Time remaining in the match", valueText: `${now} seconds remaining`, tone: "neutral", now };
}

export type MatchResultAccessibilityPresentation = { label: string; hint: string; announcement: string };

export function formatMatchResultAccessibilityPresentation(playerWon: boolean): MatchResultAccessibilityPresentation {
  return playerWon
    ? { label: "Victory result", hint: "Your crew won the match. Review the reward receipt or run it back.", announcement: "Victory. Your crew pulled the rope across the line." }
    : { label: "Defeat result", hint: "Your crew lost the match. Review the recap or run it back.", announcement: "Defeat. Your crew can run the match again." };
}

export type ArenaScoreAccessibilityPresentation = { label: string; valueText: string; now: number };

export function formatArenaScoreAccessibilityPresentation(input: { team: "sun" | "moon"; powerLeft: number }): { crew: ArenaScoreAccessibilityPresentation; opponent: ArenaScoreAccessibilityPresentation } {
  const now = Math.max(0, Math.min(100, Math.round(Number.isFinite(input.powerLeft) ? input.powerLeft : 0)));
  const crewLabel = input.team === "sun" ? "Sun Crew" : "Moon Crew";
  const opponentLabel = input.team === "sun" ? "Moon Crew" : "Sun Crew";
  return {
    crew: { label: crewLabel, valueText: `${crewLabel} score`, now },
    opponent: { label: opponentLabel, valueText: `${opponentLabel} score`, now: 100 - now },
  };
}

export type PowerTrackAccessibilityPresentation = { label: string; hint: string; valueText: string; now: number };

export function formatPowerTrackAccessibilityPresentation(input: { team: "sun" | "moon"; powerLeft: number }): PowerTrackAccessibilityPresentation {
  const now = Math.max(0, Math.min(100, Math.round(Number.isFinite(input.powerLeft) ? input.powerLeft : 0)));
  const crewLabel = input.team === "sun" ? "Sun Crew" : "Moon Crew";
  return {
    label: `${crewLabel} rope power`,
    hint: "Shows the current balance between your crew and the opposing crew",
    valueText: `${now} percent for your crew and ${100 - now} percent for the opposing crew`,
    now,
  };
}

export type MatchHistoryRecapPresentationInput = { result: string; selected: boolean; shareInFlight: boolean };
export type MatchHistoryRecapPresentation = { label: string; hint: string; icon: "ios-share" | "arrow-upward" | "replay"; accessibilityState: { selected: boolean; busy: boolean } };

export function formatMatchHistoryRecapPresentation({ result, selected, shareInFlight }: MatchHistoryRecapPresentationInput): MatchHistoryRecapPresentation {
  const normalizedResult = result === "Victory" ? "Victory" : "Defeat";
  if (selected) return { label: `${normalizedResult} recap selected`, hint: shareInFlight ? "Recap sharing is in progress." : "Recap selected. Use the share action in the match recap above.", icon: "ios-share", accessibilityState: { selected: true, busy: shareInFlight } };
  return { label: `${normalizedResult} match`, hint: "Selects this match and prepares its recap for sharing.", icon: normalizedResult === "Victory" ? "arrow-upward" : "replay", accessibilityState: { selected: false, busy: false } };
}

export type MatchmakingReadinessPresentation = { statusTitle: string; statusHint: string; readyLabel: string; readyHint: string; readyAccessibilityLabel: string; entryAccessibilityLabel: string; entryHint: string; entryDisabled: boolean };

export function formatMatchmakingReadinessPresentation(ready: boolean): MatchmakingReadinessPresentation {
  if (ready) return { statusTitle: "You are locked in", statusHint: "The arena is waiting for you.", readyLabel: "READY", readyHint: "Toggles readiness off", readyAccessibilityLabel: "Ready for the arena", entryAccessibilityLabel: "Enter the arena", entryHint: "Starts the tug-of-war match", entryDisabled: false };
  return { statusTitle: "Not ready yet", statusHint: "Tap ready when your team is chosen.", readyLabel: "READY UP", readyHint: "Confirms your team and unlocks the arena entry action", readyAccessibilityLabel: "Ready up for the arena", entryAccessibilityLabel: "Enter the arena, unavailable until ready", entryHint: "Tap READY UP first to unlock the arena", entryDisabled: true };
}

export type FirstMatchProgressPresentation = { label: string; accessibilityLabel: string };

export function formatFirstMatchProgressPresentation(ready: boolean): FirstMatchProgressPresentation {
  return ready ? { label: "01 SIDE CHOSEN · 02 READY · 03 PULL FOR PLAZA BAND", accessibilityLabel: "First-match progress: side chosen and ready; next, enter the arena" } : { label: "01 SIDE CHOSEN · 02 READY UP · 03 PULL FOR PLAZA BAND", accessibilityLabel: "First-match progress: side chosen; next, ready up, then enter the arena" };
}

export type FirstPullCoachingPresentation = { label: string; accessibilityLabel: string };

export function formatFirstPullCoachingPresentation(taps: number): FirstPullCoachingPresentation {
  return taps > 0 ? { label: "KEEP PULLING · BUILD YOUR STREAK", accessibilityLabel: `First pull complete. ${taps} pulls recorded. Keep pulling to build your streak.` } : { label: "FIRST PULL · TAP TO MOVE THE ROPE", accessibilityLabel: "First pull ready. Tap PULL to move the rope toward your crew." };
}

export type WalletReadyRewardPresentationInput = { playerWon: boolean; walletConnected: boolean; rewardClaimed: boolean };
export type WalletReadyRewardPresentation = { title: string; metadata: string; icon: "check-circle" | "card-giftcard"; tone: "success" | "warning"; accessibilityLabel: string };

export function formatWalletReadyRewardPresentation({ playerWon, walletConnected, rewardClaimed }: WalletReadyRewardPresentationInput): WalletReadyRewardPresentation {
  if (!playerWon) return { title: "Keep pulling for Wearables", metadata: walletConnected ? "Wallet connected · win a round to save a receipt" : "Connect a wallet to prepare a future claim", icon: "card-giftcard", tone: "warning", accessibilityLabel: "No reward receipt yet. Keep pulling for a wallet-ready wearable preview." };
  if (rewardClaimed) return { title: "Wearable Airdrop · Receipt Saved", metadata: walletConnected ? "Wallet connected · local receipt saved" : "Local receipt saved · wallet connect remains optional", icon: "check-circle", tone: "success", accessibilityLabel: "Winning wearable preview with a local receipt saved. Minting awaits approved live services." };
  return { title: "Wearable Airdrop · Ready", metadata: walletConnected ? "Wallet connected · save a local receipt to prepare a future claim" : "Connect a wallet to prepare a future claim", icon: "card-giftcard", tone: "warning", accessibilityLabel: "Winning wearable preview is ready locally. No on-chain mint has occurred." };
}

export type WalletReadyRewardActionPresentation = { label: string; hint: string; disabled: boolean; accessibilityState: { disabled: boolean } };

export function formatWalletReadyRewardActionPresentation(rewardClaimed: boolean): WalletReadyRewardActionPresentation {
  if (rewardClaimed) return { label: "Reward receipt saved locally", hint: "This local preview is ready to mint when live services are approved", disabled: true, accessibilityState: { disabled: true } };
  return { label: "Save local reward claim receipt", hint: "Saves a local wallet-ready receipt without minting on chain", disabled: false, accessibilityState: { disabled: false } };
}

export type ReceiptDetailsDisclosurePresentation = { label: string; hint: string; accessibilityState: { expanded: boolean } };

export function formatReceiptDetailsDisclosurePresentation(open: boolean): ReceiptDetailsDisclosurePresentation {
  return open ? { label: "Hide local receipt details", hint: "Hides local wearable traits and the future minting boundary", accessibilityState: { expanded: true } } : { label: "View local receipt details", hint: "Shows local wearable traits and the future minting boundary", accessibilityState: { expanded: false } };
}

export function formatJudgeWalkthroughProofLiveRegion(summary: string): JudgeWalkthroughProofLiveRegion {
  return { accessibilityLiveRegion: "polite", accessibilityLabel: `Proof readiness updated. ${summary}` };
}

export function formatJudgeWalkthroughProofPresentation({ bridgeLabel, walletConnected, rewardClaimed }: JudgeWalkthroughProofSummaryInput): JudgeWalkthroughProofPresentation {
  if (bridgeLabel.toLowerCase().includes("reconnect")) return { tone: "accent", icon: "sync" };
  if (!walletConnected || !rewardClaimed) return { tone: "warning", icon: "account-balance-wallet" };
  return { tone: "success", icon: "verified" };
}

export function formatJudgeWalkthroughPanelLiveRegion(open: boolean): JudgeWalkthroughPanelLiveRegion {
  return { accessibilityLiveRegion: "polite", accessibilityLabel: `Judge walkthrough guide ${open ? "expanded" : "collapsed"}.` };
}

export function formatJudgeWalkthroughPanelAccessibility(open: boolean, statusAnnouncement: string): JudgeWalkthroughPanelAccessibility {
  return { accessibilityLabel: `Judge walkthrough guide${open ? " expanded" : " collapsed"}. ${statusAnnouncement}`, accessibilityState: { expanded: open } };
}

export function formatJudgeWalkthroughStatusAnnouncement(summary: JudgeWalkthroughDemoSummary): string {
  return `${summary.status}. ${summary.progress}. ${summary.nextAction}.`;
}

export type JudgeWalkthroughLifecycleLiveRegion = { accessibilityLiveRegion: "polite"; accessibilityLabel: string };

export function formatJudgeWalkthroughLifecycleLiveRegion(summary: JudgeWalkthroughDemoSummary): JudgeWalkthroughLifecycleLiveRegion {
  return { accessibilityLiveRegion: "polite", accessibilityLabel: formatJudgeWalkthroughStatusAnnouncement(summary) };
}

export function formatJudgeWalkthroughDemoSummary({
  stage,
  isRunning,
  isPaused,
  completedCount,
  currentStep,
}: {
  stage: JudgeFullWalkthroughStage;
  isRunning: boolean;
  isPaused: boolean;
  completedCount: number;
  currentStep: JudgeWalkthroughStep;
}): JudgeWalkthroughDemoSummary {
  const status = isPaused
    ? formatJudgeFullWalkthroughPauseStatus(stage, true)
    : isRunning
      ? formatJudgeFullWalkthroughStatus(stage)
      : stage === "reward"
        ? formatJudgeFullWalkthroughCompleteStatus()
        : formatJudgeFullWalkthroughStatus(stage);
  const progress = formatJudgeWalkthroughProgressLabel(completedCount, currentStep);
  const nextAction = !isRunning && !isPaused && stage === "reward"
    ? "Demo complete · reward receipt ready"
    : formatJudgeWalkthroughActionFeedback(currentStep);
  return { status, progress, nextAction };
}

export function canResumeJudgeFullWalkthrough(paused: boolean, running = false): boolean {
  return paused && !running;
}

export function formatJudgeFullWalkthroughCancelStatus(): string {
  return "Full walkthrough cancelled · manual controls active";
}

export function formatJudgeFullWalkthroughRestartStatus(): string {
  return "Full walkthrough restarting · RSVP step next";
}

export type JudgeWalkthroughRewardHandoffOutcome = "completed" | "already-completed" | "interrupted";
export type JudgeRewardHandoffRecovery = "resume" | "reset" | "ignore-completed";

export function resolveJudgeRewardHandoffRecovery({
  stage,
  isRunning,
  isPaused,
}: {
  stage: JudgeFullWalkthroughStage;
  isRunning: boolean;
  isPaused: boolean;
}): JudgeRewardHandoffRecovery {
  if (stage === "reward" && !isRunning && !isPaused) return "ignore-completed";
  if (isPaused && stage !== "idle") return "resume";
  return "reset";
}

export function formatJudgeWalkthroughRewardHandoffAnnouncement(outcome: JudgeWalkthroughRewardHandoffOutcome): string {
  if (outcome === "completed") return "Full walkthrough complete. Wallet-ready reward receipt is open.";
  if (outcome === "already-completed") return "Reward receipt is already open. Walkthrough remains complete.";
  return "Walkthrough interrupted before reward handoff. Reset or resume to continue.";
}

export function formatJudgeFullWalkthroughCompleteStatus(): string {
  return "Full walkthrough complete · reward receipt ready";
}

export type JudgeFullWalkthroughLifecycleEvent = "cancel" | "restart" | "complete";
export type JudgeFullWalkthroughLifecycleStatus = "idle" | "running" | "completed";
export type JudgeFullWalkthroughLifecycleTransition = {
  status: JudgeFullWalkthroughLifecycleStatus;
  stage: JudgeFullWalkthroughStage;
  nextAction: 0 | 1 | 2 | 3;
  feedback: string;
};

export type JudgeWalkthroughResetIntent = "reset-active" | "reset-paused" | "reset-completed" | "noop";
export type JudgeWalkthroughResetControlPresentation = { label: string; hint: string };

export type JudgeWalkthroughResetFeedbackLiveRegion = { accessibilityLiveRegion: "polite"; accessibilityLabel: string };

export function formatJudgeWalkthroughResetFeedbackLiveRegion(status: string): JudgeWalkthroughResetFeedbackLiveRegion {
  return { accessibilityLiveRegion: "polite", accessibilityLabel: status };
}

export function formatJudgeWalkthroughResetControlPresentation(intent: JudgeWalkthroughResetIntent): JudgeWalkthroughResetControlPresentation {
  if (intent === "reset-active") return { label: "RESET TO RSVP", hint: "Stops the running walkthrough and returns to RSVP while preserving saved demo data." };
  if (intent === "reset-paused") return { label: "RESET TO RSVP", hint: "Clears the paused walkthrough position and returns to RSVP while preserving saved demo data." };
  if (intent === "reset-completed") return { label: "RESET TO RSVP", hint: "Starts a fresh walkthrough from RSVP while preserving the completed reward receipt." };
  return { label: "RESET TO RSVP", hint: "The walkthrough is already at RSVP; use this control to confirm the demo baseline." };
}

export type JudgeWalkthroughManualStepAction = "allow" | "blocked-running" | "blocked-paused";
export type JudgeBlockedAction = "walkthrough-running" | "walkthrough-paused" | "handoff-busy";

export function formatJudgeBlockedActionFeedback(action: JudgeBlockedAction): string {
  if (action === "walkthrough-running") return "Walkthrough is running · manual controls are temporarily locked";
  if (action === "walkthrough-paused") return "Walkthrough is paused · reset or resume before using manual controls";
  return "Handoff in progress · wait for the current action to finish";
}

export function formatJudgeBlockedActionAnnouncement(action: JudgeBlockedAction): string {
  return formatJudgeBlockedActionFeedback(action);
}

export function resolveJudgeWalkthroughManualStepAction({
  isRunning,
  isPaused,
}: {
  isRunning: boolean;
  isPaused: boolean;
}): JudgeWalkthroughManualStepAction {
  if (isRunning) return "blocked-running";
  if (isPaused) return "blocked-paused";
  return "allow";
}

export function canRunJudgeWalkthroughManualStep({
  isRunning,
  isPaused,
}: {
  isRunning: boolean;
  isPaused: boolean;
}): boolean {
  return resolveJudgeWalkthroughManualStepAction({ isRunning, isPaused }) === "allow";
}

export type JudgeCurrentStepNavigation = "allow" | "blocked-running" | "blocked-paused" | "blocked-completed";

export function resolveJudgeCurrentStepNavigation({
  stage,
  isRunning,
  isPaused,
}: {
  stage: JudgeFullWalkthroughStage;
  isRunning: boolean;
  isPaused: boolean;
}): JudgeCurrentStepNavigation {
  if (stage === "reward" && !isRunning && !isPaused) return "blocked-completed";
  if (isRunning) return "blocked-running";
  if (isPaused) return "blocked-paused";
  return "allow";
}

export type JudgeCurrentStepNavigationFeedback = { label: string; hint: string };

export function formatJudgeCurrentStepNavigationFeedback(
  outcome: JudgeCurrentStepNavigation,
  nextAction: string,
): JudgeCurrentStepNavigationFeedback {
  if (outcome === "blocked-running") return { label: "Walkthrough running", hint: "Automatic transitions are active. Wait for the current stage to finish." };
  if (outcome === "blocked-paused") return { label: "Walkthrough paused", hint: "Resume the walkthrough before opening the current step." };
  if (outcome === "blocked-completed") return { label: "Walkthrough complete", hint: "Run the walkthrough again or reset to RSVP to open another step." };
  return { label: "Open next action", hint: `Opens ${nextAction.toLowerCase()}.` };
}

export type JudgeWalkthroughPrimaryControlFeedback = { label: string; hint: string; disabled: boolean; busy: boolean };
export type JudgeWalkthroughPrimaryControlIcon = "play-arrow" | "sync" | "replay";
export type JudgeWalkthroughPrimaryControlPresentation = JudgeWalkthroughPrimaryControlFeedback & { icon: JudgeWalkthroughPrimaryControlIcon };

export type JudgeWalkthroughLifecycleBadge = "READY" | "RUNNING" | "PAUSED" | "COMPLETE";
export type JudgeWalkthroughLifecycleTone = "neutral" | "accent" | "warning" | "success";
export type JudgeWalkthroughLifecycleIcon = "play-circle-outline" | "sync" | "pause-circle-outline" | "check-circle";
export type JudgeWalkthroughLifecyclePresentation = { badge: JudgeWalkthroughLifecycleBadge; tone: JudgeWalkthroughLifecycleTone; icon: JudgeWalkthroughLifecycleIcon };
export type JudgeWalkthroughLifecycleAccessibilityState = { busy: boolean; selected: boolean };

export function formatJudgeWalkthroughPrimaryControlPresentation({
  stage,
  isRunning,
  isPaused,
  nextAction,
}: {
  stage: JudgeFullWalkthroughStage;
  isRunning: boolean;
  isPaused: boolean;
  nextAction: string;
}): JudgeWalkthroughPrimaryControlPresentation {
  const safePaused = isPaused && stage !== "idle";
  const feedback = formatJudgeWalkthroughPrimaryControlFeedback({ stage, isRunning, isPaused: safePaused });
  return {
    ...feedback,
    icon: formatJudgeWalkthroughPrimaryControlIcon({ stage, isRunning, isPaused: safePaused }),
    hint: `${feedback.hint} Next action: ${nextAction}.`,
  };
}

export function formatJudgeWalkthroughPrimaryControlIcon({
  stage,
  isRunning,
  isPaused,
}: {
  stage: JudgeFullWalkthroughStage;
  isRunning: boolean;
  isPaused: boolean;
}): JudgeWalkthroughPrimaryControlIcon {
  if (isRunning) return "sync";
  if (stage === "reward" && !isPaused) return "replay";
  return "play-arrow";
}

export function formatJudgeWalkthroughLifecycleBadge({
  stage,
  isRunning,
  isPaused,
}: {
  stage: JudgeFullWalkthroughStage;
  isRunning: boolean;
  isPaused: boolean;
}): JudgeWalkthroughLifecycleBadge {
  if (isRunning) return "RUNNING";
  if (isPaused && stage !== "idle") return "PAUSED";
  if (stage === "reward") return "COMPLETE";
  return "READY";
}

export function formatJudgeWalkthroughLifecyclePresentation({
  stage,
  isRunning,
  isPaused,
}: {
  stage: JudgeFullWalkthroughStage;
  isRunning: boolean;
  isPaused: boolean;
}): JudgeWalkthroughLifecyclePresentation {
  const badge = formatJudgeWalkthroughLifecycleBadge({ stage, isRunning, isPaused });
  if (badge === "RUNNING") return { badge, tone: "accent", icon: "sync" };
  if (badge === "PAUSED") return { badge, tone: "warning", icon: "pause-circle-outline" };
  if (badge === "COMPLETE") return { badge, tone: "success", icon: "check-circle" };
  return { badge, tone: "neutral", icon: "play-circle-outline" };
}

export function formatJudgeWalkthroughLifecycleAccessibilityState({
  stage,
  isRunning,
  isPaused,
}: {
  stage: JudgeFullWalkthroughStage;
  isRunning: boolean;
  isPaused: boolean;
}): JudgeWalkthroughLifecycleAccessibilityState {
  const badge = formatJudgeWalkthroughLifecycleBadge({ stage, isRunning, isPaused });
  return { busy: badge === "RUNNING", selected: badge !== "READY" };
}

export function formatJudgeWalkthroughPrimaryControlFeedback({
  stage,
  isRunning,
  isPaused,
}: {
  stage: JudgeFullWalkthroughStage;
  isRunning: boolean;
  isPaused: boolean;
}): JudgeWalkthroughPrimaryControlFeedback {
  if (isRunning) return { label: "WALKTHROUGH RUNNING…", hint: "Automatic walkthrough transitions are active. Wait for the current stage to finish.", disabled: true, busy: true };
  if (isPaused && stage !== "idle") return { label: "RESUME WALKTHROUGH", hint: "Continues the walkthrough from its current stage.", disabled: false, busy: false };
  if (stage === "reward") return { label: "RUN WALKTHROUGH AGAIN", hint: "Starts a fresh walkthrough from the RSVP step without clearing saved demo data.", disabled: false, busy: false };
  return { label: "RUN FULL WALKTHROUGH", hint: "Automatically opens the RSVP, bridge, gameplay, and reward moments for a repeatable demo.", disabled: false, busy: false };
}

export function isJudgeFullWalkthroughTerminal({
  stage,
  isRunning,
  isPaused,
}: {
  stage: JudgeFullWalkthroughStage;
  isRunning: boolean;
  isPaused: boolean;
}): boolean {
  return stage === "reward" && !isRunning && !isPaused;
}

export function resolveJudgeWalkthroughResetIntent({
  isRunning,
  isPaused,
  isCompleted,
}: {
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
}): JudgeWalkthroughResetIntent {
  if (isRunning) return "reset-active";
  if (isPaused) return "reset-paused";
  if (isCompleted) return "reset-completed";
  return "noop";
}

export function shouldInvalidateJudgeWalkthroughCallbacks(intent: JudgeWalkthroughResetIntent): boolean {
  return intent !== "noop";
}

export function resolveJudgeFullWalkthroughLifecycle(event: JudgeFullWalkthroughLifecycleEvent): JudgeFullWalkthroughLifecycleTransition {
  if (event === "restart") {
    return { status: "running", stage: "rsvp", nextAction: 0, feedback: formatJudgeFullWalkthroughRestartStatus() };
  }
  if (event === "complete") {
    return { status: "completed", stage: "reward", nextAction: 0, feedback: formatJudgeFullWalkthroughCompleteStatus() };
  }
  return { status: "idle", stage: "idle", nextAction: 0, feedback: formatJudgeFullWalkthroughCancelStatus() };
}

export function deriveJudgeWalkthroughStep(
  flow: FriendzoneDemoFlowStep,
  screen: "home" | "social" | "settings" | "lobby" | "arena" | "results" | "leaderboard",
): JudgeWalkthroughStep {
  if (screen === "results") return 4;
  if (screen === "arena") return 3;
  if (flow === "rsvp-saved" || flow === "reconnecting") return 2;
  return 1;
}

export type JudgePacingPreset = "quick" | "standard" | "presenter";

export function parseJudgePacingPreset(value: string | null): JudgePacingPreset | null {
  if (value === "quick" || value === "standard" || value === "presenter") return value;
  return null;
}

export function getJudgePacingDelay(preset: JudgePacingPreset): number {
  if (preset === "quick") return 350;
  if (preset === "presenter") return 1400;
  return 700;
}

export function formatJudgePacingPreset(preset: JudgePacingPreset): string {
  if (preset === "quick") return "Quick · 0.35s handoff";
  if (preset === "presenter") return "Presenter · 1.4s handoff";
  return "Standard · 0.7s handoff";
}

export function formatJudgeAutoAdvanceStatus(enabled: boolean): string {
  return enabled ? "Auto-advance on · handoff steps continue automatically" : "Auto-advance off · manual controls active";
}

export function formatJudgeTimingStatus(autoAdvance: boolean, pacingPreset: JudgePacingPreset): string {
  return `${autoAdvance ? "Auto-advance" : "Manual controls"} · ${formatJudgePacingPreset(pacingPreset)}`;
}

export type JudgeModeSettings = { autoAdvance: boolean; pacingPreset: JudgePacingPreset };

export function getJudgePresenterModeSettings(): { autoAdvance: true; pacingPreset: "presenter" } {
  return { autoAdvance: true, pacingPreset: "presenter" };
}

export function getJudgeManualModeSettings(): { autoAdvance: false; pacingPreset: "standard" } {
  return { autoAdvance: false, pacingPreset: "standard" };
}

export type JudgeSettingsStorageStatus = "pending" | "persisted" | "defaults" | "unavailable";

export type JudgeSettingsDeliveryOutcome = "copied" | "shared" | "fallback" | "ignored";

export function formatJudgeSettingsSummary(
  autoAdvance: boolean,
  pacingPreset: JudgePacingPreset,
  storageStatus: JudgeSettingsStorageStatus,
): string {
  return `Tug of War Arena · Judge settings\n${formatJudgeSettingsStatus(autoAdvance, pacingPreset, storageStatus)}\nWallet and account identifiers omitted.`;
}

export function resolveJudgeSettingsDeliveryOutcome({
  clipboardCopied,
  shared,
  isMounted,
  inFlight,
}: {
  clipboardCopied: boolean;
  shared: boolean;
  isMounted: boolean;
  inFlight: boolean;
}): JudgeSettingsDeliveryOutcome {
  if (inFlight || !isMounted) return "ignored";
  if (clipboardCopied) return "copied";
  if (shared) return "shared";
  return "fallback";
}

export type JudgeSettingsDeliveryFeedback = { status: string; announcement: string };

export function formatJudgeSettingsDeliveryFeedback(outcome: JudgeSettingsDeliveryOutcome): JudgeSettingsDeliveryFeedback {
  if (outcome === "copied") return { status: "Settings summary copied", announcement: "Judge settings summary copied to the clipboard." };
  if (outcome === "shared") return { status: "Settings summary shared", announcement: "Judge settings summary is ready in the native share sheet." };
  if (outcome === "fallback") return { status: "Copy unavailable — use Share", announcement: "Copy is unavailable. Use Share to send the judge settings summary." };
  return { status: "Settings action ignored", announcement: "The settings action is already in progress or the screen is no longer active." };
}

export function formatJudgeSettingsDeliveryStatus(outcome: JudgeSettingsDeliveryOutcome): string {
  return formatJudgeSettingsDeliveryFeedback(outcome).status;
}

export type NativeHandoffFailureKind =
  | "recap-share"
  | "diagnostics-copy"
  | "diagnostics-share"
  | "party-code-copy"
  | "plaza-coordinates-copy"
  | "plaza-open"
  | "event-share"
  | "party-invite-share"
  | "invite-link-share";

export type NativeHandoffFailureCopy = { status: string; announcement: string };

export type PlazaHandoffTarget = "copy" | "share" | "open";
export type PlazaHandoffAction = "idle" | "copying" | "sharing" | "opening";
export type PlazaHandoffAccessibility = { label: string; hint: string; busy: boolean; disabled: boolean };

export function canStartPlazaHandoff(action: PlazaHandoffAction): boolean {
  return action === "idle";
}

export function formatPlazaHandoffAccessibility(target: PlazaHandoffTarget, action: PlazaHandoffAction): PlazaHandoffAccessibility {
  const busy = (target === "copy" && action === "copying") || (target === "share" && action === "sharing") || (target === "open" && action === "opening");
  const disabled = !canStartPlazaHandoff(action);
  if (target === "copy") return { label: busy ? "Copying Decentraland Plaza coordinates" : "Copy Decentraland Plaza coordinates", hint: disabled ? "Wait for the current Plaza handoff to finish" : "Copies the Plaza coordinates to the clipboard", busy, disabled };
  if (target === "share") return { label: busy ? "Sharing Plaza event invite" : "Share Plaza event invite", hint: disabled ? "Wait for the current Plaza handoff to finish" : "Opens the native share sheet for the Plaza event invite", busy, disabled };
  return { label: busy ? "Opening Decentraland Plaza" : "Open Decentraland Plaza", hint: disabled ? "Wait for the current Plaza handoff to finish" : "Opens Decentraland Plaza in the available browser or app", busy, disabled };
}

export type JudgeWalkthroughCallbackOutcome = "commit" | "ignore-unmounted" | "ignore-not-running" | "ignore-paused" | "ignore-out-of-order" | "ignore-stale-generation";

export function resolveJudgeWalkthroughCallbackOutcome({
  isMounted,
  isRunning,
  isPaused,
  actionIndex,
  nextAction,
  callbackGeneration = 0,
  currentGeneration = 0,
}: {
  isMounted: boolean;
  isRunning: boolean;
  isPaused: boolean;
  actionIndex: number;
  nextAction: number;
  callbackGeneration?: number;
  currentGeneration?: number;
}): JudgeWalkthroughCallbackOutcome {
  if (!isMounted) return "ignore-unmounted";
  if (!isRunning) return "ignore-not-running";
  if (isPaused) return "ignore-paused";
  if (callbackGeneration !== currentGeneration) return "ignore-stale-generation";
  if (!Number.isInteger(actionIndex) || !Number.isInteger(nextAction) || actionIndex < 0 || nextAction < 0) return "ignore-out-of-order";
  if (actionIndex !== nextAction) return "ignore-out-of-order";
  return "commit";
}

export type JudgeWalkthroughCallbackIgnoredFeedback = { status: string; announcement: string };

export function formatJudgeWalkthroughCallbackIgnoredFeedback(outcome: Exclude<JudgeWalkthroughCallbackOutcome, "commit">): JudgeWalkthroughCallbackIgnoredFeedback {
  if (outcome === "ignore-stale-generation") return { status: "Walkthrough callback ignored · stale run", announcement: "A delayed walkthrough callback was ignored because the walkthrough was reset or restarted." };
  if (outcome === "ignore-out-of-order") return { status: "Walkthrough callback ignored · out of order", announcement: "A delayed walkthrough callback was ignored because the walkthrough is waiting for an earlier step." };
  if (outcome === "ignore-paused") return { status: "Walkthrough callback held · paused", announcement: "The walkthrough callback is waiting until the paused walkthrough resumes." };
  if (outcome === "ignore-not-running") return { status: "Walkthrough callback ignored · not running", announcement: "A delayed walkthrough callback was ignored because the walkthrough is no longer running." };
  return { status: "Walkthrough callback ignored · screen closed", announcement: "A delayed walkthrough callback was ignored because the walkthrough screen is no longer active." };
}

export function canCommitJudgeWalkthroughCallback(input: Parameters<typeof resolveJudgeWalkthroughCallbackOutcome>[0]): boolean {
  return resolveJudgeWalkthroughCallbackOutcome(input) === "commit";
}

export function formatNativeHandoffFailure(kind: NativeHandoffFailureKind, subject?: string): NativeHandoffFailureCopy {
  const safeSubject = subject?.trim() || "Event invite";
  if (kind === "recap-share") return { status: "Recap ready to share", announcement: "Native sharing is unavailable. The recap remains ready to share." };
  if (kind === "diagnostics-copy") return { status: "Diagnostics report ready to share", announcement: "Copy is unavailable. Use Share to send the sanitized Diagnostics report." };
  if (kind === "diagnostics-share") return { status: "Diagnostics report ready to share", announcement: "Native sharing is unavailable. The sanitized Diagnostics report remains ready to share." };
  if (kind === "party-code-copy") return { status: "Copy unavailable — use Share", announcement: "Copy is unavailable. Use the share action to send this invite." };
  if (kind === "plaza-coordinates-copy") return { status: "Coordinates ready — use Share", announcement: "Coordinate copy is unavailable. Use Share to send the Plaza location." };
  if (kind === "plaza-open") return { status: "Plaza link ready — use Share", announcement: "The Decentraland world is unavailable here. The Plaza link remains ready to share." };
  if (kind === "event-share") return { status: `${safeSubject} ready to copy`, announcement: "Native sharing is unavailable. The event invite remains ready to copy." };
  if (kind === "party-invite-share") return { status: "Ready to copy", announcement: "Native sharing is unavailable. The party code remains ready to copy." };
  return { status: "Link ready", announcement: "Native sharing is unavailable. The invite link remains ready to share." };
}

export function formatJudgeSettingsStatus(
  autoAdvance: boolean,
  pacingPreset: JudgePacingPreset,
  storageStatus: JudgeSettingsStorageStatus,
): string {
  const mode = autoAdvance && pacingPreset === "presenter" ? "Presenter Mode" : "Manual demo controls";
  const pacing = formatJudgePacingPreset(pacingPreset).split(" · ")[0];
  const source = storageStatus === "persisted" ? "persisted locally" : storageStatus === "defaults" ? "local defaults" : storageStatus === "unavailable" ? "storage unavailable" : "restoring";
  return `${mode} · ${pacing} pacing · ${source}`;
}

export function formatJudgeWalkthroughActionFeedback(step: JudgeWalkthroughStep): string {
  if (step === 1) return "RSVP saved · next: reconnect bridge";
  if (step === 2) return "Reconnect checked · next: play tug of war";
  if (step === 3) return "Arena opened · next: review reward receipt";
  return "Reward surface opened · walkthrough ready to complete";
}

export function formatJudgeWalkthroughProgress(completedCount: number): string {
  const safeCount = Math.max(0, Math.min(4, Math.trunc(completedCount)));
  return `${safeCount} of 4 complete`;
}

export function formatJudgeWalkthroughProgressLabel(completedCount: number, currentStep: JudgeWalkthroughStep): string {
  return `${formatJudgeWalkthroughProgress(completedCount)} · current step ${currentStep}`;
}

export function isJudgeWalkthroughStepComplete(
  step: JudgeWalkthroughStep,
  currentStep: JudgeWalkthroughStep,
  rewardSaved: boolean,
): boolean {
  return step < currentStep || (step === 4 && rewardSaved);
}

export function formatJudgeWalkthroughCompletion(isRewardSaved: boolean): string {
  return isRewardSaved ? "Walkthrough complete · reward receipt saved" : "Walkthrough complete · reward receipt ready";
}

export function formatJudgeWalkthroughResetStatus(): string {
  return "Walkthrough reset to RSVP";
}

export function formatJudgeWalkthroughStep(step: JudgeWalkthroughStep): string {
  if (step === 1) return "RSVP IN FRIENDZONE";
  if (step === 2) return "RECONNECT BRIDGE";
  if (step === 3) return "PLAY TUG OF WAR";
  return "SHOW REWARD RECEIPT";
}

export function formatFriendzoneDemoFlowStep(step: FriendzoneDemoFlowStep): string {
  if (step === "rsvp-saved") return "RSVP SAVED";
  if (step === "reconnecting") return "RECONNECTING";
  if (step === "diagnostics") return "DIAGNOSTICS OPEN";
  return "READY TO RSVP";
}

export function advanceFriendzoneDemoFlow(
  step: FriendzoneDemoFlowStep,
  action: FriendzoneDemoFlowAction,
): FriendzoneDemoFlowStep {
  if (action === "open-diagnostics") return "diagnostics";
  if (action === "rsvp" && (step === "idle" || step === "diagnostics")) return "rsvp-saved";
  if (action === "reconnect" && step === "rsvp-saved") return "reconnecting";
  if (action === "reconnect-complete" && step === "reconnecting") return "rsvp-saved";
  return step;
}

export function parseBridgeRecoveryReason(value: string): BridgeRecoveryReason | null {
  return value === "offline-mirror" ? value : null;
}

export type BridgeRecoveryReasonHydrationStatus = "missing" | "valid" | "malformed" | "unavailable";
export type BridgeRecoveryReasonRecovery = { value: BridgeRecoveryReason | null; warning: boolean };

export function resolveBridgeRecoveryReasonRecovery(status: BridgeRecoveryReasonHydrationStatus, value: BridgeRecoveryReason | null): BridgeRecoveryReasonRecovery {
  if (status === "valid" && value) return { value, warning: false };
  return { value: null, warning: status === "malformed" || status === "unavailable" };
}

export interface BridgeFlowState {
  health: BridgeHealthState;
  diagnosticsOpen: boolean;
  lastCheckedAt: string | null;
}

export const initialBridgeFlowState: BridgeFlowState = {
  health: "ready",
  diagnosticsOpen: false,
  lastCheckedAt: null,
};

export function beginBridgeReconnect(state: BridgeFlowState): BridgeFlowState {
  if (state.health === "checking") return state;
  return { ...state, health: "checking" };
}

export function completeBridgeReconnect(
  state: BridgeFlowState,
  completedAt: string,
  mounted: boolean,
): BridgeFlowState {
  if (!mounted || state.health !== "checking") return state;
  return { ...state, health: "fallback", lastCheckedAt: completedAt };
}

export function openBridgeDiagnostics(state: BridgeFlowState): BridgeFlowState {
  return { ...state, diagnosticsOpen: true };
}

export function bridgeStatusMessage(health: BridgeHealthState): string {
  if (health === "checking") return "Checking live presence";
  if (health === "fallback") return "Live presence unavailable · offline mirror active";
  return "Live presence ready";
}

export function formatBridgeTimestamp(timestamp: string | null): string {
  if (!timestamp) return "Not checked yet";
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return "Timestamp unavailable";
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export type BridgeTimestampHydrationStatus = "missing" | "valid" | "malformed" | "unavailable";
export type BridgeTimestampRecovery = { value: string | null; warning: boolean };

export function resolveBridgeTimestampRecovery(status: BridgeTimestampHydrationStatus, value: string | null): BridgeTimestampRecovery {
  if (status === "valid" && value) return { value, warning: false };
  return { value: null, warning: status === "malformed" || status === "unavailable" };
}

export function formatResetStatusMessage(succeeded: boolean): string {
  return succeeded
    ? "Demo reset. Arena Home is ready for another run."
    : "Demo reset needs another attempt. Diagnostics are open.";
}

export type DemoResetBaseline = {
  time: 30;
  pull: 0;
  taps: 0;
  streak: 0;
  surgeReady: false;
  surgeActive: false;
  rewardClaimed: false;
  receiptDetailsOpen: false;
  resultCounted: false;
  judgeFullWalkthroughStage: "idle";
  judgeWalkthroughOpen: false;
  friendzoneDemoFlow: "idle";
  selectedEvent: null;
};

export function getDemoResetBaseline(): DemoResetBaseline {
  return {
    time: 30,
    pull: 0,
    taps: 0,
    streak: 0,
    surgeReady: false,
    surgeActive: false,
    rewardClaimed: false,
    receiptDetailsOpen: false,
    resultCounted: false,
    judgeFullWalkthroughStage: "idle",
    judgeWalkthroughOpen: false,
    friendzoneDemoFlow: "idle",
    selectedEvent: null,
  };
}

export type DemoResetAccessibilityState = {
  label: string;
  hint: string;
  busy: boolean;
  disabled: boolean;
};

export function getDemoResetAccessibilityState(resetting: boolean): DemoResetAccessibilityState {
  return {
    label: resetting ? "Resetting local demo progress" : "Reset local demo progress",
    hint: resetting ? "Please wait while local demo data is being cleared" : "Clears local match history and returns to Arena Home",
    busy: resetting,
    disabled: resetting,
  };
}

export function formatBridgeRecoveryReason(
  reason: BridgeRecoveryReason | null,
  health: BridgeHealthState = "ready",
): string {
  if (reason === "offline-mirror") return "Live presence unavailable; offline mirror active.";
  if (health === "fallback") return "Recovery recorded; reason unavailable.";
  return "No recovery recorded.";
}

export function formatReportCopyStatus(succeeded: boolean): string {
  return succeeded ? "Report copied" : "Copy unavailable — use Share";
}

export function formatReportGeneratedAt(timestamp: string): string {
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? "Timestamp unavailable" : parsed.toISOString();
}

function normalizeReportText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/(?:\\[rn]|[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F])+/g, " ").trim().slice(0, 160);
  return normalized || fallback;
}

export interface SanitizedDemoReportInput {
  generatedAt: string;
  bridgeHealth: BridgeHealthState;
  bridgeRecoveryReason: BridgeRecoveryReason | null;
  bridgeLastCheckedAt: string | null;
  storageSchemaVersion: number | null;
  storageSchemaEvent: string;
  persistenceFailure: string;
  demoFlow: FriendzoneDemoFlowStep;
  rsvpEvent: FriendzoneEventTitle | null;
  wins: number;
  totalPulls: number;
}

export function normalizeSanitizedDemoReportInput(
  input: Partial<SanitizedDemoReportInput> | null | undefined,
): SanitizedDemoReportInput {
  const bridgeHealth = input?.bridgeHealth === "checking" || input?.bridgeHealth === "fallback" ? input.bridgeHealth : "ready";
  const demoFlow = input?.demoFlow === "rsvp-saved" || input?.demoFlow === "reconnecting" || input?.demoFlow === "diagnostics" ? input.demoFlow : "idle";
  const rsvpEvent = input?.rsvpEvent === "Plaza Sprint" || input?.rsvpEvent === "Wearable Rush" ? input.rsvpEvent : null;
  const storageSchemaVersion = typeof input?.storageSchemaVersion === "number" && Number.isFinite(input.storageSchemaVersion) ? input.storageSchemaVersion : null;
  const wins = typeof input?.wins === "number" && Number.isFinite(input.wins) ? Math.max(0, Math.floor(input.wins)) : 0;
  const totalPulls = typeof input?.totalPulls === "number" && Number.isFinite(input.totalPulls) ? Math.max(0, Math.floor(input.totalPulls)) : 0;
  return {
    generatedAt: typeof input?.generatedAt === "string" ? input.generatedAt : "",
    bridgeHealth,
    bridgeRecoveryReason: input?.bridgeRecoveryReason === "offline-mirror" ? input.bridgeRecoveryReason : null,
    bridgeLastCheckedAt: typeof input?.bridgeLastCheckedAt === "string" ? input.bridgeLastCheckedAt : null,
    storageSchemaVersion,
    storageSchemaEvent: normalizeReportText(input?.storageSchemaEvent, "unknown"),
    persistenceFailure: normalizeReportText(input?.persistenceFailure, "none"),
    demoFlow,
    rsvpEvent,
    wins,
    totalPulls,
  };
}

export function formatSanitizedDemoReport(input: Partial<SanitizedDemoReportInput> | null | undefined): string {
  const normalized = normalizeSanitizedDemoReportInput(input);
  return [
    "Tug of War Arena · Friendzone demo report",
    `Generated: ${formatReportGeneratedAt(normalized.generatedAt)}`,
    "Decentraland Friendzone / Season 01",
    `Bridge: ${bridgeStatusMessage(normalized.bridgeHealth)}`,
    `Recovery: ${formatBridgeRecoveryReason(normalized.bridgeRecoveryReason, normalized.bridgeHealth)}`,
    `Last bridge check: ${formatBridgeTimestamp(normalized.bridgeLastCheckedAt)}`,
    `Storage schema: ${normalized.storageSchemaVersion ?? "not initialized"} · ${normalized.storageSchemaEvent}`,
    `Persistence failure: ${normalized.persistenceFailure}`,
    `Demo flow: ${formatFriendzoneDemoFlowStep(normalized.demoFlow)}`,
    `RSVP: ${normalized.rsvpEvent ?? "none"}`,
    `Local score: ${normalized.wins} wins · ${normalized.totalPulls} pulls`,
    "Wallet and account identifiers omitted from this report.",
  ].join("\\n");
}

export function formatBridgeRecoverySummary(health: BridgeHealthState, timestamp: string | null, now = Date.now()): string {
  if (health === "checking") return "Checking live presence; offline gameplay remains available.";
  if (health === "fallback") return `Offline mirror active; gameplay remains available. ${formatBridgeAge(timestamp, now)}.`;
  return "Live bridge has not been checked; offline gameplay remains available.";
}

export function formatBridgeAge(timestamp: string | null, now = Date.now()): string {
  if (!timestamp) return "No check recorded";
  const checkedAt = Date.parse(timestamp);
  if (!Number.isFinite(checkedAt)) return "Age unavailable";
  const ageMs = Math.max(0, now - checkedAt);
  if (ageMs < 60_000) return "Checked just now";
  const ageMinutes = Math.floor(ageMs / 60_000);
  if (ageMinutes < 60) return `Checked ${ageMinutes}m ago`;
  const ageHours = Math.floor(ageMinutes / 60);
  return `Checked ${ageHours}h ago`;
}
