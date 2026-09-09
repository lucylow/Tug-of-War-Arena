import { Billboard, Entity, TextShape, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'

import { addAmbientMotion } from '../systems/ambient'
import { setupInteraction } from '../systems/interaction'
import { POINTER_MAX_DISTANCE } from '../logic/mobileRuntime'
import { emitWorldEvent } from '../systems/messageBus'
import { cloud, gold, midnight, moon, sun } from '../palette'
import { box, sphere } from '../entities/primitives'
import { SceneErrorHandler } from '../systems/errorHandling'
import { MAX_EVENTS, MAX_QUESTS, MAX_ROOMS_ON_BOARD, MAX_VISIBLE_PLAYERS } from './constants'
import { formatEventBoard, formatRoomDiscoveryBoard, formatScoreboardText } from './boards'
import type { HybridWorldDataset, WorldEventDemo, WorldMissionDemo, WorldPlayerDemo, WorldPortalDemo } from './types'

export const HYBRID_3D_COLORS = {
  sun,
  moon,
  white: cloud,
  gold,
  dark: midnight,
  purple: Color4.create(0.51, 0.28, 0.9, 1),
}

export type HybridAvatarInput = WorldPlayerDemo

let scoreboardText: Entity | null = null

export function hybridBox(
  position: ReturnType<typeof Vector3.create>,
  scale: ReturnType<typeof Vector3.create>,
  color: Color4,
  collider = false,
): Entity {
  return box(undefined, position, scale, color, {
    emissive: color,
    emissiveIntensity: 0.7,
    collider,
  })
}

export function hybridSphere(
  position: ReturnType<typeof Vector3.create>,
  scale: ReturnType<typeof Vector3.create>,
  color: Color4,
): Entity {
  return sphere(undefined, position, scale, color, {
    emissive: color,
    emissiveIntensity: 1.1,
  })
}

export function hybridLabel(
  text: string,
  position: ReturnType<typeof Vector3.create>,
  fontSize: number,
  color: Color4,
): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position })
  TextShape.create(entity, { text, fontSize, textColor: color })
  Billboard.create(entity)
  return entity
}

export function createHybridAvatar(player: HybridAvatarInput): Entity {
  const color = player.team === 'sun' ? HYBRID_3D_COLORS.sun : HYBRID_3D_COLORS.moon
  const avatar = hybridSphere(
    Vector3.create(player.spawn.x, player.spawn.y, player.spawn.z),
    Vector3.create(0.42, 0.72, 0.42),
    color,
  )
  addAmbientMotion(avatar, 0.06, 0.55, (player.avatarHue * Math.PI) / 180, player.spawn.y)
  hybridLabel(
    `${player.displayName}\n${player.presence.toUpperCase()} · L${player.level}`,
    Vector3.create(player.spawn.x, 1.75, player.spawn.z),
    0.19,
    HYBRID_3D_COLORS.white,
  )
  return avatar
}

function createEventPedestal(event: WorldEventDemo): Entity {
  const pedestal = hybridBox(
    Vector3.create(event.position.x, event.position.y, event.position.z),
    Vector3.create(1.8, 0.35, 1.2),
    HYBRID_3D_COLORS.purple,
  )
  hybridLabel(
    `${event.title}\n${event.kind.toUpperCase()} · ${event.startsInMinutes}m`,
    Vector3.create(event.position.x, event.position.y + 0.9, event.position.z),
    0.18,
    HYBRID_3D_COLORS.white,
  )
  return pedestal
}

function createQuestMarker(quest: WorldMissionDemo): void {
  const progress = Math.min(1, quest.progress / Math.max(1, quest.target))
  hybridBox(
    Vector3.create(quest.position.x, quest.position.y, quest.position.z),
    Vector3.create(2.3, 0.22, 0.8),
    HYBRID_3D_COLORS.dark,
  )
  hybridBox(
    Vector3.create(
      quest.position.x - 1.05 + progress * 1.05,
      quest.position.y + 0.02,
      quest.position.z - 0.02,
    ),
    Vector3.create(Math.max(0.08, 2.1 * progress), 0.18, 0.62),
    HYBRID_3D_COLORS.gold,
  )
  hybridLabel(
    `${quest.title}\n${quest.progress}/${quest.target}`,
    Vector3.create(quest.position.x, quest.position.y + 0.7, quest.position.z),
    0.16,
    HYBRID_3D_COLORS.white,
  )
}

function createDataPortal(prop: WorldPortalDemo): Entity {
  const color =
    prop.target === 'arena' ? sun : prop.target === 'governance' ? gold : prop.target === 'rooms' ? HYBRID_3D_COLORS.purple : moon
  const portal = hybridBox(
    Vector3.create(prop.position.x, prop.position.y + 1.65, prop.position.z),
    Vector3.create(2.1, 3.3, 0.3),
    color,
    true,
  )
  hybridLabel(prop.title, Vector3.create(prop.position.x, prop.position.y + 3.5, prop.position.z), 0.2, cloud)
  setupInteraction(
    portal,
    () => {
      if (prop.target === 'arena') emitWorldEvent({ type: 'pull', amount: 1 })
      else if (prop.target === 'rooms') emitWorldEvent({ type: 'reaction', emoji: '🚪', from: prop.title })
      else if (prop.target === 'governance') emitWorldEvent({ type: 'reaction', emoji: '🏛', from: prop.title })
      else emitWorldEvent({ type: 'reaction', emoji: '📱', from: prop.title })
    },
    prop.title,
    POINTER_MAX_DISTANCE,
  )
  return portal
}

function createTextBoard(title: string, body: string, position: { x: number; y: number; z: number }): Entity {
  const root = engine.addEntity()
  Transform.create(root, { position: Vector3.create(position.x, position.y, position.z) })
  box(root, { x: 0, y: 1.7, z: 0 }, { x: 4.4, y: 3.1, z: 0.14 }, midnight, { roughness: 0.7, collider: true })
  box(root, { x: 0, y: 3.3, z: 0 }, { x: 4.5, y: 0.1, z: 0.18 }, gold, { emissive: gold, emissiveIntensity: 1.1 })
  const text = engine.addEntity()
  Transform.create(text, { parent: root, position: Vector3.create(0, 2.05, 0.12) })
  TextShape.create(text, { text: `${title}\n${body}`, fontSize: 0.95, textColor: cloud })
  Billboard.create(text)
  return text
}

export function updateHybridScoreboard(dataset: HybridWorldDataset): void {
  if (!scoreboardText) return
  try {
    TextShape.getMutable(scoreboardText).text = formatScoreboardText(dataset.scoreboard)
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('Hybrid scoreboard update failed', error)
  }
}

export function assembleHybridWorld(dataset: HybridWorldDataset): void {
  const place = (label: string, run: () => void) => {
    try {
      run()
    } catch (error) {
      SceneErrorHandler.getInstance().recordFault(label, error)
    }
  }

  dataset.players.slice(0, MAX_VISIBLE_PLAYERS).forEach((player) => {
    place(`Hybrid avatar ${player.displayName}`, () => {
      createHybridAvatar(player)
    })
  })

  dataset.events.slice(0, MAX_EVENTS).forEach((event) => {
    place(`Hybrid event ${event.title}`, () => {
      createEventPedestal(event)
    })
  })

  dataset.missions.slice(0, MAX_QUESTS).forEach((mission) => {
    place(`Hybrid mission ${mission.title}`, () => {
      createQuestMarker(mission)
    })
  })

  dataset.portals.forEach((portal) => {
    place(`Hybrid portal ${portal.title}`, () => {
      createDataPortal(portal)
    })
  })

  place('Hybrid scoreboard', () => {
    scoreboardText = createTextBoard(
      'ARENA SCOREBOARD',
      formatScoreboardText(dataset.scoreboard),
      { x: 16, y: 0, z: 13.2 },
    )
  })

  place('Hybrid room discovery', () => {
    createTextBoard('ROOM DISCOVERY', formatRoomDiscoveryBoard(dataset.rooms.slice(0, MAX_ROOMS_ON_BOARD)), {
      x: 9.4,
      y: 0,
      z: 27.2,
    })
  })

  place('Hybrid event board', () => {
    createTextBoard('UPCOMING EVENTS', formatEventBoard(dataset.events.slice(0, MAX_EVENTS)), {
      x: 22.6,
      y: 0,
      z: 27.2,
    })
  })
}
