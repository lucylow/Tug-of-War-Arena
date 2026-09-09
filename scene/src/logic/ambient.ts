import type { Vec3 } from './mapping'

export type AmbientKind = 'cloud' | 'sparkle'

export function ambientOffset(kind: AmbientKind, time: number, phase: number, radius: number): Vec3 {
  if (kind === 'cloud') {
    return {
      x: Math.cos(time * 0.11 + phase) * radius,
      y: Math.sin(time * 0.07 + phase) * 0.18,
      z: Math.sin(time * 0.11 + phase) * radius,
    }
  }
  return {
    x: Math.cos(time * 0.9 + phase) * (radius * 0.35),
    y: Math.sin(time * 1.8 + phase) * 0.35,
    z: Math.sin(time * 0.9 + phase) * (radius * 0.35),
  }
}

export function applyAmbientOrigin(origin: Vec3, offset: Vec3): Vec3 {
  return {
    x: origin.x + offset.x,
    y: origin.y + offset.y,
    z: origin.z + offset.z,
  }
}
