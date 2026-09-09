export type { SwipeDirection } from "./gestures";
export {
  DEFAULT_LONG_PRESS_MS,
  DEFAULT_SWIPE_THRESHOLD,
  DEFAULT_TAP_SCALE,
  clampScale,
  detectSwipeDirection,
} from "./gestures";

export { POWER_GLOW_THRESHOLD, powerProgress, shouldGlow, withAlpha } from "./power";

export type { RopePoint } from "./rope";
export {
  ROPE_POSITION_MAX,
  ROPE_POSITION_MIN,
  ROPE_SEGMENTS,
  buildRopePoints,
  normalizeRopePosition,
  ropePathD,
} from "./rope";

export { COMBO_VISIBLE_AT, SURGE_STREAK, comboMultiplier, isComboVisible, isSurgeReady } from "./combo";

export type { CountdownValue } from "./countdown";
export {
  COUNTDOWN_EXIT_MS,
  COUNTDOWN_HOLD_MS,
  countdownLabel,
  isCountdownValue,
  nextCountdown,
} from "./countdown";

export type { ConfettiPiece } from "./confetti";
export {
  CONFETTI_COLORS,
  CONFETTI_DURATION_MS,
  DEFAULT_CONFETTI_COUNT,
  confettiPose,
  createConfettiPieces,
} from "./confetti";

export { HUD_LOW_TIME, formatHudScore, formatHudTimer, shouldPulseTimer } from "./hud";

export { createImmediateScheduler, scheduleAfterInteractions } from "./performance";
export type { InteractionScheduler } from "./performance";

export {
  ARENA_COLORS,
  SPACING,
  SPRING_BOUNCE,
  SPRING_SNAP,
  SPRING_SOFT,
  TYPOGRAPHY,
} from "./theme";

export type { AnimationStep, AnimationStepType } from "./sequence";
export {
  DEFAULT_DELAY_MS,
  DEFAULT_SEQUENCE_SPRING,
  DEFAULT_TIMING_MS,
  ESTIMATED_SPRING_MS,
  normalizeAnimationStep,
  sequenceDuration,
  staggerDelay,
} from "./sequence";

export type { FxParticle } from "./fx-particles";
export {
  DEFAULT_FX_COUNT,
  DEFAULT_SPARKLE_COUNT,
  FX_GRAVITY,
  FX_PARTICLE_COLORS,
  createFxParticles,
  createSparkles,
  fxParticlePose,
  particleOpacity,
  particleRadius,
  stepFxParticle,
} from "./fx-particles";

export type { ToastPalette, ToastType } from "./toast";
export { TOAST_DURATION_MS, TOAST_ENTER_MS, TOAST_EXIT_MS, isToastType, toastPalette } from "./toast";

export type { ArenaEmote } from "./emotes";
export { ARENA_EMOTES, emoteAt, matchResultCopy } from "./emotes";

export { throttleAnimation } from "./throttle";

export { FrameRateSampler, logAnimationFrameRate } from "./debugger";

export { DEFAULT_PARALLAX_HEADER, DEFAULT_PARALLAX_MIN, listItemEnterDelay, parallaxHeaderMetrics } from "./parallax";

export { DEFAULT_TILT_AMOUNT, tiltFromDelta } from "./tilt";

export {
  WAVEFORM_BAR_COUNT,
  WAVEFORM_MAX_HEIGHT,
  WAVEFORM_MIN_HEIGHT,
  waveformBarTarget,
} from "./waveform";
