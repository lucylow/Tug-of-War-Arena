export type RopePoint = { x: number; y: number };

export const ROPE_SEGMENTS = 40;
export const ROPE_POSITION_MIN = -44;
export const ROPE_POSITION_MAX = 44;

export function normalizeRopePosition(position: number): number {
  if (!Number.isFinite(position)) return 0;
  return Math.max(ROPE_POSITION_MIN, Math.min(ROPE_POSITION_MAX, position));
}

export function buildRopePoints(
  position: number,
  width: number,
  segments: number = ROPE_SEGMENTS,
  tension = 2,
): RopePoint[] {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 1;
  const safeSegments = Number.isFinite(segments) ? Math.max(2, Math.floor(segments)) : ROPE_SEGMENTS;
  const safeTension = Number.isFinite(tension) ? Math.max(0, tension) : 2;
  const p = normalizeRopePosition(position);
  const amplitude = (Math.abs(p) / ROPE_POSITION_MAX) * 20 * safeTension;
  const phase = (p / ROPE_POSITION_MAX) * Math.PI;
  const segmentWidth = safeWidth / safeSegments;
  const points: RopePoint[] = [];

  for (let i = 0; i <= safeSegments; i += 1) {
    const x = i * segmentWidth;
    const y = Math.sin((i / safeSegments) * Math.PI + phase) * amplitude;
    points.push({ x, y });
  }

  return points;
}

export function ropePathD(points: readonly RopePoint[]): string {
  if (points.length === 0) return "M0 0";
  const first = points[0];
  if (!first) return "M0 0";
  let d = `M${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (!point) continue;
    d += ` L${point.x} ${point.y}`;
  }
  return d;
}
