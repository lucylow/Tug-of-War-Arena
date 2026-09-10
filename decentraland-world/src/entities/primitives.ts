import { Entity, Material, MeshCollider, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'

import { applyMaterial } from '../materials/registry'

export type Vec = { x: number; y: number; z: number }

export function addChild(parent: Entity, position: Vec, scale?: Vec, rotation?: Quaternion): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, {
    parent,
    position: Vector3.create(position.x, position.y, position.z),
    scale: scale ? Vector3.create(scale.x, scale.y, scale.z) : Vector3.create(1, 1, 1),
    rotation: rotation ?? Quaternion.fromEulerDegrees(0, 0, 0),
  })
  return entity
}

export function box(
  parent: Entity | undefined,
  position: Vec,
  scale: Vec,
  material: 'sun' | 'moon' | 'rope' | 'arena' | 'highlight' | 'neutral' | 'glass',
  extras?: { collider?: boolean; intensity?: number },
): Entity {
  const entity = parent ? addChild(parent, position, scale) : engine.addEntity()
  if (!parent) {
    Transform.create(entity, {
      position: Vector3.create(position.x, position.y, position.z),
      scale: Vector3.create(scale.x, scale.y, scale.z),
    })
  }
  MeshRenderer.setBox(entity)
  applyMaterial(entity, material, extras)
  if (extras?.collider) MeshCollider.setBox(entity)
  return entity
}

export function cylinder(
  parent: Entity | undefined,
  position: Vec,
  scale: Vec,
  material: 'sun' | 'moon' | 'rope' | 'arena' | 'highlight' | 'neutral' | 'glass',
  extras?: { collider?: boolean },
): Entity {
  const entity = parent ? addChild(parent, position, scale) : engine.addEntity()
  if (!parent) {
    Transform.create(entity, {
      position: Vector3.create(position.x, position.y, position.z),
      scale: Vector3.create(scale.x, scale.y, scale.z),
    })
  }
  MeshRenderer.setCylinder(entity)
  applyMaterial(entity, material)
  if (extras?.collider) MeshCollider.setCylinder(entity)
  return entity
}

export function sphere(
  parent: Entity | undefined,
  position: Vec,
  scale: Vec,
  material: 'sun' | 'moon' | 'rope' | 'arena' | 'highlight' | 'neutral' | 'glass',
): Entity {
  const entity = parent ? addChild(parent, position, scale) : engine.addEntity()
  if (!parent) {
    Transform.create(entity, {
      position: Vector3.create(position.x, position.y, position.z),
      scale: Vector3.create(scale.x, scale.y, scale.z),
    })
  }
  MeshRenderer.setSphere(entity)
  applyMaterial(entity, material)
  return entity
}

export function tintedBox(position: Vec, scale: Vec, color: Color4, collider = false): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, {
    position: Vector3.create(position.x, position.y, position.z),
    scale: Vector3.create(scale.x, scale.y, scale.z),
  })
  MeshRenderer.setBox(entity)
  Material.setPbrMaterial(entity, {
    albedoColor: color,
    emissiveColor: color,
    emissiveIntensity: 0.7,
    roughness: 0.6,
  })
  if (collider) MeshCollider.setBox(entity)
  return entity
}
