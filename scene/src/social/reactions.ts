import { Billboard, Entity, TextShape, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import {
  MAX_LIVE_REACTIONS,
  REACTION_LIFETIME,
  formatReactionText,
  reactionOrigin,
  reactionPose,
} from '../logic/reactions'
import { gold, withAlpha } from '../palette'

type LiveReaction = {
  entity: Entity
  age: number
  origin: { x: number; y: number; z: number }
}

const live: LiveReaction[] = []

export function spawnWorldReaction(emoji: string, from?: string): Entity {
  while (live.length >= MAX_LIVE_REACTIONS) {
    const oldest = live.shift()
    if (oldest) engine.removeEntity(oldest.entity)
  }

  const origin = reactionOrigin(live.length)
  const entity = engine.addEntity()
  Transform.create(entity, {
    position: Vector3.create(origin.x, origin.y, origin.z),
  })
  TextShape.create(entity, {
    text: formatReactionText(emoji, from),
    fontSize: 2.1,
    textColor: gold,
  })
  Billboard.create(entity)
  live.push({ entity, age: 0, origin })
  return entity
}

export function tickWorldReactions(dt: number): void {
  for (let i = live.length - 1; i >= 0; i -= 1) {
    const item = live[i]
    if (!item) continue
    item.age += dt
    const pose = reactionPose(item.age, item.origin, REACTION_LIFETIME)
    if (!pose.alive) {
      engine.removeEntity(item.entity)
      live.splice(i, 1)
      continue
    }
    const transform = Transform.getMutable(item.entity)
    transform.position = Vector3.create(pose.position.x, pose.position.y, pose.position.z)
    transform.scale = Vector3.create(pose.scale, pose.scale, pose.scale)
    if (TextShape.has(item.entity)) {
      TextShape.getMutable(item.entity).textColor = withAlpha(gold, 1 - pose.t * 0.85)
    }
  }
}

export function liveReactionCount(): number {
  return live.length
}
