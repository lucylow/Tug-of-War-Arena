import { Entity, Transform, engine } from '@dcl/sdk/ecs'

export type TemporaryKind = 'reaction' | 'confetti' | 'effect' | 'label'

type Item = { entity: Entity; expiresAt: number; kind: TemporaryKind }

const items: Item[] = []

export function registerTemporaryEntity(entity: Entity, ttlMs: number, kind: TemporaryKind, now = Date.now()): void {
  items.push({ entity, expiresAt: now + Math.max(200, ttlMs), kind })
}

export function removeTemporaryEntity(entity: Entity): void {
  const index = items.findIndex((item) => item.entity === entity)
  if (index >= 0) {
    try {
      engine.removeEntity(entity)
    } catch {
      // Already gone.
    }
    items.splice(index, 1)
  }
}

export function removeExpiredEntities(now = Date.now()): void {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i]
    if (!item || item.expiresAt > now) continue
    try {
      engine.removeEntity(item.entity)
    } catch {
      // Ignore.
    }
    items.splice(i, 1)
  }
}

export function getTemporaryEntityCount(): number {
  return items.length
}

export function clearTemporaryEntities(): void {
  for (const item of items) {
    try {
      engine.removeEntity(item.entity)
    } catch {
      // Ignore.
    }
  }
  items.length = 0
}

export function fadeTemporary(now = Date.now()): void {
  for (const item of items) {
    if (!Transform.has(item.entity)) continue
    const remaining = item.expiresAt - now
    if (remaining < 400) {
      const transform = Transform.getMutable(entitySafe(item.entity))
      transform.scale.y *= 0.92
    }
  }
}

function entitySafe(entity: Entity): Entity {
  return entity
}
