/**
 * Reduced-motion helpers. When the OS preference is on, springs collapse
 * to snaps and looping effects stay off — gameplay still works.
 */

export const MOTION_SNAP_MS = 0;
export const MOTION_SHORT_MS = 160;
export const MOTION_MEDIUM_MS = 280;

export interface MotionPrefs {
  reduceMotion: boolean;
}

export function durationForMotion(reduceMotion: boolean, animatedMs: number, reducedMs = MOTION_SNAP_MS): number {
  if (reduceMotion) return Math.max(0, reducedMs);
  return Number.isFinite(animatedMs) && animatedMs > 0 ? animatedMs : MOTION_MEDIUM_MS;
}

export function shouldRunLoopingFx(reduceMotion: boolean): boolean {
  return !reduceMotion;
}

export function shouldCelebrate(reduceMotion: boolean, won: boolean): boolean {
  return won && !reduceMotion;
}

export function pressScaleForMotion(reduceMotion: boolean, animated = 0.92): number {
  if (reduceMotion) return 1;
  if (!Number.isFinite(animated)) return 0.92;
  return Math.max(0.85, Math.min(1, animated));
}

export function springOrSnap(
  reduceMotion: boolean,
  spring: { damping: number; stiffness: number; mass: number },
): { damping: number; stiffness: number; mass: number } | null {
  return reduceMotion ? null : spring;
}
