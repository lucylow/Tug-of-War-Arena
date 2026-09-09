import { Animator, Entity, Transform, engine } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { MODELS, USE_GLB_ASSETS } from '../config'
import { normalizeTeam, type TeamAlias } from '../logic/mapping'
import { bannerSwayDegrees } from '../logic/visualFx'
import { crewColor, midnight } from '../palette'
import { attachModelOrFallback, box, cylinder, plane } from './primitives'

export type BannerHandle = {
  root: Entity
  cloth: Entity
  team: ReturnType<typeof normalizeTeam>
}

export function createBanner(position: Vector3, team: TeamAlias): BannerHandle {
  const crew = normalizeTeam(team)
  const root = engine.addEntity()
  Transform.create(root, { position, scale: Vector3.create(1, 1, 1) })

  let cloth = root
  const model = crew === 'sun' ? MODELS.bannerSun : MODELS.bannerMoon
  attachModelOrFallback(root, model, () => {
    cylinder(root, { x: 0, y: 2.05, z: 0 }, { x: 0.07, y: 2.05, z: 0.07 }, midnight, {
      metallic: 0.45,
      roughness: 0.28,
    })
    box(root, { x: 0, y: 0.1, z: 0 }, { x: 0.55, y: 0.2, z: 0.55 }, midnight)
    cloth = plane(
      root,
      { x: crew === 'sun' ? -0.7 : 0.7, y: 3.05, z: 0 },
      { x: 1.4, y: 1.1, z: 1 },
      crewColor(crew),
      Quaternion.fromEulerDegrees(0, 90, 0),
    )
  })

  if (USE_GLB_ASSETS) {
    Animator.create(root, {
      states: [
        {
          clip: 'sway',
          playing: true,
          loop: true,
          speed: 0.6,
        },
      ],
    })
  }

  return { root, cloth, team: crew }
}

export function animateBanner(banner: BannerHandle, time: number): void {
  if (USE_GLB_ASSETS || !Transform.has(banner.cloth)) return
  const yaw = 90 + bannerSwayDegrees(time + (banner.team === 'sun' ? 0 : 1.3))
  Transform.getMutable(banner.cloth).rotation = Quaternion.fromEulerDegrees(0, yaw, 6)
}

export function createTeamBanners(center: Vector3): BannerHandle[] {
  return [
    createBanner(Vector3.create(center.x - 11.4, 0, center.z - 4.2), 'sun'),
    createBanner(Vector3.create(center.x + 11.4, 0, center.z + 4.2), 'moon'),
  ]
}
