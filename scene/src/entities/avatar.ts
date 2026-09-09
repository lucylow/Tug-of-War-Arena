import { Animator, Entity, GltfContainer, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { MODELS, USE_GLB_ASSETS } from '../config'
import {
  avatarIdleOffset,
  normalizeTeam,
  type AvatarClip,
  type TeamAlias,
  type Vec3,
} from '../logic/mapping'
import { cloud, crewColor, gold, midnight } from '../palette'
import { pbrMaterial } from './primitives'

export type AvatarConfig = {
  team: TeamAlias
  position: Vec3
  scale?: Vec3
  id?: string
}

type AvatarRecord = {
  root: Entity
  team: ReturnType<typeof normalizeTeam>
  index: number
  baseY: number
  clip: AvatarClip
  clipTime: number
}

const avatars = new Map<string, AvatarRecord>()

export function createAvatar(config: AvatarConfig): Entity {
  const team = normalizeTeam(config.team)
  const root = engine.addEntity()
  Transform.create(root, {
    position: Vector3.create(config.position.x, config.position.y, config.position.z),
    rotation: Quaternion.fromEulerDegrees(0, team === 'sun' ? 90 : -90, 0),
    scale: Vector3.create(config.scale?.x ?? 1, config.scale?.y ?? 1, config.scale?.z ?? 1),
  })

  if (USE_GLB_ASSETS) {
    GltfContainer.create(root, {
      src: team === 'sun' ? MODELS.avatarSun : MODELS.avatarMoon,
    })
    Animator.create(root, {
      states: [
        { clip: 'idle', playing: true, loop: true, speed: 0.8, weight: 1 },
        { clip: 'tap', playing: false, loop: false, speed: 1.2, weight: 1 },
        { clip: 'swipe', playing: false, loop: false, speed: 0.8, weight: 1 },
        { clip: 'celebrate', playing: false, loop: false, speed: 1, weight: 1 },
        { clip: 'defeat', playing: false, loop: false, speed: 1, weight: 1 },
      ],
    })
  } else {
    buildPlaceholderAvatar(root, team)
  }

  const id = config.id ?? `avatar-${avatars.size}`
  avatars.set(id, {
    root,
    team,
    index: avatars.size,
    baseY: config.position.y,
    clip: 'idle',
    clipTime: 0,
  })
  return root
}

function buildPlaceholderAvatar(root: Entity, team: ReturnType<typeof normalizeTeam>) {
  const jersey = crewColor(team)

  const body = engine.addEntity()
  Transform.create(body, { parent: root, position: Vector3.create(0, 0.7, 0), scale: Vector3.create(0.42, 0.7, 0.28) })
  MeshRenderer.setCylinder(body)
  pbrMaterial(body, jersey, { roughness: 0.45, emissive: jersey, emissiveIntensity: 0.35, meshKey: 'cylinder' })

  const head = engine.addEntity()
  Transform.create(head, { parent: root, position: Vector3.create(0, 1.55, 0), scale: Vector3.create(0.28, 0.28, 0.28) })
  MeshRenderer.setSphere(head)
  pbrMaterial(head, cloud, { roughness: 0.55, meshKey: 'sphere' })

  const visor = engine.addEntity()
  Transform.create(visor, { parent: root, position: Vector3.create(0, 1.58, 0.12), scale: Vector3.create(0.22, 0.08, 0.08) })
  MeshRenderer.setBox(visor)
  pbrMaterial(visor, gold, { emissive: gold, emissiveIntensity: 1.4, meshKey: 'box' })

  const legs = engine.addEntity()
  Transform.create(legs, { parent: root, position: Vector3.create(0, 0.18, 0), scale: Vector3.create(0.38, 0.22, 0.24) })
  MeshRenderer.setBox(legs)
  pbrMaterial(legs, midnight, { roughness: 0.7, meshKey: 'box' })
}

export function playAvatarAnimation(avatar: Entity, animationName: string, loop: boolean = false): void {
  if (Animator.has(avatar)) {
    Animator.playSingleAnimation(avatar, animationName, true)
    const animator = Animator.getMutable(avatar)
    const state = animator.states.find((item) => item.clip === animationName)
    if (state) state.loop = loop
  }

  for (const record of avatars.values()) {
    if (record.root === avatar) {
      record.clip = (animationName as AvatarClip) ?? 'idle'
      record.clipTime = 0
    }
  }
}

export { getSpawnPosition } from '../logic/mapping'

export function updateAvatars(dt: number, time: number) {
  for (const record of avatars.values()) {
    record.clipTime += dt
    const transform = Transform.getMutable(record.root)
    let y = record.baseY + avatarIdleOffset(time, record.index)
    let scaleY = 1
    if (record.clip === 'tap' || record.clip === 'swipe') {
      scaleY = 1 + Math.sin(Math.min(record.clipTime, 0.35) * Math.PI / 0.35) * 0.12
      if (record.clipTime > 0.35) record.clip = 'idle'
    } else if (record.clip === 'celebrate') {
      y += Math.abs(Math.sin(record.clipTime * 6)) * 0.35
    } else if (record.clip === 'defeat') {
      y -= 0.18
      transform.rotation = Quaternion.fromEulerDegrees(12, record.team === 'sun' ? 90 : -90, 0)
    }
    transform.position = Vector3.create(transform.position.x, y, transform.position.z)
    transform.scale = Vector3.create(1, scaleY, 1)
  }
}

export function avatarsByTeam(team: TeamAlias): Entity[] {
  const crew = normalizeTeam(team)
  return [...avatars.values()].filter((record) => record.team === crew).map((record) => record.root)
}

export function allAvatars() {
  return avatars
}

export { getSpawnPosition } from '../logic/mapping'
