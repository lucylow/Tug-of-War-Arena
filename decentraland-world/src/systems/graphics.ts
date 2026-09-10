import type { GraphicsLevel } from '../config'

export function resolveGraphics(level: GraphicsLevel, reducedMotion: boolean) {
  return {
    particles: reducedMotion ? 0 : level === 'low' ? 4 : level === 'high' ? 16 : 8,
    animateAvatars: level !== 'low',
    ambient: level === 'high' && !reducedMotion,
    portalPulse: !reducedMotion,
  }
}
