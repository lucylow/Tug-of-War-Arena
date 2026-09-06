import { describe, expect, it } from "vitest";

import {
  advanceFriendzoneDemoFlow,
  beginBridgeReconnect,
  bridgeStatusMessage,
  parseBridgeRecoveryReason,
  completeBridgeReconnect,
  deriveJudgeWalkthroughStep,
  formatBridgeHealthFreshness,
  formatBridgeHealthFreshnessPresentation,
  formatBridgeHealthDiagnosticsSummary,
  formatMatchHistoryRecapPresentation,
  formatPowerTrackAccessibilityPresentation,
  formatArenaScoreAccessibilityPresentation,
  formatArenaTimerAccessibilityPresentation,
  formatMatchResultAccessibilityPresentation,
  formatMatchmakingReadinessPresentation,
  formatFirstMatchProgressPresentation,
  formatFirstPullCoachingPresentation,
  formatWalletReadyRewardPresentation,
  formatWalletReadyRewardActionPresentation,
  formatReceiptDetailsDisclosurePresentation,
  formatBridgeRecoveryReason,
  formatJudgeFullWalkthroughCancelStatus,
  formatJudgeFullWalkthroughPauseStatus,
  formatJudgeWalkthroughDemoSummary,
  formatJudgeWalkthroughProofFreshness,
  formatJudgeWalkthroughProofLiveRegion,
  formatJudgeWalkthroughProofPresentation,
  formatJudgeWalkthroughProofSummary,
  formatJudgeWalkthroughPanelAccessibility,
  formatJudgeWalkthroughPanelLiveRegion,
  formatJudgeWalkthroughResetControlPresentation,
  formatJudgeWalkthroughResetFeedbackLiveRegion,
  formatJudgeWalkthroughStatusAnnouncement,
  formatJudgeWalkthroughLifecycleLiveRegion,
  formatJudgeWalkthroughPrimaryControlFeedback,
  formatJudgeWalkthroughPrimaryControlIcon,
  formatJudgeWalkthroughPrimaryControlPresentation,
  formatJudgeWalkthroughLifecycleBadge,
  formatJudgeWalkthroughLifecyclePresentation,
  formatJudgeWalkthroughLifecycleAccessibilityState,
  canResumeJudgeFullWalkthrough,
  formatJudgeFullWalkthroughRestartStatus,
  formatJudgeFullWalkthroughCompleteStatus,
  formatJudgeWalkthroughRewardHandoffAnnouncement,
  resolveJudgeRewardHandoffRecovery,
  formatJudgeFullWalkthroughStatus,
  formatJudgeWalkthroughTransitionSummary,
  formatJudgeWalkthroughCallbackIgnoredFeedback,
  resolveJudgeFullWalkthroughLifecycle,
  resolveJudgeWalkthroughResetIntent,
  shouldInvalidateJudgeWalkthroughCallbacks,
  getJudgeFullWalkthroughActiveStep,
  formatJudgeAutoAdvanceStatus,
  formatJudgePacingPreset,
  formatJudgeSettingsDeliveryFeedback,
  formatJudgeSettingsDeliveryStatus,
  formatJudgeSettingsStatus,
  formatJudgeSettingsSummary,
  formatNativeHandoffFailure,
  formatPlazaHandoffAccessibility,
  canStartPlazaHandoff,
  formatJudgeBlockedActionFeedback,
  canCommitJudgeWalkthroughCallback,
  resolveJudgeWalkthroughCallbackOutcome,
  getJudgePacingDelay,
  getJudgeFullWalkthroughPlan,
  getJudgeFullWalkthroughSequence,
  getJudgeManualModeSettings,
  getJudgePresenterModeSettings,
  isJudgeWalkthroughStepComplete,
  isJudgeFullWalkthroughTerminal,
  resolveJudgeWalkthroughManualStepAction,
  canRunJudgeWalkthroughManualStep,
  resolveJudgeCurrentStepNavigation,
  formatJudgeCurrentStepNavigationFeedback,
  resolveJudgeSettingsDeliveryOutcome,
  formatJudgeWalkthroughActionFeedback,
  formatJudgeTimingStatus,
  formatJudgeWalkthroughCompletion,
  formatJudgeWalkthroughProgressLabel,
  formatJudgeWalkthroughResetStatus,
  formatBridgeTimestamp,
  resolveBridgeTimestampRecovery,
  resolveBridgeRecoveryReasonRecovery,
  formatFriendzoneDemoFlowStep,
  formatJudgeWalkthroughStep,
  formatReportCopyStatus,
  formatResetStatusMessage,
  getDemoResetBaseline,
  getDemoResetAccessibilityState,
  formatSanitizedDemoReport,
  normalizeSanitizedDemoReportInput,
  initialBridgeFlowState,
  openBridgeDiagnostics,
  type SanitizedDemoReportInput,
} from "../lib/bridge-flow";

describe("Decentraland bridge recovery flow", () => {
  it("keeps sanitized report RSVP input within the supported event union", () => {
    const validInput: Pick<SanitizedDemoReportInput, "rsvpEvent"> = { rsvpEvent: "Plaza Sprint" };
    expect(validInput.rsvpEvent).toBe("Plaza Sprint");

    const compileTimeOnly = () => {
      // @ts-expect-error Unsupported event identifiers must not enter diagnostics reports.
      const invalidInput: Pick<SanitizedDemoReportInput, "rsvpEvent"> = { rsvpEvent: "Unknown Event" };
      void invalidInput;
    };
    void compileTimeOnly;
  });
  it("normalizes malformed Diagnostics report input safely", () => {
    const normalized = normalizeSanitizedDemoReportInput({
      bridgeHealth: "invalid" as "ready",
      bridgeRecoveryReason: "unexpected" as "offline-mirror",
      storageSchemaEvent: ["  schema-ok\\nnext", String.fromCharCode(9, 7), "  "].join(""),
      persistenceFailure: "  ",
      demoFlow: "invalid" as "idle",
      rsvpEvent: "Unknown Event" as "Plaza Sprint",
      wins: 2.8,
      totalPulls: -4,
    });
    expect(normalized.bridgeHealth).toBe("ready");
    expect(normalized.bridgeRecoveryReason).toBeNull();
    expect(normalized.storageSchemaEvent).toBe("schema-ok next");
    expect(normalized.persistenceFailure).toBe("none");
    expect(normalized.demoFlow).toBe("idle");
    expect(normalized.rsvpEvent).toBeNull();
    expect(normalized.wins).toBe(2);
    expect(normalized.totalPulls).toBe(0);
    expect(formatSanitizedDemoReport({})).toContain("RSVP: none");
    expect(formatSanitizedDemoReport(null)).toContain("Local score: 0 wins · 0 pulls");
  });

  it("moves from reconnect to fallback and opens Diagnostics", () => {
    const reconnecting = beginBridgeReconnect(initialBridgeFlowState);
    expect(reconnecting.health).toBe("checking");
    expect(bridgeStatusMessage(reconnecting.health)).toBe("Checking live presence");

    const fallback = completeBridgeReconnect(reconnecting, "2026-08-21T21:00:00.000Z", true);
    expect(fallback.health).toBe("fallback");
    expect(fallback.lastCheckedAt).toBe("2026-08-21T21:00:00.000Z");
    expect(bridgeStatusMessage(fallback.health)).toBe("Live presence unavailable · offline mirror active");

    const diagnostics = openBridgeDiagnostics(fallback);
    expect(diagnostics.diagnosticsOpen).toBe(true);
    expect(formatBridgeTimestamp(diagnostics.lastCheckedAt)).toMatch(/09:00:00/);
  });

  it("parses valid, malformed, and missing recovery reasons safely", () => {
    expect(parseBridgeRecoveryReason("offline-mirror")).toBe("offline-mirror");
    expect(parseBridgeRecoveryReason("connected")).toBeNull();
    expect(formatBridgeRecoveryReason(null)).toBe("No recovery recorded.");
    expect(formatBridgeRecoveryReason(null, "fallback")).toBe("Recovery recorded; reason unavailable.");
    expect(formatBridgeRecoveryReason("offline-mirror", "fallback")).toBe("Live presence unavailable; offline mirror active.");
  });

  it("formats every Friendzone handoff step for accessible presentation", () => {
    expect(formatFriendzoneDemoFlowStep("idle")).toBe("READY TO RSVP");
    expect(formatFriendzoneDemoFlowStep("rsvp-saved")).toBe("RSVP SAVED");
    expect(formatFriendzoneDemoFlowStep("reconnecting")).toBe("RECONNECTING");
    expect(formatFriendzoneDemoFlowStep("diagnostics")).toBe("DIAGNOSTICS OPEN");
  });

  it("covers the RSVP to reconnect to Diagnostics demo path", () => {
    let step = advanceFriendzoneDemoFlow("idle", "rsvp");
    expect(step).toBe("rsvp-saved");
    step = advanceFriendzoneDemoFlow(step, "reconnect");
    expect(step).toBe("reconnecting");
    step = advanceFriendzoneDemoFlow(step, "reconnect-complete");
    expect(step).toBe("rsvp-saved");
    expect(advanceFriendzoneDemoFlow(step, "open-diagnostics")).toBe("diagnostics");
  });

  it("formats judge pacing presets and delays", () => {
    expect(getJudgePacingDelay("quick")).toBe(350);
    expect(getJudgePacingDelay("standard")).toBe(700);
    expect(getJudgePacingDelay("presenter")).toBe(1400);
    expect(formatJudgePacingPreset("quick")).toBe("Quick · 0.35s handoff");
    expect(formatJudgePacingPreset("standard")).toBe("Standard · 0.7s handoff");
    expect(formatJudgePacingPreset("presenter")).toBe("Presenter · 1.4s handoff");
  });

  it("formats auto-advance status", () => {
    expect(formatJudgeAutoAdvanceStatus(true)).toBe("Auto-advance on · handoff steps continue automatically");
    expect(formatJudgeAutoAdvanceStatus(false)).toBe("Auto-advance off · manual controls active");
  });

  it("returns deterministic Presenter and manual judge settings", () => {
    expect(getJudgePresenterModeSettings()).toEqual({ autoAdvance: true, pacingPreset: "presenter" });
    expect(getJudgeManualModeSettings()).toEqual({ autoAdvance: false, pacingPreset: "standard" });
  });

  it("formats Presenter settings status for Diagnostics", () => {
    expect(formatJudgeSettingsStatus(true, "presenter", "persisted")).toBe("Presenter Mode · Presenter pacing · persisted locally");
    expect(formatJudgeSettingsStatus(false, "standard", "defaults")).toBe("Manual demo controls · Standard pacing · local defaults");
    expect(formatJudgeSettingsStatus(false, "standard", "pending")).toBe("Manual demo controls · Standard pacing · restoring");
    expect(formatJudgeSettingsStatus(true, "presenter", "unavailable")).toBe("Presenter Mode · Presenter pacing · storage unavailable");
  });

  it("keeps judge-settings delivery status and announcement copy aligned", () => {
    expect(formatJudgeSettingsDeliveryFeedback("copied")).toEqual({ status: "Settings summary copied", announcement: "Judge settings summary copied to the clipboard." });
    expect(formatJudgeSettingsDeliveryFeedback("shared")).toEqual({ status: "Settings summary shared", announcement: "Judge settings summary is ready in the native share sheet." });
    expect(formatJudgeSettingsDeliveryFeedback("fallback")).toEqual({ status: "Copy unavailable — use Share", announcement: "Copy is unavailable. Use Share to send the judge settings summary." });
    expect(formatJudgeSettingsDeliveryFeedback("ignored")).toEqual({ status: "Settings action ignored", announcement: "The settings action is already in progress or the screen is no longer active." });
    expect(formatJudgeSettingsDeliveryStatus("copied")).toBe(formatJudgeSettingsDeliveryFeedback("copied").status);
    expect(formatJudgeSettingsDeliveryStatus("ignored")).toBe(formatJudgeSettingsDeliveryFeedback("ignored").status);
  });

  it("returns the repeatable four-step full walkthrough sequence", () => {
    expect(getJudgeFullWalkthroughSequence()).toEqual([1, 2, 3, 4]);
  });

  it("formats full walkthrough stage feedback", () => {
    expect(formatJudgeFullWalkthroughStatus("idle")).toBe("Full walkthrough ready");
    expect(formatJudgeFullWalkthroughStatus("rsvp")).toBe("Full walkthrough · RSVP in Friendzone");
    expect(formatJudgeFullWalkthroughStatus("reconnect")).toBe("Full walkthrough · checking bridge");
    expect(formatJudgeFullWalkthroughStatus("play")).toBe("Full walkthrough · opening gameplay");
    expect(formatJudgeFullWalkthroughStatus("reward")).toBe("Full walkthrough · reward receipt ready");
  });

  it("formats deterministic walkthrough transition summaries", () => {
    expect(formatJudgeWalkthroughTransitionSummary({ stage: "idle", feedback: "", nextAction: "" })).toEqual({
      label: "READY · Full walkthrough ready",
      accessibilityLabel: "Judge walkthrough transition. READY. Full walkthrough ready. Next action: No pending action.",
    });
    expect(formatJudgeWalkthroughTransitionSummary({ stage: "reconnect", feedback: "Walkthrough callback ignored · stale run", nextAction: "Reconnect checked" })).toEqual({
      label: "RECONNECT · Walkthrough callback ignored · stale run",
      accessibilityLabel: "Judge walkthrough transition. RECONNECT. Walkthrough callback ignored · stale run. Next action: Reconnect checked.",
    });
    expect(formatJudgeWalkthroughTransitionSummary({ stage: "idle", feedback: "Walkthrough reset to RSVP", nextAction: "RSVP saved" })).toEqual({
      label: "READY · Walkthrough reset to RSVP",
      accessibilityLabel: "Judge walkthrough transition. READY. Walkthrough reset to RSVP. Next action: RSVP saved.",
    });
    expect(formatJudgeWalkthroughTransitionSummary({ stage: "rsvp", feedback: "Full walkthrough restarting · RSVP step next", nextAction: "RSVP saved" })).toEqual({
      label: "RSVP · Full walkthrough restarting · RSVP step next",
      accessibilityLabel: "Judge walkthrough transition. RSVP. Full walkthrough restarting · RSVP step next. Next action: RSVP saved.",
    });
    expect(formatJudgeWalkthroughTransitionSummary({ stage: "reward", feedback: "Walkthrough complete · reward receipt ready", nextAction: "Demo complete" })).toEqual({
      label: "REWARD · Walkthrough complete · reward receipt ready",
      accessibilityLabel: "Judge walkthrough transition. REWARD. Walkthrough complete · reward receipt ready. Next action: Demo complete.",
    });
    expect(formatJudgeWalkthroughTransitionSummary({ stage: "reward", feedback: "Walkthrough complete · reward receipt saved", nextAction: "Minting awaits approved live services" })).toEqual({
      label: "REWARD · Walkthrough complete · reward receipt saved",
      accessibilityLabel: "Judge walkthrough transition. REWARD. Walkthrough complete · reward receipt saved. Next action: Minting awaits approved live services.",
    });
  });

  it("formats diagnostics freshness presentation for pending, checked, and unknown states", () => {
    expect(formatBridgeHealthFreshnessPresentation(null, true)).toEqual({ tone: "accent", icon: "sync", label: "Bridge check in progress" });
    expect(formatBridgeHealthFreshnessPresentation("2026-08-24T22:03:00.000Z", false)).toEqual({ tone: "success", icon: "check-circle", label: "Bridge check recorded" });
    expect(formatBridgeHealthFreshnessPresentation(null, false)).toEqual({ tone: "warning", icon: "help-outline", label: "Bridge check not yet recorded" });
  });
  it("formats a concise diagnostics summary and normalizes empty copy", () => {
    expect(formatBridgeHealthDiagnosticsSummary({ statusLabel: "Healthy", freshnessLabel: "Last checked · 10:03 PM", recoverySummary: "Live bridge available." })).toBe("Live presence: Healthy. Last checked · 10:03 PM. Live bridge available.");
    expect(formatBridgeHealthDiagnosticsSummary({ statusLabel: " ", freshnessLabel: "", recoverySummary: "  " })).toBe("Live presence: unknown. Bridge check not yet recorded. Recovery status unavailable");
  });

  it("formats arena timer accessibility with safe remaining seconds and urgency", () => {
    expect(formatArenaTimerAccessibilityPresentation(42.6)).toEqual({ label: "Match timer", hint: "Time remaining in the match", valueText: "43 seconds remaining", tone: "neutral", now: 43 });
    expect(formatArenaTimerAccessibilityPresentation(10)).toEqual({ label: "Match timer", hint: "Final countdown", valueText: "10 seconds remaining", tone: "warning", now: 10 });
    expect(formatArenaTimerAccessibilityPresentation(-4)).toEqual({ label: "Match timer", hint: "Time is up", valueText: "0 seconds remaining", tone: "warning", now: 0 });
    expect(formatArenaTimerAccessibilityPresentation(Number.NaN)).toEqual({ label: "Match timer", hint: "Time is up", valueText: "0 seconds remaining", tone: "warning", now: 0 });
  });

  it("formats match-result accessibility for victory and defeat states", () => {
    expect(formatMatchResultAccessibilityPresentation(true)).toEqual({ label: "Victory result", hint: "Your crew won the match. Review the reward receipt or run it back.", announcement: "Victory. Your crew pulled the rope across the line." });
    expect(formatMatchResultAccessibilityPresentation(false)).toEqual({ label: "Defeat result", hint: "Your crew lost the match. Review the recap or run it back.", announcement: "Defeat. Your crew can run the match again." });
  });

  it("formats arena score accessibility for both crews", () => {
    expect(formatArenaScoreAccessibilityPresentation({ team: "sun", powerLeft: 72.4 })).toEqual({ crew: { label: "Sun Crew", valueText: "Sun Crew score", now: 72 }, opponent: { label: "Moon Crew", valueText: "Moon Crew score", now: 28 } });
    expect(formatArenaScoreAccessibilityPresentation({ team: "moon", powerLeft: -20 })).toEqual({ crew: { label: "Moon Crew", valueText: "Moon Crew score", now: 0 }, opponent: { label: "Sun Crew", valueText: "Sun Crew score", now: 100 } });
  });

  it("formats power-track accessibility with bounded crew balance values", () => {
    expect(formatPowerTrackAccessibilityPresentation({ team: "sun", powerLeft: 72.4 })).toEqual({ label: "Sun Crew rope power", hint: "Shows the current balance between your crew and the opposing crew", valueText: "72 percent for your crew and 28 percent for the opposing crew", now: 72 });
    expect(formatPowerTrackAccessibilityPresentation({ team: "moon", powerLeft: 140 })).toEqual({ label: "Moon Crew rope power", hint: "Shows the current balance between your crew and the opposing crew", valueText: "100 percent for your crew and 0 percent for the opposing crew", now: 100 });
    expect(formatPowerTrackAccessibilityPresentation({ team: "sun", powerLeft: Number.NaN }).now).toBe(0);
  });

  it("formats match-history recap presentation for idle, selected, and in-flight rows", () => {
    expect(formatMatchHistoryRecapPresentation({ result: "Victory", selected: false, shareInFlight: true })).toEqual({ label: "Victory match", hint: "Selects this match and prepares its recap for sharing.", icon: "arrow-upward", accessibilityState: { selected: false, busy: false } });
    expect(formatMatchHistoryRecapPresentation({ result: "Defeat", selected: true, shareInFlight: false })).toEqual({ label: "Defeat recap selected", hint: "Recap selected. Use the share action in the match recap above.", icon: "ios-share", accessibilityState: { selected: true, busy: false } });
    expect(formatMatchHistoryRecapPresentation({ result: "Victory", selected: true, shareInFlight: true })).toEqual({ label: "Victory recap selected", hint: "Recap sharing is in progress.", icon: "ios-share", accessibilityState: { selected: true, busy: true } });
    expect(formatMatchHistoryRecapPresentation({ result: "Other" as "Victory", selected: false, shareInFlight: false }).label).toBe("Defeat match");
  });
  it("formats matchmaking readiness presentation for locked-in and not-ready states", () => {
    expect(formatMatchmakingReadinessPresentation(false)).toEqual({ statusTitle: "Not ready yet", statusHint: "Tap ready when your team is chosen.", readyLabel: "READY UP", readyHint: "Confirms your team and unlocks the arena entry action", readyAccessibilityLabel: "Ready up for the arena", entryAccessibilityLabel: "Enter the arena, unavailable until ready", entryHint: "Tap READY UP first to unlock the arena", entryDisabled: true });
    expect(formatMatchmakingReadinessPresentation(true)).toEqual({ statusTitle: "You are locked in", statusHint: "The arena is waiting for you.", readyLabel: "READY", readyHint: "Toggles readiness off", readyAccessibilityLabel: "Ready for the arena", entryAccessibilityLabel: "Enter the arena", entryHint: "Starts the tug-of-war match", entryDisabled: false });
  });

  it("formats first-pull coaching before and after the first tap", () => {
    expect(formatFirstPullCoachingPresentation(0)).toEqual({ label: "FIRST PULL · TAP TO MOVE THE ROPE", accessibilityLabel: "First pull ready. Tap PULL to move the rope toward your crew." });
    expect(formatFirstPullCoachingPresentation(1)).toEqual({ label: "KEEP PULLING · BUILD YOUR STREAK", accessibilityLabel: "First pull complete. 1 pulls recorded. Keep pulling to build your streak." });
  });

  it("formats first-match progress for ready and not-ready lobby states", () => {
    expect(formatFirstMatchProgressPresentation(false)).toEqual({ label: "01 SIDE CHOSEN · 02 READY UP · 03 PULL FOR PLAZA BAND", accessibilityLabel: "First-match progress: side chosen; next, ready up, then enter the arena" });
    expect(formatFirstMatchProgressPresentation(true)).toEqual({ label: "01 SIDE CHOSEN · 02 READY · 03 PULL FOR PLAZA BAND", accessibilityLabel: "First-match progress: side chosen and ready; next, enter the arena" });
  });

  it("formats receipt-details disclosure presentation for expanded and collapsed states", () => {
    expect(formatReceiptDetailsDisclosurePresentation(false)).toEqual({ label: "View local receipt details", hint: "Shows local wearable traits and the future minting boundary", accessibilityState: { expanded: false } });
    expect(formatReceiptDetailsDisclosurePresentation(true)).toEqual({ label: "Hide local receipt details", hint: "Hides local wearable traits and the future minting boundary", accessibilityState: { expanded: true } });
  });

  it("formats wallet-ready reward presentation without overstating on-chain status", () => {
    expect(formatWalletReadyRewardPresentation({ playerWon: false, walletConnected: false, rewardClaimed: false })).toEqual({ title: "Keep pulling for Wearables", metadata: "Connect a wallet to prepare a future claim", icon: "card-giftcard", tone: "warning", accessibilityLabel: "No reward receipt yet. Keep pulling for a wallet-ready wearable preview." });
    expect(formatWalletReadyRewardPresentation({ playerWon: true, walletConnected: true, rewardClaimed: false })).toEqual({ title: "Wearable Airdrop · Ready", metadata: "Wallet connected · save a local receipt to prepare a future claim", icon: "card-giftcard", tone: "warning", accessibilityLabel: "Winning wearable preview is ready locally. No on-chain mint has occurred." });
    expect(formatWalletReadyRewardPresentation({ playerWon: true, walletConnected: false, rewardClaimed: true })).toEqual({ title: "Wearable Airdrop · Receipt Saved", metadata: "Local receipt saved · wallet connect remains optional", icon: "check-circle", tone: "success", accessibilityLabel: "Winning wearable preview with a local receipt saved. Minting awaits approved live services." });
  });

  it("formats bridge-health freshness with a safe not-yet-checked fallback", () => {
    expect(formatBridgeHealthFreshness(null)).toBe("Last checked · not yet checked");
    expect(formatBridgeHealthFreshness("9:57 PM")).toBe("Last checked · 9:57 PM");
  });

  it("formats proof snapshot freshness from the current bridge status", () => {
    expect(formatJudgeWalkthroughProofFreshness("Healthy")).toBe("Proof snapshot · Healthy");
    expect(formatJudgeWalkthroughProofFreshness("Reconnecting")).toBe("Proof snapshot · Reconnecting");
  });

  it("formats proof-summary readiness changes as a polite live region", () => {
    expect(formatJudgeWalkthroughProofLiveRegion("Bridge healthy. Wallet ready to connect. Receipt local preview ready.")).toEqual({ accessibilityLiveRegion: "polite", accessibilityLabel: "Proof readiness updated. Bridge healthy. Wallet ready to connect. Receipt local preview ready." });
  });

  it("formats proof-summary presentation with honest state-aware tone and icon", () => {
    expect(formatJudgeWalkthroughProofPresentation({ bridgeLabel: "Healthy", walletConnected: false, rewardClaimed: false })).toEqual({ tone: "warning", icon: "account-balance-wallet" });
    expect(formatJudgeWalkthroughProofPresentation({ bridgeLabel: "Reconnecting", walletConnected: true, rewardClaimed: false })).toEqual({ tone: "accent", icon: "sync" });
    expect(formatJudgeWalkthroughProofPresentation({ bridgeLabel: "Healthy", walletConnected: true, rewardClaimed: true })).toEqual({ tone: "success", icon: "verified" });
  });

  it("formats judge walkthrough proof summary across offline and connected states", () => {
    expect(formatJudgeWalkthroughProofSummary({ bridgeLabel: "Healthy", walletConnected: false, rewardClaimed: false })).toBe("Bridge healthy. Wallet ready to connect. Receipt local preview ready.");
    expect(formatJudgeWalkthroughProofSummary({ bridgeLabel: "Reconnecting", walletConnected: true, rewardClaimed: true })).toBe("Bridge reconnecting. Wallet connected. Receipt saved locally.");
  });

  it("formats judge walkthrough panel live-region transitions without status duplication", () => {
    expect(formatJudgeWalkthroughPanelLiveRegion(true)).toEqual({ accessibilityLiveRegion: "polite", accessibilityLabel: "Judge walkthrough guide expanded." });
    expect(formatJudgeWalkthroughPanelLiveRegion(false)).toEqual({ accessibilityLiveRegion: "polite", accessibilityLabel: "Judge walkthrough guide collapsed." });
  });

  it("formats judge walkthrough panel accessibility for expanded and collapsed states", () => {
    expect(formatJudgeWalkthroughPanelAccessibility(true, "Full walkthrough ready.")).toEqual({ accessibilityLabel: "Judge walkthrough guide expanded. Full walkthrough ready.", accessibilityState: { expanded: true } });
    expect(formatJudgeWalkthroughPanelAccessibility(false, "Full walkthrough ready.")).toEqual({ accessibilityLabel: "Judge walkthrough guide collapsed. Full walkthrough ready.", accessibilityState: { expanded: false } });
  });

  it("formats a polite lifecycle live region without changing announcement copy", () => {
    const summary = { status: "Full walkthrough ready", progress: "0 of 4 complete · current step 1", nextAction: "RSVP saved · next: reconnect bridge" };
    expect(formatJudgeWalkthroughLifecycleLiveRegion(summary)).toEqual({ accessibilityLiveRegion: "polite", accessibilityLabel: "Full walkthrough ready. 0 of 4 complete · current step 1. RSVP saved · next: reconnect bridge." });
  });

  it("formats judge walkthrough status announcements from the shared summary", () => {
    expect(formatJudgeWalkthroughStatusAnnouncement({ status: "Full walkthrough ready", progress: "0 of 4 complete · current step 1", nextAction: "RSVP saved · next: reconnect bridge" })).toBe("Full walkthrough ready. 0 of 4 complete · current step 1. RSVP saved · next: reconnect bridge.");
    expect(formatJudgeWalkthroughStatusAnnouncement({ status: "Full walkthrough · opening gameplay · paused", progress: "2 of 4 complete · current step 3", nextAction: "Arena opened · next: review reward receipt" })).toBe("Full walkthrough · opening gameplay · paused. 2 of 4 complete · current step 3. Arena opened · next: review reward receipt.");
    expect(formatJudgeWalkthroughStatusAnnouncement({ status: "Full walkthrough complete · reward receipt ready", progress: "4 of 4 complete · current step 4", nextAction: "Demo complete · reward receipt ready" })).toBe("Full walkthrough complete · reward receipt ready. 4 of 4 complete · current step 4. Demo complete · reward receipt ready.");
  });

  it("formats judge walkthrough demo summaries for each readiness state", () => {
    expect(formatJudgeWalkthroughDemoSummary({ stage: "idle", isRunning: false, isPaused: false, completedCount: 0, currentStep: 1 })).toEqual({ status: "Full walkthrough ready", progress: "0 of 4 complete · current step 1", nextAction: "RSVP saved · next: reconnect bridge" });
    expect(formatJudgeWalkthroughDemoSummary({ stage: "reconnect", isRunning: true, isPaused: false, completedCount: 1, currentStep: 2 })).toEqual({ status: "Full walkthrough · checking bridge", progress: "1 of 4 complete · current step 2", nextAction: "Reconnect checked · next: play tug of war" });
    expect(formatJudgeWalkthroughDemoSummary({ stage: "play", isRunning: true, isPaused: true, completedCount: 2, currentStep: 3 })).toEqual({ status: "Full walkthrough · opening gameplay · paused", progress: "2 of 4 complete · current step 3", nextAction: "Arena opened · next: review reward receipt" });
    expect(formatJudgeWalkthroughDemoSummary({ stage: "reward", isRunning: false, isPaused: false, completedCount: 4, currentStep: 4 })).toEqual({ status: "Full walkthrough complete · reward receipt ready", progress: "4 of 4 complete · current step 4", nextAction: "Demo complete · reward receipt ready" });
    expect(formatJudgeWalkthroughDemoSummary({ stage: "idle", isRunning: false, isPaused: false, completedCount: -2, currentStep: 1 })).toEqual({ status: "Full walkthrough ready", progress: "0 of 4 complete · current step 1", nextAction: "RSVP saved · next: reconnect bridge" });
  });

  it("formats explicit cancellation feedback", () => {
    expect(formatJudgeFullWalkthroughCancelStatus()).toBe("Full walkthrough cancelled · manual controls active");
  });

  it("formats restart feedback after cancellation", () => {
    expect(formatJudgeFullWalkthroughRestartStatus()).toBe("Full walkthrough restarting · RSVP step next");
  });

  it("resolves interrupted reward handoff recovery deterministically", () => {
    expect(resolveJudgeRewardHandoffRecovery({ stage: "play", isRunning: true, isPaused: false })).toBe("reset");
    expect(resolveJudgeRewardHandoffRecovery({ stage: "play", isRunning: false, isPaused: true })).toBe("resume");
    expect(resolveJudgeRewardHandoffRecovery({ stage: "reward", isRunning: false, isPaused: false })).toBe("ignore-completed");
    expect(resolveJudgeRewardHandoffRecovery({ stage: "rsvp", isRunning: false, isPaused: false })).toBe("reset");
    expect(resolveJudgeRewardHandoffRecovery({ stage: "idle", isRunning: false, isPaused: true })).toBe("reset");
  });

  it("formats reward-handoff announcements for each lifecycle outcome", () => {
    expect(formatJudgeWalkthroughRewardHandoffAnnouncement("completed")).toBe("Full walkthrough complete. Wallet-ready reward receipt is open.");
    expect(formatJudgeWalkthroughRewardHandoffAnnouncement("already-completed")).toBe("Reward receipt is already open. Walkthrough remains complete.");
    expect(formatJudgeWalkthroughRewardHandoffAnnouncement("interrupted")).toBe("Walkthrough interrupted before reward handoff. Reset or resume to continue.");
  });

  it("covers the pause, resume, reset, and restart recovery path", () => {
    expect(formatJudgeFullWalkthroughPauseStatus("play", true)).toBe("Full walkthrough · opening gameplay · paused");
    expect(formatJudgeFullWalkthroughPauseStatus("play", false)).toBe("Full walkthrough · opening gameplay");
    expect(canResumeJudgeFullWalkthrough(true, false)).toBe(true);
    expect(canResumeJudgeFullWalkthrough(true, true)).toBe(false);

    const resetIntent = resolveJudgeWalkthroughResetIntent({ isRunning: false, isPaused: true, isCompleted: false });
    expect(resetIntent).toBe("reset-paused");
    expect(shouldInvalidateJudgeWalkthroughCallbacks(resetIntent)).toBe(true);
    expect(resolveJudgeFullWalkthroughLifecycle("restart")).toEqual({ status: "running", stage: "rsvp", nextAction: 0, feedback: "Full walkthrough restarting · RSVP step next" });
    expect(canCommitJudgeWalkthroughCallback({ isMounted: true, isRunning: true, isPaused: false, actionIndex: 1, nextAction: 1, callbackGeneration: 4, currentGeneration: 5 })).toBe(false);
    expect(canCommitJudgeWalkthroughCallback({ isMounted: true, isRunning: true, isPaused: false, actionIndex: 1, nextAction: 1, callbackGeneration: 5, currentGeneration: 5 })).toBe(true);
  });

  it("formats completion feedback for the reward receipt", () => {
    expect(formatJudgeFullWalkthroughCompleteStatus()).toBe("Full walkthrough complete · reward receipt ready");
  });

  it.each([
    ["cancel", { status: "idle", stage: "idle", nextAction: 0, feedback: "Full walkthrough cancelled · manual controls active" }],
    ["restart", { status: "running", stage: "rsvp", nextAction: 0, feedback: "Full walkthrough restarting · RSVP step next" }],
    ["complete", { status: "completed", stage: "reward", nextAction: 0, feedback: "Full walkthrough complete · reward receipt ready" }],
  ] as const)("resolves the %s lifecycle transition deterministically", (event, expected) => {
    expect(resolveJudgeFullWalkthroughLifecycle(event)).toEqual(expected);
  });

  it("allows manual steps only when timed walkthrough automation is idle", () => {
    expect(resolveJudgeWalkthroughManualStepAction({ isRunning: false, isPaused: false })).toBe("allow");
    expect(resolveJudgeWalkthroughManualStepAction({ isRunning: true, isPaused: false })).toBe("blocked-running");
    expect(resolveJudgeWalkthroughManualStepAction({ isRunning: false, isPaused: true })).toBe("blocked-paused");
    expect(resolveJudgeWalkthroughManualStepAction({ isRunning: true, isPaused: true })).toBe("blocked-running");
    expect(canRunJudgeWalkthroughManualStep({ isRunning: false, isPaused: false })).toBe(true);
    expect(canRunJudgeWalkthroughManualStep({ isRunning: true, isPaused: false })).toBe(false);
    expect(canRunJudgeWalkthroughManualStep({ isRunning: false, isPaused: true })).toBe(false);
  });

  it("guards direct current-step navigation across walkthrough states", () => {
    expect(resolveJudgeCurrentStepNavigation({ stage: "idle", isRunning: false, isPaused: false })).toBe("allow");
    expect(resolveJudgeCurrentStepNavigation({ stage: "reconnect", isRunning: true, isPaused: false })).toBe("blocked-running");
    expect(resolveJudgeCurrentStepNavigation({ stage: "play", isRunning: false, isPaused: true })).toBe("blocked-paused");
    expect(resolveJudgeCurrentStepNavigation({ stage: "reward", isRunning: false, isPaused: false })).toBe("blocked-completed");
    expect(resolveJudgeCurrentStepNavigation({ stage: "reward", isRunning: true, isPaused: false })).toBe("blocked-running");
  });

  it("combines primary walkthrough control semantics without drift", () => {
    expect(formatJudgeWalkthroughPrimaryControlPresentation({ stage: "idle", isRunning: false, isPaused: true, nextAction: "RSVP saved" })).toEqual({ label: "RUN FULL WALKTHROUGH", hint: "Automatically opens the RSVP, bridge, gameplay, and reward moments for a repeatable demo. Next action: RSVP saved.", disabled: false, busy: false, icon: "play-arrow" });
    expect(formatJudgeWalkthroughPrimaryControlPresentation({ stage: "idle", isRunning: false, isPaused: false, nextAction: "RSVP saved" })).toEqual({ label: "RUN FULL WALKTHROUGH", hint: "Automatically opens the RSVP, bridge, gameplay, and reward moments for a repeatable demo. Next action: RSVP saved.", disabled: false, busy: false, icon: "play-arrow" });
    expect(formatJudgeWalkthroughPrimaryControlPresentation({ stage: "reconnect", isRunning: true, isPaused: false, nextAction: "Reconnect checked" })).toEqual({ label: "WALKTHROUGH RUNNING…", hint: "Automatic walkthrough transitions are active. Wait for the current stage to finish. Next action: Reconnect checked.", disabled: true, busy: true, icon: "sync" });
    expect(formatJudgeWalkthroughPrimaryControlPresentation({ stage: "reward", isRunning: false, isPaused: false, nextAction: "Demo complete" })).toEqual({ label: "RUN WALKTHROUGH AGAIN", hint: "Starts a fresh walkthrough from the RSVP step without clearing saved demo data. Next action: Demo complete.", disabled: false, busy: false, icon: "replay" });
  });

  it("formats the primary walkthrough control icon for each state", () => {
    expect(formatJudgeWalkthroughPrimaryControlIcon({ stage: "idle", isRunning: false, isPaused: false })).toBe("play-arrow");
    expect(formatJudgeWalkthroughPrimaryControlIcon({ stage: "reconnect", isRunning: true, isPaused: false })).toBe("sync");
    expect(formatJudgeWalkthroughPrimaryControlIcon({ stage: "play", isRunning: false, isPaused: true })).toBe("play-arrow");
    expect(formatJudgeWalkthroughPrimaryControlIcon({ stage: "reward", isRunning: false, isPaused: false })).toBe("replay");
  });

  it("formats lifecycle badge accessibility state for each state", () => {
    expect(formatJudgeWalkthroughLifecycleAccessibilityState({ stage: "idle", isRunning: false, isPaused: false })).toEqual({ busy: false, selected: false });
    expect(formatJudgeWalkthroughLifecycleAccessibilityState({ stage: "reconnect", isRunning: true, isPaused: false })).toEqual({ busy: true, selected: true });
    expect(formatJudgeWalkthroughLifecycleAccessibilityState({ stage: "play", isRunning: false, isPaused: true })).toEqual({ busy: false, selected: true });
    expect(formatJudgeWalkthroughLifecycleAccessibilityState({ stage: "reward", isRunning: false, isPaused: false })).toEqual({ busy: false, selected: true });
  });

  it("formats lifecycle badge presentation semantics for each state", () => {
    expect(formatJudgeWalkthroughLifecyclePresentation({ stage: "idle", isRunning: false, isPaused: true })).toEqual({ badge: "READY", tone: "neutral", icon: "play-circle-outline" });
    expect(formatJudgeWalkthroughLifecyclePresentation({ stage: "idle", isRunning: false, isPaused: false })).toEqual({ badge: "READY", tone: "neutral", icon: "play-circle-outline" });
    expect(formatJudgeWalkthroughLifecyclePresentation({ stage: "reconnect", isRunning: true, isPaused: false })).toEqual({ badge: "RUNNING", tone: "accent", icon: "sync" });
    expect(formatJudgeWalkthroughLifecyclePresentation({ stage: "play", isRunning: false, isPaused: true })).toEqual({ badge: "PAUSED", tone: "warning", icon: "pause-circle-outline" });
    expect(formatJudgeWalkthroughLifecyclePresentation({ stage: "reward", isRunning: false, isPaused: false })).toEqual({ badge: "COMPLETE", tone: "success", icon: "check-circle" });
  });

  it("formats the walkthrough lifecycle badge for each state", () => {
    expect(formatJudgeWalkthroughLifecycleBadge({ stage: "idle", isRunning: false, isPaused: false })).toBe("READY");
    expect(formatJudgeWalkthroughLifecycleBadge({ stage: "reconnect", isRunning: true, isPaused: false })).toBe("RUNNING");
    expect(formatJudgeWalkthroughLifecycleBadge({ stage: "play", isRunning: false, isPaused: true })).toBe("PAUSED");
    expect(formatJudgeWalkthroughLifecycleBadge({ stage: "reward", isRunning: false, isPaused: false })).toBe("COMPLETE");
    expect(formatJudgeWalkthroughLifecycleBadge({ stage: "reward", isRunning: true, isPaused: false })).toBe("RUNNING");
  });

  it("formats the primary walkthrough control for each lifecycle state", () => {
    expect(formatJudgeWalkthroughPrimaryControlFeedback({ stage: "idle", isRunning: false, isPaused: false })).toEqual({ label: "RUN FULL WALKTHROUGH", hint: "Automatically opens the RSVP, bridge, gameplay, and reward moments for a repeatable demo.", disabled: false, busy: false });
    expect(formatJudgeWalkthroughPrimaryControlFeedback({ stage: "reconnect", isRunning: true, isPaused: false })).toEqual({ label: "WALKTHROUGH RUNNING…", hint: "Automatic walkthrough transitions are active. Wait for the current stage to finish.", disabled: true, busy: true });
    expect(formatJudgeWalkthroughPrimaryControlFeedback({ stage: "play", isRunning: false, isPaused: true })).toEqual({ label: "RESUME WALKTHROUGH", hint: "Continues the walkthrough from its current stage.", disabled: false, busy: false });
    expect(formatJudgeWalkthroughPrimaryControlFeedback({ stage: "reward", isRunning: false, isPaused: false })).toEqual({ label: "RUN WALKTHROUGH AGAIN", hint: "Starts a fresh walkthrough from the RSVP step without clearing saved demo data.", disabled: false, busy: false });
  });

  it("formats explanatory feedback for direct current-step navigation", () => {
    expect(formatJudgeCurrentStepNavigationFeedback("allow", "RSVP saved · next: reconnect bridge")).toEqual({ label: "Open next action", hint: "Opens rsvp saved · next: reconnect bridge." });
    expect(formatJudgeCurrentStepNavigationFeedback("blocked-running", "Reconnect checked · next: play tug of war")).toEqual({ label: "Walkthrough running", hint: "Automatic transitions are active. Wait for the current stage to finish." });
    expect(formatJudgeCurrentStepNavigationFeedback("blocked-paused", "Arena opened · next: review reward receipt")).toEqual({ label: "Walkthrough paused", hint: "Resume the walkthrough before opening the current step." });
    expect(formatJudgeCurrentStepNavigationFeedback("blocked-completed", "Demo complete · reward receipt ready")).toEqual({ label: "Walkthrough complete", hint: "Run the walkthrough again or reset to RSVP to open another step." });
  });

  it("recognizes only an idle reward stage as terminal", () => {
    expect(isJudgeFullWalkthroughTerminal({ stage: "reward", isRunning: false, isPaused: false })).toBe(true);
    expect(isJudgeFullWalkthroughTerminal({ stage: "reward", isRunning: true, isPaused: false })).toBe(false);
    expect(isJudgeFullWalkthroughTerminal({ stage: "reward", isRunning: false, isPaused: true })).toBe(false);
    expect(isJudgeFullWalkthroughTerminal({ stage: "play", isRunning: false, isPaused: false })).toBe(false);
  });

  it("resolves idempotent reset intent across walkthrough lifecycle states", () => {
    expect(resolveJudgeWalkthroughResetIntent({ isRunning: false, isPaused: false, isCompleted: false })).toBe("noop");
    expect(resolveJudgeWalkthroughResetIntent({ isRunning: true, isPaused: false, isCompleted: false })).toBe("reset-active");
    expect(resolveJudgeWalkthroughResetIntent({ isRunning: false, isPaused: true, isCompleted: false })).toBe("reset-paused");
    expect(resolveJudgeWalkthroughResetIntent({ isRunning: false, isPaused: false, isCompleted: true })).toBe("reset-completed");
    expect(shouldInvalidateJudgeWalkthroughCallbacks("reset-active")).toBe(true);
    expect(shouldInvalidateJudgeWalkthroughCallbacks("reset-paused")).toBe(true);
    expect(shouldInvalidateJudgeWalkthroughCallbacks("reset-completed")).toBe(true);
    expect(shouldInvalidateJudgeWalkthroughCallbacks("noop")).toBe(false);
  });

  it("formats paused and resumed full walkthrough feedback", () => {
    expect(formatJudgeFullWalkthroughPauseStatus("play", true)).toBe("Full walkthrough · opening gameplay · paused");
    expect(formatJudgeFullWalkthroughPauseStatus("reconnect", false)).toBe("Full walkthrough · checking bridge");
  });

  it("only resumes a full walkthrough when its paused lifecycle is active", () => {
    expect(canResumeJudgeFullWalkthrough(true)).toBe(true);
    expect(canResumeJudgeFullWalkthrough(false)).toBe(false);
    expect(canResumeJudgeFullWalkthrough(true, true)).toBe(false);
  });

  it("preserves the active stage across a pause-to-resume sequence", () => {
    let paused = false;
    expect(canResumeJudgeFullWalkthrough(paused)).toBe(false);
    paused = true;
    expect(canResumeJudgeFullWalkthrough(paused)).toBe(true);
    expect(getJudgeFullWalkthroughActiveStep("play", 1)).toBe(3);
    paused = false;
    expect(canResumeJudgeFullWalkthrough(paused)).toBe(false);
    expect(getJudgeFullWalkthroughActiveStep("play", 1)).toBe(3);
  });

  it("maps automated walkthrough stages to the correct active step", () => {
    expect(getJudgeFullWalkthroughActiveStep("idle", 3)).toBe(3);
    expect(getJudgeFullWalkthroughActiveStep("rsvp", 4)).toBe(1);
    expect(getJudgeFullWalkthroughActiveStep("reconnect", 1)).toBe(2);
    expect(getJudgeFullWalkthroughActiveStep("play", 1)).toBe(3);
    expect(getJudgeFullWalkthroughActiveStep("reward", 1)).toBe(4);
  });

  it("derives completed judge walkthrough stages", () => {
    expect(isJudgeWalkthroughStepComplete(1, 3, false)).toBe(true);
    expect(isJudgeWalkthroughStepComplete(2, 3, false)).toBe(true);
    expect(isJudgeWalkthroughStepComplete(3, 3, false)).toBe(false);
    expect(isJudgeWalkthroughStepComplete(4, 4, false)).toBe(false);
    expect(isJudgeWalkthroughStepComplete(4, 4, true)).toBe(true);
  });

  it("formats judge walkthrough completion states", () => {
    expect(formatJudgeWalkthroughCompletion(false)).toBe("Walkthrough complete · reward receipt ready");
    expect(formatJudgeWalkthroughCompletion(true)).toBe("Walkthrough complete · reward receipt saved");
  });

  it("formats judge walkthrough progress with the active step", () => {
    expect(formatJudgeWalkthroughProgressLabel(0, 1)).toBe("0 of 4 complete · current step 1");
    expect(formatJudgeWalkthroughProgressLabel(2, 3)).toBe("2 of 4 complete · current step 3");
    expect(formatJudgeWalkthroughProgressLabel(4, 4)).toBe("4 of 4 complete · current step 4");
  });

  it("formats presenter timing status for manual and auto-advance modes", () => {
    expect(formatJudgeTimingStatus(false, "standard")).toBe("Manual controls · Standard · 0.7s handoff");
    expect(formatJudgeTimingStatus(true, "presenter")).toBe("Auto-advance · Presenter · 1.4s handoff");
  });

  it("formats the judge walkthrough reset confirmation", () => {
    expect(formatJudgeWalkthroughResetStatus()).toBe("Walkthrough reset to RSVP");
  });

  it("derives the current judge walkthrough step from flow and screen", () => {
    expect(deriveJudgeWalkthroughStep("idle", "social")).toBe(1);
    expect(deriveJudgeWalkthroughStep("rsvp-saved", "social")).toBe(2);
    expect(deriveJudgeWalkthroughStep("reconnecting", "settings")).toBe(2);
    expect(deriveJudgeWalkthroughStep("rsvp-saved", "arena")).toBe(3);
    expect(deriveJudgeWalkthroughStep("diagnostics", "results")).toBe(4);
  });

  it("formats each judge walkthrough moment", () => {
    expect(formatJudgeWalkthroughStep(1)).toBe("RSVP IN FRIENDZONE");
    expect(formatJudgeWalkthroughStep(2)).toBe("RECONNECT BRIDGE");
    expect(formatJudgeWalkthroughStep(3)).toBe("PLAY TUG OF WAR");
    expect(formatJudgeWalkthroughStep(4)).toBe("SHOW REWARD RECEIPT");
  });

  it("asserts the complete automated RSVP-to-reward path in order", () => {
    expect(getJudgeFullWalkthroughPlan()).toEqual([
      { actionIndex: 0, step: 1, stage: "rsvp" },
      { actionIndex: 1, step: 2, stage: "reconnect" },
      { actionIndex: 2, step: 3, stage: "play" },
      { actionIndex: 3, step: 4, stage: "reward" },
    ]);
    expect(getJudgeFullWalkthroughPlan().map(({ actionIndex }) => actionIndex)).toEqual([0, 1, 2, 3]);
    expect(getJudgeFullWalkthroughPlan().map(({ step }) => step)).toEqual([...getJudgeFullWalkthroughSequence()]);
  });

  it("formats clipboard outcomes with a share fallback", () => {
    expect(formatReportCopyStatus(true)).toBe("Report copied");
    expect(formatReportCopyStatus(false)).toBe("Copy unavailable — use Share");
  });

  it("resolves delayed walkthrough callback outcomes explicitly", () => {
    const base = { isMounted: true, isRunning: true, isPaused: false, actionIndex: 1, nextAction: 1, callbackGeneration: 2, currentGeneration: 2 };
    expect(resolveJudgeWalkthroughCallbackOutcome(base)).toBe("commit");
    expect(resolveJudgeWalkthroughCallbackOutcome({ ...base, isMounted: false })).toBe("ignore-unmounted");
    expect(resolveJudgeWalkthroughCallbackOutcome({ ...base, isRunning: false })).toBe("ignore-not-running");
    expect(resolveJudgeWalkthroughCallbackOutcome({ ...base, isPaused: true })).toBe("ignore-paused");
    expect(resolveJudgeWalkthroughCallbackOutcome({ ...base, callbackGeneration: 1 })).toBe("ignore-stale-generation");
    expect(resolveJudgeWalkthroughCallbackOutcome({ ...base, actionIndex: 0 })).toBe("ignore-out-of-order");
  });

  it("formats distinct actionable feedback for every ignored callback outcome", () => {
    expect(formatJudgeWalkthroughCallbackIgnoredFeedback("ignore-stale-generation")).toEqual({ status: "Walkthrough callback ignored · stale run", announcement: "A delayed walkthrough callback was ignored because the walkthrough was reset or restarted." });
    expect(formatJudgeWalkthroughCallbackIgnoredFeedback("ignore-out-of-order")).toEqual({ status: "Walkthrough callback ignored · out of order", announcement: "A delayed walkthrough callback was ignored because the walkthrough is waiting for an earlier step." });
    expect(formatJudgeWalkthroughCallbackIgnoredFeedback("ignore-paused")).toEqual({ status: "Walkthrough callback held · paused", announcement: "The walkthrough callback is waiting until the paused walkthrough resumes." });
    expect(formatJudgeWalkthroughCallbackIgnoredFeedback("ignore-not-running")).toEqual({ status: "Walkthrough callback ignored · not running", announcement: "A delayed walkthrough callback was ignored because the walkthrough is no longer running." });
    expect(formatJudgeWalkthroughCallbackIgnoredFeedback("ignore-unmounted")).toEqual({ status: "Walkthrough callback ignored · screen closed", announcement: "A delayed walkthrough callback was ignored because the walkthrough screen is no longer active." });
  });

  it("guards delayed judge walkthrough callbacks against stale lifecycle state", () => {
    expect(canCommitJudgeWalkthroughCallback({ isMounted: true, isRunning: true, isPaused: false, actionIndex: 1, nextAction: 1 })).toBe(true);
    expect(canCommitJudgeWalkthroughCallback({ isMounted: true, isRunning: true, isPaused: false, actionIndex: 0, nextAction: 1 })).toBe(false);
    expect(canCommitJudgeWalkthroughCallback({ isMounted: true, isRunning: false, isPaused: false, actionIndex: 1, nextAction: 1 })).toBe(false);
    expect(canCommitJudgeWalkthroughCallback({ isMounted: true, isRunning: true, isPaused: true, actionIndex: 1, nextAction: 1 })).toBe(false);
    expect(canCommitJudgeWalkthroughCallback({ isMounted: false, isRunning: true, isPaused: false, actionIndex: 1, nextAction: 1 })).toBe(false);
  });

  it("rejects duplicate, malformed, and out-of-order walkthrough callbacks", () => {
    const base = { isMounted: true, isRunning: true, isPaused: false, actionIndex: 1, nextAction: 1 };
    expect(canCommitJudgeWalkthroughCallback({ ...base, nextAction: 0 })).toBe(false);
    expect(canCommitJudgeWalkthroughCallback({ ...base, actionIndex: 2 })).toBe(false);
    expect(canCommitJudgeWalkthroughCallback({ ...base, actionIndex: Number.NaN })).toBe(false);
    expect(canCommitJudgeWalkthroughCallback({ ...base, nextAction: Number.POSITIVE_INFINITY })).toBe(false);
    expect(canCommitJudgeWalkthroughCallback({ ...base, actionIndex: -1 })).toBe(false);
    expect(canCommitJudgeWalkthroughCallback({ ...base, actionIndex: 1.5 })).toBe(false);
  });

  it("treats active reset as terminal for pending callbacks", () => {
    const resetIntent = resolveJudgeWalkthroughResetIntent({ isRunning: true, isPaused: false, isCompleted: false });
    expect(shouldInvalidateJudgeWalkthroughCallbacks(resetIntent)).toBe(true);
    expect(canCommitJudgeWalkthroughCallback({ isMounted: true, isRunning: true, isPaused: false, actionIndex: 1, nextAction: 1, callbackGeneration: 7, currentGeneration: 8 })).toBe(false);
  });

  it("rejects delayed callbacks from an older walkthrough generation", () => {
    expect(canCommitJudgeWalkthroughCallback({ isMounted: true, isRunning: true, isPaused: false, actionIndex: 1, nextAction: 1, callbackGeneration: 3, currentGeneration: 4 })).toBe(false);
    expect(canCommitJudgeWalkthroughCallback({ isMounted: true, isRunning: true, isPaused: false, actionIndex: 1, nextAction: 1, callbackGeneration: 4, currentGeneration: 4 })).toBe(true);
  });

  it("formats stable feedback for blocked walkthrough and handoff actions", () => {
    expect(formatJudgeBlockedActionFeedback("walkthrough-running")).toBe("Walkthrough is running · manual controls are temporarily locked");
    expect(formatJudgeBlockedActionFeedback("walkthrough-paused")).toBe("Walkthrough is paused · reset or resume before using manual controls");
    expect(formatJudgeBlockedActionFeedback("handoff-busy")).toBe("Handoff in progress · wait for the current action to finish");
  });

  it("allows Plaza handoffs only from the idle action state", () => {
    expect(canStartPlazaHandoff("idle")).toBe(true);
    expect(canStartPlazaHandoff("copying")).toBe(false);
    expect(canStartPlazaHandoff("sharing")).toBe(false);
    expect(canStartPlazaHandoff("opening")).toBe(false);
  });

  it.each([
    ["copy", "copying"],
    ["share", "sharing"],
    ["open", "opening"],
  ] as const)("rejects duplicate %s handoff starts while %s is active", (target, action) => {
    expect(canStartPlazaHandoff(action)).toBe(false);
    expect(formatPlazaHandoffAccessibility(target, action).disabled).toBe(true);
  });

  it("formats Plaza handoff accessibility states consistently", () => {
    expect(formatPlazaHandoffAccessibility("copy", "idle")).toEqual({ label: "Copy Decentraland Plaza coordinates", hint: "Copies the Plaza coordinates to the clipboard", busy: false, disabled: false });
    expect(formatPlazaHandoffAccessibility("copy", "copying")).toEqual({ label: "Copying Decentraland Plaza coordinates", hint: "Wait for the current Plaza handoff to finish", busy: true, disabled: true });
    expect(formatPlazaHandoffAccessibility("share", "sharing").busy).toBe(true);
    expect(formatPlazaHandoffAccessibility("open", "opening").busy).toBe(true);
    expect(formatPlazaHandoffAccessibility("share", "copying").disabled).toBe(true);
  });

  it("formats privacy-safe native handoff failures consistently", () => {
    expect(formatNativeHandoffFailure("recap-share").status).toBe("Recap ready to share");
    expect(formatNativeHandoffFailure("diagnostics-copy").announcement).toContain("sanitized Diagnostics report");
    expect(formatNativeHandoffFailure("party-code-copy").status).toBe("Copy unavailable — use Share");
    expect(formatNativeHandoffFailure("plaza-coordinates-copy").status).toBe("Coordinates ready — use Share");
    expect(formatNativeHandoffFailure("plaza-open").announcement).toContain("Plaza link remains ready to share");
    expect(formatNativeHandoffFailure("event-share", "Plaza Sprint").status).toBe("Plaza Sprint ready to copy");
    expect(formatNativeHandoffFailure("event-share", "  ").status).toBe("Event invite ready to copy");
    expect(formatNativeHandoffFailure("party-invite-share").status).toBe("Ready to copy");
    expect(formatNativeHandoffFailure("invite-link-share").status).toBe("Link ready");
    const copy = formatNativeHandoffFailure("party-invite-share");
    expect(copy.status).not.toMatch(/TUG-|wallet|0x/i);
    expect(copy.announcement).not.toMatch(/TUG-|wallet|0x/i);
  });

  it("formats a redacted Presenter settings summary", () => {
    const summary = formatJudgeSettingsSummary(true, "presenter", "persisted");
    expect(summary).toContain("Presenter Mode · Presenter pacing · persisted locally");
    expect(summary).toContain("Wallet and account identifiers omitted.");
    expect(summary).not.toContain("0x");
    expect(summary).not.toContain("TUG-");
  });

  it("resolves Presenter settings delivery through copy, Share, or visible fallback", () => {
    expect(resolveJudgeSettingsDeliveryOutcome({ clipboardCopied: true, shared: false, isMounted: true, inFlight: false })).toBe("copied");
    expect(resolveJudgeSettingsDeliveryOutcome({ clipboardCopied: false, shared: true, isMounted: true, inFlight: false })).toBe("shared");
    expect(resolveJudgeSettingsDeliveryOutcome({ clipboardCopied: false, shared: false, isMounted: true, inFlight: false })).toBe("fallback");
    expect(resolveJudgeSettingsDeliveryOutcome({ clipboardCopied: false, shared: true, isMounted: false, inFlight: false })).toBe("ignored");
    expect(formatJudgeSettingsDeliveryStatus("shared")).toBe("Settings summary shared");
    expect(formatJudgeSettingsDeliveryStatus("fallback")).toBe("Copy unavailable — use Share");
  });

  it("formats a sanitized report without private identifiers", () => {
    const report = formatSanitizedDemoReport({
      generatedAt: "2026-08-21T21:00:00.000Z",
      bridgeHealth: "fallback",
      bridgeRecoveryReason: "offline-mirror",
      bridgeLastCheckedAt: "2026-08-21T21:00:00.000Z",
      storageSchemaVersion: 1,
      storageSchemaEvent: "Storage schema is current.",
      persistenceFailure: "None recorded",
      demoFlow: "rsvp-saved",
      rsvpEvent: "Plaza Sprint",
      wins: 2,
      totalPulls: 48,
    });

    expect(report).toContain("Generated: 2026-08-21T21:00:00.000Z");
    expect(report).toContain("Bridge: Live presence unavailable");
    expect(report).toContain("RSVP: Plaza Sprint");
    expect(report).toContain("Wallet and account identifiers omitted");
    expect(report).not.toContain("TUG-");
    expect(report).not.toContain("0x");
  });

  it("formats reset feedback as a polite live region without changing copy", () => {
    expect(formatJudgeWalkthroughResetFeedbackLiveRegion("Demo reset. RSVP is ready.")).toEqual({ accessibilityLiveRegion: "polite", accessibilityLabel: "Demo reset. RSVP is ready." });
  });

  it("formats reset-control presentation for each lifecycle intent", () => {
    expect(formatJudgeWalkthroughResetControlPresentation("reset-active")).toEqual({ label: "RESET TO RSVP", hint: "Stops the running walkthrough and returns to RSVP while preserving saved demo data." });
    expect(formatJudgeWalkthroughResetControlPresentation("reset-paused")).toEqual({ label: "RESET TO RSVP", hint: "Clears the paused walkthrough position and returns to RSVP while preserving saved demo data." });
    expect(formatJudgeWalkthroughResetControlPresentation("reset-completed")).toEqual({ label: "RESET TO RSVP", hint: "Starts a fresh walkthrough from RSVP while preserving the completed reward receipt." });
    expect(formatJudgeWalkthroughResetControlPresentation("noop")).toEqual({ label: "RESET TO RSVP", hint: "The walkthrough is already at RSVP; use this control to confirm the demo baseline." });
  });

  it("formats reset outcomes with an actionable recovery path", () => {
    expect(formatResetStatusMessage(true)).toBe("Demo reset. Arena Home is ready for another run.");
    expect(formatResetStatusMessage(false)).toBe("Demo reset needs another attempt. Diagnostics are open.");
  });

  it("returns a complete deterministic transient Demo Reset baseline", () => {
    expect(getDemoResetBaseline()).toEqual({
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
    });
  });

  it("formats Demo Reset accessibility metadata for idle and cleanup states", () => {
    expect(getDemoResetAccessibilityState(false)).toEqual({
      label: "Reset local demo progress",
      hint: "Clears local match history and returns to Arena Home",
      busy: false,
      disabled: false,
    });
    expect(getDemoResetAccessibilityState(true)).toEqual({
      label: "Resetting local demo progress",
      hint: "Please wait while local demo data is being cleared",
      busy: true,
      disabled: true,
    });
  });

  it("recovers invalid bridge timestamps without committing bad state", () => {
    expect(resolveBridgeTimestampRecovery("valid", "2026-08-21T21:00:00.000Z")).toEqual({ value: "2026-08-21T21:00:00.000Z", warning: false });
    expect(resolveBridgeTimestampRecovery("missing", null)).toEqual({ value: null, warning: false });
    expect(resolveBridgeTimestampRecovery("malformed", null)).toEqual({ value: null, warning: true });
    expect(resolveBridgeTimestampRecovery("unavailable", null)).toEqual({ value: null, warning: true });
  });

  it("recovers persisted bridge reasons without committing invalid state", () => {
    expect(resolveBridgeRecoveryReasonRecovery("valid", "offline-mirror")).toEqual({ value: "offline-mirror", warning: false });
    expect(resolveBridgeRecoveryReasonRecovery("missing", null)).toEqual({ value: null, warning: false });
    expect(resolveBridgeRecoveryReasonRecovery("malformed", null)).toEqual({ value: null, warning: true });
    expect(resolveBridgeRecoveryReasonRecovery("unavailable", null)).toEqual({ value: null, warning: true });
  });

  it("does not commit a late reconnect result after unmount", () => {
    const reconnecting = beginBridgeReconnect(initialBridgeFlowState);
    const stillChecking = completeBridgeReconnect(reconnecting, "2026-08-21T21:00:00.000Z", false);

    expect(stillChecking).toEqual(reconnecting);
  });

  it("prevents duplicate reconnect starts while checking", () => {
    const reconnecting = beginBridgeReconnect(initialBridgeFlowState);
    expect(beginBridgeReconnect(reconnecting)).toBe(reconnecting);
  });
});
