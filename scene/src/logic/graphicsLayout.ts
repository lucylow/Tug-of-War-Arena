/**
 * SDK-free layout for the dedicated World graphics layer.
 * The 16×16 pastel sketch is remapped onto the 2×2 parcel so visuals
 * frame the existing arena instead of sitting on the rope, pads, HUD, or plaza.
 */

import { getCrewBasePosition, getEntrancePosition } from './journey'
import { ARENA_CENTER, type CrewId, type Vec3 } from './mapping'

export type GraphicTone =
  | 'midnight'
  | 'violet'
  | 'violetBright'
  | 'pink'
  | 'pinkSoft'
  | 'peach'
  | 'sun'
  | 'sunSoft'
  | 'moon'
  | 'moonSoft'
  | 'cyan'
  | 'white'
  | 'glass'
  | 'glassLight'

export type GraphicBoxSpec = {
  position: Vec3
  scale: Vec3
  tone: GraphicTone
  emissive?: boolean
}

export type GraphicSphereSpec = GraphicBoxSpec & {
  phase?: number
  speed?: number
  amount?: number
  amplitude?: number
}

/** Local center of the original 16×16 graphics sketch. */
export const GRAPHICS_SKETCH_CENTER = 8

export const GRAPHICS_STAGE_SIZE = { x: 10.8, y: 0.18, z: 6.8 } as const
export const GRAPHICS_STAR_COUNT = 11
export const GRAPHICS_CLOUD_COUNT = 6
export const GRAPHICS_CONFETTI_COUNT = 18
export const GRAPHICS_PILLAR_COUNT = 4
export const GRAPHICS_PORTAL_COUNT = 2

export function fromGraphicsSketch(x: number, y: number, z: number): Vec3 {
  return {
    x: ARENA_CENTER.x + (x - GRAPHICS_SKETCH_CENTER),
    y,
    z: ARENA_CENTER.z + (z - GRAPHICS_SKETCH_CENTER),
  }
}

export function getSkyPanelSpecs(): GraphicBoxSpec[] {
  return [
    {
      position: { x: ARENA_CENTER.x, y: 8.2, z: ARENA_CENTER.z + 15.5 },
      scale: { x: 30.8, y: 14.4, z: 0.25 },
      tone: 'violet',
      emissive: true,
    },
    {
      position: { x: ARENA_CENTER.x - 15.5, y: 7.6, z: ARENA_CENTER.z },
      scale: { x: 0.25, y: 13.4, z: 30.8 },
      tone: 'pink',
      emissive: true,
    },
    {
      position: { x: ARENA_CENTER.x + 15.5, y: 7.6, z: ARENA_CENTER.z },
      scale: { x: 0.25, y: 13.4, z: 30.8 },
      tone: 'moon',
      emissive: true,
    },
  ]
}

const CLOUD_SEEDS = [
  [2.2, 9.4, 2.5, 0],
  [5.8, 10.0, 1.1, 0.6],
  [10.8, 9.6, 2.2, 1.3],
  [13.5, 10.5, 0.8, 2.1],
  [3.5, 8.8, 12.5, 0.4],
  [11.8, 9.2, 12.9, 1.8],
] as const

export function getCloudSpecs(): GraphicSphereSpec[] {
  return CLOUD_SEEDS.flatMap(([x, y, z, phase], index) => {
    const origin = fromGraphicsSketch(x, y, z)
    const companion = fromGraphicsSketch(x + 0.85, y + 0.12, z + 0.1)
    return [
      {
        position: origin,
        scale: { x: 1.15, y: 0.45, z: 0.72 },
        tone: 'white',
        phase,
        amplitude: 0.12 + (index % 2) * 0.04,
        speed: 0.55 + (index % 3) * 0.1,
      },
      {
        position: companion,
        scale: { x: 0.82, y: 0.36, z: 0.56 },
        tone: 'white',
        phase: phase + 0.4,
        amplitude: 0.1,
        speed: 0.6,
      },
    ]
  })
}

const STAR_POINTS = [
  [1.2, 11.0, 4.2],
  [3.4, 10.5, 6.4],
  [6.2, 11.5, 3.4],
  [9.4, 10.9, 5.2],
  [12.2, 11.4, 4.1],
  [14.1, 10.7, 6.7],
  [2.1, 11.2, 10.4],
  [5.1, 10.9, 12.2],
  [9.2, 11.6, 11.0],
  [13.1, 11.0, 10.2],
  [7.7, 10.8, 14.2],
] as const

export function getStarSpecs(): GraphicSphereSpec[] {
  return STAR_POINTS.map(([x, y, z], index) => ({
    position: fromGraphicsSketch(x, y, z),
    scale: { x: 0.06, y: 0.06, z: 0.06 },
    tone: index % 3 === 0 ? 'sunSoft' : 'white',
    emissive: true,
    speed: 1.7 + index * 0.12,
    amount: 0.45,
    phase: index * 0.3,
  }))
}

export function getStageSpecs(): GraphicBoxSpec[] {
  const specs: GraphicBoxSpec[] = [
    {
      position: { x: ARENA_CENTER.x, y: 0.1, z: ARENA_CENTER.z },
      scale: { ...GRAPHICS_STAGE_SIZE },
      tone: 'midnight',
    },
    {
      position: { x: ARENA_CENTER.x, y: 0.2, z: ARENA_CENTER.z },
      scale: { x: 10.2, y: 0.08, z: 6.2 },
      tone: 'glassLight',
      emissive: true,
    },
  ]

  for (const dz of [-2.9, 2.9]) {
    for (let i = 0; i < 9; i += 1) {
      specs.push({
        position: { x: ARENA_CENTER.x - 4.9 + i * 1.225, y: 0.34, z: ARENA_CENTER.z + dz },
        scale: { x: 0.72, y: 0.08, z: 0.12 },
        tone: i % 2 === 0 ? 'pink' : 'violetBright',
        emissive: true,
      })
    }
  }

  for (const dx of [-5.25, 5.25]) {
    for (let i = 0; i < 5; i += 1) {
      specs.push({
        position: { x: ARENA_CENTER.x + dx, y: 0.36, z: ARENA_CENTER.z - 2.6 + i * 1.3 },
        tone: i % 2 === 0 ? 'sun' : 'moon',
        scale: { x: 0.12, y: 0.08, z: 0.75 },
        emissive: true,
      })
    }
  }

  return specs
}

export function getStageMarkerSpecs(): Array<GraphicBoxSpec & { yaw: number }> {
  return [
    {
      position: { x: ARENA_CENTER.x, y: 0.28, z: ARENA_CENTER.z },
      scale: { x: 0.12, y: 0.14, z: 5.25 },
      tone: 'white',
      emissive: true,
      yaw: 45,
    },
    {
      position: { x: ARENA_CENTER.x, y: 0.29, z: ARENA_CENTER.z },
      scale: { x: 0.12, y: 0.14, z: 5.25 },
      tone: 'white',
      emissive: true,
      yaw: -45,
    },
  ]
}

export function getPillarSpecs(): Array<{
  column: GraphicBoxSpec
  orb: GraphicSphereSpec
  plinth: GraphicBoxSpec
}> {
  const corners: Array<{ dx: number; dz: number; tone: GraphicTone }> = [
    { dx: -5.6, dz: -3.8, tone: 'sun' },
    { dx: 5.6, dz: -3.8, tone: 'moon' },
    { dx: -5.6, dz: 3.8, tone: 'sunSoft' },
    { dx: 5.6, dz: 3.8, tone: 'moonSoft' },
  ]
  return corners.map((corner, index) => {
    const x = ARENA_CENTER.x + corner.dx
    const z = ARENA_CENTER.z + corner.dz
    return {
      column: {
        position: { x, y: 2.7, z },
        scale: { x: 0.42, y: 5.2, z: 0.42 },
        tone: 'midnight',
        emissive: true,
      },
      orb: {
        position: { x, y: 5.5, z },
        scale: { x: 0.52, y: 0.52, z: 0.52 },
        tone: corner.tone,
        emissive: true,
        speed: 1.5,
        amount: 0.14,
        phase: index * 0.8,
      },
      plinth: {
        position: { x, y: 0.55, z },
        scale: { x: 0.85, y: 0.16, z: 0.85 },
        tone: corner.tone,
        emissive: true,
      },
    }
  })
}

export function getCenterpieceOrb(): GraphicSphereSpec {
  return {
    position: { x: ARENA_CENTER.x, y: 3.15, z: ARENA_CENTER.z },
    scale: { x: 0.52, y: 0.52, z: 0.52 },
    tone: 'white',
    emissive: true,
    amplitude: 0.18,
    speed: 1.4,
    phase: 0.2,
    amount: 0.12,
  }
}

export function getCenterpieceRaySpecs(): GraphicSphereSpec[] {
  const specs: GraphicSphereSpec[] = []
  for (let i = 0; i < 6; i += 1) {
    const z = ARENA_CENTER.z + 1.35 - i * 0.45
    specs.push({
      position: { x: ARENA_CENTER.x, y: 3.1, z },
      scale: { x: 0.08, y: 0.08, z: 0.32 + i * 0.06 },
      tone: i % 2 === 0 ? 'pink' : 'cyan',
      emissive: true,
      amplitude: 0.1,
      speed: 1.1,
      phase: i * 0.7,
    })
  }
  return specs
}

export function getHeroSignBackplate(): GraphicBoxSpec {
  const entrance = getEntrancePosition()
  return {
    position: { x: ARENA_CENTER.x, y: 6.8, z: Math.max(0.7, entrance.z - 2.4) },
    scale: { x: 9.6, y: 1.15, z: 0.18 },
    tone: 'glass',
    emissive: true,
  }
}

export function getHeroSignLabelPosition(): Vec3 {
  const plate = getHeroSignBackplate().position
  return { x: plate.x, y: plate.y + 0.05, z: plate.z - 0.22 }
}

export function getHeroSignSubtitlePosition(): Vec3 {
  const plate = getHeroSignBackplate().position
  return { x: plate.x, y: plate.y - 0.65, z: plate.z - 0.2 }
}

export function getLoopSignBackplate(): GraphicBoxSpec {
  const entrance = getEntrancePosition()
  return {
    position: { x: ARENA_CENTER.x, y: 2.05, z: Math.max(0.9, entrance.z - 2.2) },
    scale: { x: 7.4, y: 1.2, z: 0.15 },
    tone: 'glass',
    emissive: true,
  }
}

export function getLoopSignLabelPosition(): Vec3 {
  const plate = getLoopSignBackplate().position
  return { x: plate.x, y: plate.y + 0.02, z: plate.z - 0.3 }
}

export function getTeamBadgeSpecs(): Array<{
  crew: CrewId
  plate: GraphicBoxSpec
  orb: GraphicSphereSpec
  bar: GraphicBoxSpec
}> {
  return (['sun', 'moon'] as const).map((crew, index) => {
    const base = getCrewBasePosition(crew)
    const inward = crew === 'sun' ? 1.7 : -1.7
    const x = base.x + inward
    const z = base.z
    const tone: GraphicTone = crew === 'sun' ? 'sun' : 'moon'
    const secondary: GraphicTone = crew === 'sun' ? 'sunSoft' : 'moonSoft'
    return {
      crew,
      plate: {
        position: { x, y: 2.35, z },
        scale: { x: 2.1, y: 1.6, z: 0.18 },
        tone: 'glass',
        emissive: true,
      },
      orb: {
        position: { x, y: 2.4, z: z - 0.12 },
        scale: { x: 0.62, y: 0.62, z: 0.24 },
        tone,
        emissive: true,
        speed: 1.8,
        amount: 0.1,
        phase: index,
      },
      bar: {
        position: { x, y: 1.46, z },
        scale: { x: 1.5, y: 0.1, z: 0.12 },
        tone: secondary,
        emissive: true,
      },
    }
  })
}

export function getPortalFrameSpecs(): Array<{
  x: number
  z: number
  tone: GraphicTone
  posts: Array<GraphicBoxSpec & { roll: number }>
  beam: GraphicBoxSpec
  core: GraphicSphereSpec
}> {
  const portals = [
    { x: ARENA_CENTER.x - 5, z: ARENA_CENTER.z - 10, tone: 'pink' as const },
    { x: ARENA_CENTER.x + 5, z: ARENA_CENTER.z - 10, tone: 'cyan' as const },
  ]
  return portals.map((portal, index) => ({
    x: portal.x,
    z: portal.z,
    tone: portal.tone,
    posts: [
      {
        position: { x: portal.x - 0.7, y: 2.2, z: portal.z },
        scale: { x: 0.18, y: 4.2, z: 0.55 },
        tone: portal.tone,
        emissive: true,
        roll: 4,
      },
      {
        position: { x: portal.x + 0.7, y: 2.2, z: portal.z },
        scale: { x: 0.18, y: 4.2, z: 0.55 },
        tone: portal.tone,
        emissive: true,
        roll: -4,
      },
    ],
    beam: {
      position: { x: portal.x, y: 4.25, z: portal.z },
      scale: { x: 1.5, y: 0.18, z: 0.55 },
      tone: portal.tone,
      emissive: true,
    },
    core: {
      position: { x: portal.x, y: 2.2, z: portal.z },
      scale: { x: 0.7, y: 1.6, z: 0.1 },
      tone: portal.tone,
      emissive: true,
      speed: 1.5,
      amount: 0.07,
      phase: index * 1.2,
    },
  }))
}

export function getHeroEmblemSpecs(): {
  base: GraphicSphereSpec
  sun: GraphicSphereSpec
  moon: GraphicSphereSpec
} {
  const z = ARENA_CENTER.z - 12.2
  return {
    base: {
      position: { x: ARENA_CENTER.x, y: 8.15, z },
      scale: { x: 1.6, y: 0.25, z: 0.5 },
      tone: 'pink',
      emissive: true,
      amplitude: 0.25,
      speed: 0.75,
      phase: 0,
    },
    sun: {
      position: { x: ARENA_CENTER.x - 0.8, y: 8.5, z },
      scale: { x: 0.3, y: 0.3, z: 0.3 },
      tone: 'sun',
      emissive: true,
      amplitude: 0.12,
      speed: 1.3,
      phase: 0.4,
    },
    moon: {
      position: { x: ARENA_CENTER.x + 0.8, y: 8.5, z },
      scale: { x: 0.3, y: 0.3, z: 0.3 },
      tone: 'moon',
      emissive: true,
      amplitude: 0.12,
      speed: 1.3,
      phase: 1.0,
    },
  }
}

export function getRailSpecs(): GraphicBoxSpec[] {
  const colors: GraphicTone[] = ['pink', 'violetBright', 'cyan', 'pink']
  const specs: GraphicBoxSpec[] = []
  for (let i = 0; i < 4; i += 1) {
    const x = ARENA_CENTER.x - 4 + i * 2.7
    specs.push({
      position: { x, y: 0.72, z: ARENA_CENTER.z - 3.55 },
      scale: { x: 2.0, y: 0.12, z: 0.12 },
      tone: colors[i]!,
      emissive: true,
    })
    specs.push({
      position: { x, y: 0.72, z: ARENA_CENTER.z + 3.55 },
      scale: { x: 2.0, y: 0.12, z: 0.12 },
      tone: colors[(i + 1) % colors.length]!,
      emissive: true,
    })
  }
  return specs
}

export function getRailCrossSpec(): GraphicBoxSpec & { yaw: number } {
  return {
    position: { x: ARENA_CENTER.x, y: 0.68, z: ARENA_CENTER.z - 3.55 },
    scale: { x: 0.14, y: 0.14, z: 5.2 },
    tone: 'pinkSoft',
    emissive: true,
    yaw: 90,
  }
}

export function getConfettiSpecs(): GraphicSphereSpec[] {
  const colors: GraphicTone[] = ['pink', 'sun', 'cyan', 'violetBright']
  const specs: GraphicSphereSpec[] = []
  for (let i = 0; i < GRAPHICS_CONFETTI_COUNT; i += 1) {
    const localX = 1.5 + (i * 1.17) % 13
    const y = 3.4 + (i % 5) * 0.75
    const localZ = 2.0 + (i * 2.1) % 12
    const position = fromGraphicsSketch(localX, y, localZ)
    if (Math.abs(position.z - ARENA_CENTER.z) < 1.6 && Math.abs(position.x - ARENA_CENTER.x) < 6) {
      position.z += position.z >= ARENA_CENTER.z ? 2.4 : -2.4
    }
    specs.push({
      position,
      scale: { x: 0.08, y: 0.22, z: 0.04 },
      tone: colors[i % colors.length]!,
      emissive: true,
      amplitude: 0.22,
      speed: 0.55 + (i % 4) * 0.12,
      phase: i * 0.43,
    })
  }
  return specs
}

export function isPlayableArenaCell(x: number, z: number): boolean {
  return Math.abs(x - ARENA_CENTER.x) < 2.6 && Math.abs(z - ARENA_CENTER.z) < 2.2
}

export function getDecorativeTileSpecs(): GraphicBoxSpec[] {
  const palette: GraphicTone[] = ['pink', 'violet', 'cyan', 'sun']
  const specs: GraphicBoxSpec[] = []
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const local = fromGraphicsSketch(3.25 + col * 2.35, 0.18, 3.2 + row * 2.35)
      if (isPlayableArenaCell(local.x, local.z)) continue
      specs.push({
        position: local,
        scale: { x: 0.58, y: 0.04, z: 0.58 },
        tone: palette[(row + col) % palette.length]!,
        emissive: true,
      })
    }
  }
  return specs
}

export const GRAPHICS_BUILD_ORDER = [
  'sky',
  'stars',
  'stage',
  'pillars',
  'centerpiece',
  'signage',
  'badges',
  'portals',
  'emblem',
  'rails',
  'confetti',
  'tiles',
] as const

export function collectGraphicsAnchors(): Vec3[] {
  return [
    ...getSkyPanelSpecs().map((item) => item.position),
    ...getCloudSpecs().map((item) => item.position),
    ...getStarSpecs().map((item) => item.position),
    getStageSpecs()[0]!.position,
    ...getPillarSpecs().map((item) => item.column.position),
    getCenterpieceOrb().position,
    getHeroSignBackplate().position,
    getLoopSignBackplate().position,
    ...getTeamBadgeSpecs().map((item) => item.plate.position),
    ...getPortalFrameSpecs().map((item) => item.core.position),
    getHeroEmblemSpecs().base.position,
    ...getRailSpecs().map((item) => item.position),
    ...getConfettiSpecs().map((item) => item.position),
    ...getDecorativeTileSpecs().map((item) => item.position),
  ]
}
