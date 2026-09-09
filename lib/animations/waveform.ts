export const WAVEFORM_MIN_HEIGHT = 10;
export const WAVEFORM_MAX_HEIGHT = 40;
export const WAVEFORM_BAR_COUNT = 8;

export function waveformBarTarget(
  index: number,
  active: boolean,
  min = WAVEFORM_MIN_HEIGHT,
  max = WAVEFORM_MAX_HEIGHT,
): { from: number; to: number; duration: number; delay: number } {
  const i = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  const lo = Number.isFinite(min) ? min : WAVEFORM_MIN_HEIGHT;
  const hi = Number.isFinite(max) && max > lo ? max : lo + 30;
  if (!active) {
    return { from: lo, to: lo, duration: 300, delay: 0 };
  }
  const spread = (i % 5) / 4;
  return {
    from: lo,
    to: lo + (hi - lo) * (0.35 + spread * 0.65),
    duration: 280 + (i % 4) * 80,
    delay: i * 90,
  };
}
