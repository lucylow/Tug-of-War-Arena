export type AnimationStepType = "spring" | "timing" | "delay";

export type AnimationStep = {
  type: AnimationStepType;
  toValue?: number;
  duration?: number;
  damping?: number;
  stiffness?: number;
};

export const DEFAULT_SEQUENCE_SPRING = { damping: 15, stiffness: 120 } as const;
export const DEFAULT_TIMING_MS = 300;
export const DEFAULT_DELAY_MS = 500;
export const ESTIMATED_SPRING_MS = 400;

export function staggerDelay(index: number, staggerMs = 100): number {
  const i = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  const step = Number.isFinite(staggerMs) ? Math.max(0, staggerMs) : 100;
  return i * step;
}

export function normalizeAnimationStep(step: AnimationStep): {
  type: AnimationStepType;
  toValue: number;
  duration: number;
  damping: number;
  stiffness: number;
} {
  const type: AnimationStepType =
    step.type === "spring" || step.type === "timing" || step.type === "delay" ? step.type : "timing";
  const duration =
    type === "delay"
      ? Number.isFinite(step.duration)
        ? Math.max(0, step.duration as number)
        : DEFAULT_DELAY_MS
      : type === "timing"
        ? Number.isFinite(step.duration)
          ? Math.max(0, step.duration as number)
          : DEFAULT_TIMING_MS
        : ESTIMATED_SPRING_MS;
  return {
    type,
    toValue: Number.isFinite(step.toValue) ? (step.toValue as number) : 0,
    duration,
    damping: Number.isFinite(step.damping) ? (step.damping as number) : DEFAULT_SEQUENCE_SPRING.damping,
    stiffness: Number.isFinite(step.stiffness) ? (step.stiffness as number) : DEFAULT_SEQUENCE_SPRING.stiffness,
  };
}

export function sequenceDuration(steps: readonly AnimationStep[]): number {
  if (!Array.isArray(steps) || steps.length === 0) return 0;
  return steps.reduce((total, step) => total + normalizeAnimationStep(step).duration, 0);
}
