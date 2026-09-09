import { isMobile } from '@dcl/sdk/platform'

import { PERFORMANCE } from '../config'

/**
 * Mobile-only performance helpers. FPS sampling lives in FramerateTracker
 * via `tickPerformance` in the main loop — never `requestAnimationFrame`.
 */
export function lazyLoadDistance(loadDistance: number = 16): number {
  return isMobile() ? loadDistance * 0.75 : loadDistance
}

export function mobileParticleBudget(): number {
  return isMobile() ? Math.min(PERFORMANCE.maxParticles, 80) : PERFORMANCE.maxParticles
}

export function enablePerformanceMonitoring(): void {
  // Adaptive FPS / budget enforcement is registered by setupPerformance().
}
