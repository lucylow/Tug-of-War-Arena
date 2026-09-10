import { Color3, Color4 } from '@dcl/sdk/math'

export const sun = Color4.create(0.957, 0.635, 0.38, 1)
export const moon = Color4.create(0.608, 0.549, 1, 1)
export const friendzone = Color4.create(0.898, 0.42, 0.604, 1)
export const gold = Color4.create(1, 0.784, 0.341, 1)
export const cloud = Color4.create(0.961, 0.969, 1, 1)
export const sky = Color4.create(0.557, 0.784, 0.941, 1)
export const governance = Color4.create(0.655, 0.545, 0.98, 1)
export const midnight = Color4.create(0.114, 0.129, 0.314, 1)
export const ink = Color4.create(0.067, 0.078, 0.169, 1)
export const white = Color4.create(1, 1, 1, 1)

export const sun3 = Color3.create(0.957, 0.635, 0.38)
export const moon3 = Color3.create(0.608, 0.549, 1)
export const gold3 = Color3.create(1, 0.784, 0.341)
export const fill3 = Color3.create(0.45, 0.55, 0.85)

export function teamColor(team: 'sun' | 'moon'): Color4 {
  return team === 'sun' ? sun : moon
}
