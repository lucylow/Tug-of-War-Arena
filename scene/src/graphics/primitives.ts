import { MeshCollider, MeshRenderer, Transform, engine, type Entity } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

import type { Vec3 } from '../logic/mapping'
import { recordPrimitive } from '../performance/SceneBudgetChecker'
import { applyEmissive, applyPbr, graphicColor, type GraphicColor } from './materials'
import type { GraphicTone } from '../logic/graphicsLayout'

export interface BoxOptions {
  collider?: boolean
  emissive?: boolean
  metallic?: number
  roughness?: number
}

function asVector3(value: Vec3): Vector3 {
  return Vector3.create(value.x, value.y, value.z)
}

function resolveColor(color: GraphicColor | GraphicTone): GraphicColor {
  return typeof color === 'string' ? graphicColor(color) : color
}

export function createBox(
  position: Vec3,
  scale: Vec3,
  color: GraphicColor | GraphicTone,
  options: BoxOptions = {},
): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position: asVector3(position), scale: asVector3(scale) })
  MeshRenderer.setBox(entity)
  const resolved = resolveColor(color)
  if (options.emissive) applyEmissive(entity, resolved)
  else applyPbr(entity, resolved, options.metallic ?? 0.12, options.roughness ?? 0.48)
  if (options.collider) MeshCollider.setBox(entity)
  recordPrimitive({ triangles: 12, collider: options.collider })
  return entity
}

export function createSphere(
  position: Vec3,
  scale: Vec3,
  color: GraphicColor | GraphicTone,
  emissive = false,
): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position: asVector3(position), scale: asVector3(scale) })
  MeshRenderer.setSphere(entity)
  const resolved = resolveColor(color)
  if (emissive) applyEmissive(entity, resolved)
  else applyPbr(entity, resolved, 0.08, 0.5)
  recordPrimitive({ triangles: 48 })
  return entity
}

export function createRotatedBox(
  position: Vec3,
  scale: Vec3,
  rotation: Quaternion,
  color: GraphicColor | GraphicTone,
  emissive = false,
): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position: asVector3(position), scale: asVector3(scale), rotation })
  MeshRenderer.setBox(entity)
  const resolved = resolveColor(color)
  if (emissive) applyEmissive(entity, resolved)
  else applyPbr(entity, resolved, 0.14, 0.44)
  recordPrimitive({ triangles: 12 })
  return entity
}
