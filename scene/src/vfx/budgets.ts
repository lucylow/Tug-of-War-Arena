/**
 * Mobile-first particle budgets. Free of `@dcl/sdk` so Vitest can cover
 * quality scaling without booting the explorer.
 */

import { clamp } from '../logic/mapping'
import { isMobileClient } from '../performance/platform'
import type { QualityLevel } from '../performance/QualityManager'

export type VfxQuality = 'high' | 'medium' | 'low'

export type ParticleConfigLike = {
  count: number
  spread: number
  lifetime: number
  size: number
  gravity: number
  speed: number
}

export const VFX_QUALITY_MULTIPLIER: Record<VfxQuality, number> = {
  high: 1,
  medium: 0.6,
  low: 0.3,
}

export const DESKTOP_PARTICLE_BUDGET = 200
export const MOBILE_PARTICLE_BUDGET = 50

export const DUST_COUNT = { desktop: 80, mobile: 30 } as const
export const FIREFLY_COUNT = { desktop: 30, mobile: 8 } as const
export const SPARK_COUNT = { desktop: 30, mobile: 15 } as const
export const CONFETTI_COUNT = { desktop: 60, mobile: 25 } as const
export const RAIN_COUNT = { desktop: 200, mobile: 60 } as const
export const SNOW_COUNT = { desktop: 70, mobile: 28 } as const

export function mapQualityLevel(level: QualityLevel): VfxQuality {
  if (level === 'ultra' || level === 'high') return 'high'
  if (level === 'medium') return 'medium'
  return 'low'
}

export function particleBudgetFor(quality: VfxQuality, mobile: boolean = isMobileClient()): number {
  const base = mobile ? MOBILE_PARTICLE_BUDGET : DESKTOP_PARTICLE_BUDGET
  return Math.max(0, Math.floor(base * VFX_QUALITY_MULTIPLIER[quality]))
}

export function scaleCount(desktop: number, mobileCount: number, mobile: boolean): number {
  return mobile ? mobileCount : desktop
}

export function applyQualityToCount(count: number, quality: VfxQuality): number {
  return Math.max(0, Math.floor(count * VFX_QUALITY_MULTIPLIER[quality]))
}

export function mobileSizeBoost(size: number, mobile: boolean): number {
  return mobile ? size * 1.2 : size
}

export function firefliesEnabled(quality: VfxQuality, mobile: boolean): boolean {
  if (quality === 'low') return false
  return !mobile
}

export function rainCount(mobile: boolean, quality: VfxQuality): number {
  return applyQualityToCount(scaleCount(RAIN_COUNT.desktop, RAIN_COUNT.mobile, mobile), quality)
}

export function confettiPieceCount(requested: number, mobile: boolean): number {
  const scaled = mobile ? Math.floor(requested * 0.4) : requested
  const cap = mobile ? CONFETTI_COUNT.mobile : CONFETTI_COUNT.desktop
  return clamp(scaled, 0, cap)
}

export function powerSurgeDuration(mobile: boolean): number {
  return mobile ? 0.6 : 0.8
}

export function powerSurgeMaxScale(mobile: boolean): number {
  return mobile ? 2 : 3
}

export function comboDuration(mobile: boolean): number {
  return mobile ? 1.2 : 1.5
}

export function maintainRate(count: number, lifetime: number): number {
  if (lifetime <= 0 || count <= 0) return 0
  return Math.max(1, count / lifetime)
}
