import { Color3, Color4 } from '@dcl/sdk/math'

import type { CrewId } from './logic/mapping'

export const ink = Color4.create(0.067, 0.078, 0.169, 1)
export const midnight = Color4.create(0.114, 0.129, 0.314, 1)
export const sun = Color4.create(1, 0.42, 0.42, 1)
export const moon = Color4.create(0.302, 0.906, 0.949, 1)
export const gold = Color4.create(1, 0.784, 0.341, 1)
export const cloud = Color4.create(0.961, 0.969, 1, 1)
export const fog = Color4.create(0.659, 0.69, 0.847, 1)
export const mint = Color4.create(0.447, 0.949, 0.714, 1)
export const border = Color4.create(0.227, 0.251, 0.478, 1)
export const floor = Color4.create(0.055, 0.071, 0.188, 1)
export const moss = Color4.create(0.22, 0.55, 0.32, 1)
export const canopy = Color4.create(0.18, 0.42, 0.28, 1)
export const bark = Color4.create(0.32, 0.2, 0.12, 1)
export const stone = Color4.create(0.42, 0.45, 0.52, 1)
export const flame = Color4.create(1, 0.55, 0.18, 1)
export const skyNight = Color4.create(0.08, 0.12, 0.28, 1)
export const skyHorizon = Color4.create(0.18, 0.16, 0.38, 1)

export const sun3 = Color3.create(1, 0.42, 0.42)
export const moon3 = Color3.create(0.302, 0.906, 0.949)
export const gold3 = Color3.create(1, 0.784, 0.341)
export const warm3 = Color3.create(1, 0.92, 0.75)
export const fill3 = Color3.create(0.45, 0.55, 0.85)

export function crewColor(team: CrewId): Color4 {
  return team === 'sun' ? sun : moon
}

export function crewColor3(team: CrewId): Color3 {
  return team === 'sun' ? sun3 : moon3
}

export function withAlpha(color: Color4, alpha: number): Color4 {
  return Color4.create(color.r, color.g, color.b, alpha)
}
