/**
 * Glowing PBR configs. SDK7 has no custom GLSL, so glow is albedo + emissive.
 * Intensity animation lives in `glowPulseIntensity` so Vitest can cover it.
 */

import { glowPulseIntensity } from '../logic/visualFx'
import type { ColorLike, PbrMaterialConfig } from './types'

export function createGlowMaterial(color: ColorLike, intensity: number = 1): PbrMaterialConfig {
  const albedo = { r: color.r, g: color.g, b: color.b, a: color.a ?? 1 }
  return {
    albedoColor: albedo,
    emissiveColor: albedo,
    emissiveIntensity: intensity,
    roughness: 0.2,
    metallic: 0.35,
    transparencyMode: 0,
  }
}

export function updateGlowIntensity(time: number, min: number = 0.5, max: number = 2): number {
  return glowPulseIntensity(time, min, max)
}

export { glowPulseIntensity }
