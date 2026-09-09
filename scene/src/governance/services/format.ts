export function formatVp(vp: number): string {
  if (!Number.isFinite(vp)) return '0 VP'
  if (vp >= 1_000_000) return `${(vp / 1_000_000).toFixed(1)}M VP`
  if (vp >= 1_000) return `${Math.round(vp / 1_000)}K VP`
  return `${Math.round(vp)} VP`
}

export function formatPercent(value: number): string {
  const safe = Math.max(0, Math.min(100, Number(value) || 0))
  return `${Math.round(safe)}%`
}

export function compactTitle(title: string, max = 36): string {
  if (title.length <= max) return title
  return `${title.slice(0, Math.max(1, max - 1))}…`
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Number(value) || 0))
}

export function normalizeVotePercent(value: number): number {
  return clampPercent(value)
}

export function normalizeMetric(value: number): number {
  return Math.max(0, Number(value) || 0)
}
