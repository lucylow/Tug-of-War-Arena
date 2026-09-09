export {
  DEFAULT_HIT_SLOP,
  ICON_CHROME_SIZE,
  MIN_TOUCH_TARGET_PT,
  ONE_THUMB_PULL_SIZE,
  QUICK_ACTION_SIZE,
  clampNonNegative,
  effectiveTouchSize,
  expandHitSlop,
  hitSlopForRect,
  isInThumbReach,
  isOneThumbPull,
  meetsTouchFloor,
  pullControlMetrics,
  type HitSlop,
  type TouchRect,
} from "./touch";

export {
  NOTICE_MIN_INTERVAL_MS,
  PULL_MIN_INTERVAL_MS,
  REACTION_MIN_INTERVAL_MS,
  SURGE_MIN_INTERVAL_MS,
  canAcceptAt,
  createPullGate,
  createRateGate,
  createReactionGate,
  createSurgeGate,
  remainingCooldown,
  type Clock,
  type RateGate,
} from "./throttle";

export {
  HAPTIC_MAX_PER_WINDOW,
  HAPTIC_MIN_INTERVAL_MS,
  HAPTIC_WINDOW_MS,
  createHapticBudget,
  shouldPlayHaptic,
  type HapticBudget,
  type HapticBudgetSnapshot,
  type HapticClock,
  type HapticKind,
} from "./haptics";

export {
  MOTION_MEDIUM_MS,
  MOTION_SHORT_MS,
  MOTION_SNAP_MS,
  durationForMotion,
  pressScaleForMotion,
  shouldCelebrate,
  shouldRunLoopingFx,
  springOrSnap,
  type MotionPrefs,
} from "./motion";

export {
  COMPACT_WIDTH,
  LARGE_WIDTH,
  classifyDevice,
  heroMinHeight,
  isCompactViewport,
  listRowHeight,
  maxVisibleRows,
  playerCardAvatarSize,
  sectionPadding,
  type DeviceClass,
  type Viewport,
} from "./device";

export {
  COMPANION_RENDER_BUDGET,
  boundedQueue,
  canAffordList,
  memoryBand,
  particleBudget,
  windowSlice,
  type MemoryProbe,
} from "./budget";

export {
  VisibilityAwareMonitor,
  shouldSampleFps,
  type FrameClock,
  type FpsSample,
  type VisibilityAwareHandle,
} from "./performance";

export {
  createDiagnosticSnapshot,
  formatFpsLine,
  gradeFromFps,
  type DiagnosticSnapshot,
  type PerformanceGrade,
} from "./diagnostics";

export {
  dismissNotice,
  emptyNoticeQueue,
  enqueueNotice,
  type MobileNoticeItem,
  type NoticeKind,
  type NoticeQueueState,
} from "./notices";

export {
  captureFocus,
  modalA11yProps,
  restoreFocusId,
  shouldLockBackground,
  type FocusSnapshot,
} from "./focus";

export {
  applyThrottledPull,
  applyThrottledReaction,
  applyThrottledSurge,
  createMobileMatchState,
  tickOpponent,
  type MobileMatchState,
} from "./arena";
