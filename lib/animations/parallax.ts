export const DEFAULT_PARALLAX_HEADER = 200;
export const DEFAULT_PARALLAX_MIN = 60;

export function parallaxHeaderMetrics(
  scrollY: number,
  headerHeight = DEFAULT_PARALLAX_HEADER,
  minHeight = DEFAULT_PARALLAX_MIN,
): { height: number; scale: number; translateY: number } {
  "worklet";
  const y = Number.isFinite(scrollY) ? Math.max(0, scrollY) : 0;
  const header = Number.isFinite(headerHeight) && headerHeight > 0 ? headerHeight : DEFAULT_PARALLAX_HEADER;
  const min =
    Number.isFinite(minHeight) && minHeight >= 0 ? Math.min(header, minHeight) : DEFAULT_PARALLAX_MIN;
  const collapseRange = Math.max(0, header - min);
  const collapse = Math.min(y, collapseRange);
  const height = header - collapse;
  const scale = 1 + Math.min(y, 80) / header * 0.12;
  return { height, scale, translateY: collapse * 0.35 };
}

export function listItemEnterDelay(index: number, perItemMs = 50): number {
  const i = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  const step = Number.isFinite(perItemMs) ? Math.max(0, perItemMs) : 50;
  return i * step;
}
