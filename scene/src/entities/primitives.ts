import { Entity, GltfContainer, Material, MeshCollider, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'

import { USE_GLB_ASSETS } from '../config'
import { DrawCallBatcher, MaterialPool, type MeshKey, type PooledMaterial } from '../materials'
import { recordPrimitive } from '../performance/SceneBudgetChecker'
import { SceneErrorHandler } from '../systems/errorHandling'

export type Vec = { x: number; y: number; z: number }

export type PbrExtras = {
  metallic?: number
  roughness?: number
  emissive?: Color4
  emissiveIntensity?: number
  transparencyMode?: number
  meshKey?: MeshKey | string
}

export function vec3(v: Vec) {
  return Vector3.create(v.x, v.y, v.z)
}

export function addChild(parent: Entity, position: Vec, scale?: Vec, rotation?: Quaternion): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, {
    parent,
    position: vec3(position),
    scale: scale ? vec3(scale) : Vector3.create(1, 1, 1),
    rotation: rotation ?? Quaternion.fromEulerDegrees(0, 0, 0),
  })
  return entity
}

function asColor4(color: { r: number; g: number; b: number; a?: number } | undefined, fallback: Color4): Color4 {
  if (!color) return fallback
  return Color4.create(color.r, color.g, color.b, color.a ?? 1)
}

export function pbrMaterial(entity: Entity, color: Color4, extras: PbrExtras = {}): PooledMaterial {
  const pooled = MaterialPool.getInstance().getColoredMaterial(color, extras.roughness ?? 0.72, extras.metallic ?? 0.12, {
    emissiveColor: extras.emissive,
    emissiveIntensity: extras.emissiveIntensity ?? 0,
  })

  const pbr = {
    albedoColor: asColor4(pooled.config.albedoColor, color),
    metallic: pooled.config.metallic ?? extras.metallic ?? 0.12,
    roughness: pooled.config.roughness ?? extras.roughness ?? 0.72,
    emissiveColor: asColor4(pooled.config.emissiveColor, extras.emissive ?? Color4.create(0, 0, 0, 1)),
    emissiveIntensity: pooled.config.emissiveIntensity ?? extras.emissiveIntensity ?? 0,
    ...(extras.transparencyMode !== undefined ? { transparencyMode: extras.transparencyMode } : {}),
  }
  Material.setPbrMaterial(entity, pbr)

  DrawCallBatcher.getInstance().registerEntity(entity, pooled.key, extras.meshKey ?? 'mesh')
  return pooled
}

/** Unique-per-frame emissive writes. Do not pool these; intensity is animated. */
export function setEmissiveMaterial(entity: Entity, color: Color4, intensity: number, extras: PbrExtras = {}): void {
  Material.setPbrMaterial(entity, {
    albedoColor: color,
    emissiveColor: extras.emissive ?? color,
    emissiveIntensity: intensity,
    metallic: extras.metallic ?? 0.2,
    roughness: extras.roughness ?? 0.35,
    transparencyMode: extras.transparencyMode,
  })
}

export function box(
  parent: Entity | undefined,
  position: Vec,
  scale: Vec,
  color: Color4,
  extras?: PbrExtras & { collider?: boolean },
): Entity {
  const entity = parent ? addChild(parent, position, scale) : engine.addEntity()
  if (!parent) {
    Transform.create(entity, { position: vec3(position), scale: vec3(scale) })
  }
  MeshRenderer.setBox(entity)
  const pooled = pbrMaterial(entity, color, { ...extras, meshKey: 'box' })
  if (extras?.collider) MeshCollider.setBox(entity)
  recordPrimitive({ triangles: 12, collider: extras?.collider, uniqueMaterial: !pooled.reused })
  return entity
}

export function sphere(
  parent: Entity | undefined,
  position: Vec,
  scale: Vec,
  color: Color4,
  extras?: PbrExtras,
): Entity {
  const entity = parent ? addChild(parent, position, scale) : engine.addEntity()
  if (!parent) {
    Transform.create(entity, { position: vec3(position), scale: vec3(scale) })
  }
  MeshRenderer.setSphere(entity)
  const pooled = pbrMaterial(entity, color, { ...extras, meshKey: 'sphere' })
  recordPrimitive({ triangles: 48, uniqueMaterial: !pooled.reused })
  return entity
}

export function cylinder(
  parent: Entity | undefined,
  position: Vec,
  scale: Vec,
  color: Color4,
  extras?: PbrExtras & { top?: number; bottom?: number; collider?: boolean },
): Entity {
  const entity = parent ? addChild(parent, position, scale) : engine.addEntity()
  if (!parent) {
    Transform.create(entity, { position: vec3(position), scale: vec3(scale) })
  }
  MeshRenderer.setCylinder(entity, extras?.top ?? 1, extras?.bottom ?? 1)
  const pooled = pbrMaterial(entity, color, { ...extras, meshKey: 'cylinder' })
  if (extras?.collider) MeshCollider.setCylinder(entity, extras.top ?? 1, extras.bottom ?? 1)
  recordPrimitive({ triangles: 32, collider: extras?.collider, uniqueMaterial: !pooled.reused })
  return entity
}

export function plane(
  parent: Entity | undefined,
  position: Vec,
  scale: Vec,
  color: Color4,
  rotation?: Quaternion,
): Entity {
  const entity = parent ? addChild(parent, position, scale, rotation) : engine.addEntity()
  if (!parent) {
    Transform.create(entity, {
      position: vec3(position),
      scale: vec3(scale),
      rotation: rotation ?? Quaternion.fromEulerDegrees(0, 0, 0),
    })
  }
  MeshRenderer.setPlane(entity)
  const pooled = pbrMaterial(entity, color, { meshKey: 'plane' })
  recordPrimitive({ triangles: 2, uniqueMaterial: !pooled.reused })
  return entity
}

export function attachModelOrFallback(entity: Entity, src: string, fallback: () => void) {
  if (USE_GLB_ASSETS) {
    try {
      GltfContainer.create(entity, { src })
      recordPrimitive({ triangles: 4000, textures: 1 })
      DrawCallBatcher.getInstance().registerEntity(entity, src, 'gltf')
      return
    } catch (error) {
      SceneErrorHandler.getInstance().recordAssetFailure(src, error)
    }
  }
  fallback()
}
