/**
 * SDK-free pulse / float math for the World graphics layer.
 * Bounded so decorative motion cannot run away from authored origins.
 */

import { clamp, type Vec3 } from './mapping'

export const GRAPHICS_PULSE_AMOUNT_MAX = 0.5
export const GRAPHICS_FLOAT_AMPLITUDE_MAX = 0.4

export function graphicPulseScale(base: Vec3, time: number, speed: number, amount: number, phase: number): Vec3 {
  const bounded = clamp(amount, 0, GRAPHICS_PULSE_AMOUNT_MAX)
  const wave = 1 + Math.sin(time * speed + phase) * bounded
  return {
    x: base.x * wave,
    y: base.y * wave,
    z: base.z * wave,
  }
}

export function graphicFloatOffset(origin: Vec3, time: number, amplitude: number, speed: number, phase: number): Vec3 {
  const bounded = clamp(amplitude, 0, GRAPHICS_FLOAT_AMPLITUDE_MAX)
  return {
    x: origin.x,
    y: origin.y + Math.sin(time * speed + phase) * bounded,
    z: origin.z,
  }
}
