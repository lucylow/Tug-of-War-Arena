import { Material, type Entity } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'

import type { GraphicTone } from '../logic/graphicsLayout'

export interface GraphicColor {
  r: number
  g: number
  b: number
  a?: number
}

export const GRAPHIC_COLORS: Record<GraphicTone, GraphicColor> = {
  midnight: { r: 0.035, g: 0.02, b: 0.09, a: 1 },
  violet: { r: 0.36, g: 0.16, b: 0.75, a: 1 },
  violetBright: { r: 0.68, g: 0.32, b: 1.0, a: 1 },
  pink: { r: 1.0, g: 0.13, b: 0.58, a: 1 },
  pinkSoft: { r: 1.0, g: 0.42, b: 0.78, a: 1 },
  peach: { r: 1.0, g: 0.58, b: 0.26, a: 1 },
  sun: { r: 1.0, g: 0.6, b: 0.14, a: 1 },
  sunSoft: { r: 1.0, g: 0.82, b: 0.38, a: 1 },
  moon: { r: 0.24, g: 0.68, b: 1.0, a: 1 },
  moonSoft: { r: 0.52, g: 0.86, b: 1.0, a: 1 },
  cyan: { r: 0.2, g: 0.95, b: 1.0, a: 1 },
  white: { r: 1, g: 1, b: 1, a: 1 },
  glass: { r: 0.12, g: 0.08, b: 0.22, a: 0.94 },
  glassLight: { r: 0.28, g: 0.17, b: 0.44, a: 0.92 },
}

export function graphicColor(tone: GraphicTone): GraphicColor {
  return GRAPHIC_COLORS[tone]
}

export function toColor4(color: GraphicColor): Color4 {
  return Color4.create(color.r, color.g, color.b, color.a ?? 1)
}

export function applyPbr(entity: Entity, color: GraphicColor, metallic = 0.12, roughness = 0.48): void {
  Material.setPbrMaterial(entity, {
    albedoColor: toColor4(color),
    metallic,
    roughness,
  })
}

export function applyEmissive(entity: Entity, color: GraphicColor, intensity = 1.8): void {
  Material.setPbrMaterial(entity, {
    albedoColor: toColor4(color),
    emissiveColor: Color4.create(color.r, color.g, color.b, 1),
    emissiveIntensity: intensity,
    metallic: 0.05,
    roughness: 0.32,
  })
}
