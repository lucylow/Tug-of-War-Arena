export const DEFAULT_TILT_AMOUNT = 10;

export function tiltFromDelta(
  dx: number,
  dy: number,
  width: number,
  height: number,
  amount = DEFAULT_TILT_AMOUNT,
): { rotateX: number; rotateY: number } {
  "worklet";
  const w = Number.isFinite(width) && width > 0 ? width : 300;
  const h = Number.isFinite(height) && height > 0 ? height : 200;
  const max = Number.isFinite(amount) ? amount : DEFAULT_TILT_AMOUNT;
  const x = Number.isFinite(dx) ? dx : 0;
  const y = Number.isFinite(dy) ? dy : 0;
  const rotateX = Math.max(-max, Math.min(max, (-y / h) * max));
  const rotateY = Math.max(-max, Math.min(max, (x / w) * max));
  return { rotateX, rotateY };
}
