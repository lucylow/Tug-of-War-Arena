/**
 * Applies pooled LOD / occlusion decisions to SDK7 components.
 * Kept separate from `materials/` so that folder stays testable without `@dcl/sdk`.
 */

import { Entity, GltfContainer, Transform, VisibilityComponent, engine } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { MODELS } from '../config'
import { LODSystem, OcclusionCuller, tickMaterials, type CullChange, type LODChange } from '../materials'

let bound = false

function asEntity(id: number | Entity): Entity {
  return id as Entity
}

function asEntityId(entity: Entity): number {
  return entity as unknown as number
}

export function bindMaterialRuntime(): void {
  if (bound) return
  bound = true

  LODSystem.getInstance().onLevelChange(applyLodChange)
  OcclusionCuller.getInstance().onVisibility(applyVisibility)
}

export function resetMaterialRuntime(): void {
  bound = false
}

export function sampleCamera(): { position: { x: number; y: number; z: number }; direction: { x: number; y: number; z: number } } | undefined {
  if (!Transform.has(engine.CameraEntity)) return undefined
  const transform = Transform.get(engine.CameraEntity)
  const direction = Vector3.rotate(Vector3.create(0, 0, 1), transform.rotation ?? Quaternion.create(0, 0, 0, 1))
  return {
    position: { x: transform.position.x, y: transform.position.y, z: transform.position.z },
    direction: { x: direction.x, y: direction.y, z: direction.z },
  }
}

export function syncTrackedTransforms(): void {
  const lod = LODSystem.getInstance()
  const culler = OcclusionCuller.getInstance()

  for (const entity of lod.getRegistered()) {
    if (!Transform.has(asEntity(entity))) continue
    const position = Transform.get(asEntity(entity)).position
    lod.setPosition(entity, position)
  }

  for (const entity of culler.getRegistered()) {
    if (!Transform.has(asEntity(entity))) continue
    const position = Transform.get(asEntity(entity)).position
    culler.setPosition(entity, position)
  }
}

export function tickMaterialSystems(dt: number): void {
  syncTrackedTransforms()
  tickMaterials(dt, sampleCamera())
}

export function registerFlagOptimization(entity: ReturnType<typeof engine.addEntity>, mesh: string): void {
  if (!Transform.has(entity)) return
  const position = Transform.get(entity).position
  const lod = LODSystem.getInstance()
  lod.registerLOD(asEntityId(entity), lod.defaultLevels(mesh, mesh, mesh), position)
  OcclusionCuller.getInstance().register(asEntityId(entity), position, false)
}

export function registerArenaFlags(flags: ReturnType<typeof engine.addEntity>[]): void {
  const meshes = [MODELS.flagSun, MODELS.flagMoon]
  flags.forEach((flag, index) => {
    registerFlagOptimization(flag, meshes[index] ?? MODELS.flagSun)
  })
}

function applyLodChange(change: LODChange): void {
  if (!Transform.has(asEntity(change.entity))) return
  const transform = Transform.getMutable(asEntity(change.entity))
  transform.scale = Vector3.create(change.scale, change.scale, change.scale)
  if (change.mesh && GltfContainer.has(asEntity(change.entity))) {
    GltfContainer.getMutable(asEntity(change.entity)).src = change.mesh
  }
}

function applyVisibility(change: CullChange): void {
  VisibilityComponent.createOrReplace(asEntity(change.entity), { visible: change.visible })
}
