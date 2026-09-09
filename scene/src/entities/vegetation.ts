import { Entity, Transform, engine } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { MODELS } from '../config'
import { ARENA_CENTER } from '../logic/mapping'
import {
  scatterVegetation as layoutVegetation,
  vegetationBudget,
  type QualityBand,
  type VegetationPlacement,
} from '../logic/visualFx'
import { LODSystem } from '../materials'
import { bark, canopy, moss, stone } from '../palette'
import { QualityManager } from '../performance/QualityManager'
import { attachModelOrFallback, box, cylinder, sphere } from './primitives'

export type VegetationHandle = {
  root: Entity
  props: Entity[]
}

export function scatterVegetationEntities(level?: QualityBand): VegetationHandle {
  const quality = level ?? QualityManager.getInstance().getLevel()
  const budget = vegetationBudget(quality)
  const placements = layoutVegetation({
    ...budget,
    spread: 26,
    keepout: 11,
    seed: 42,
    center: ARENA_CENTER,
  })

  const root = engine.addEntity()
  Transform.create(root, { position: Vector3.create(ARENA_CENTER.x, 0, ARENA_CENTER.z) })

  const props = placements.map((placement) => spawnPlant(root, placement))
  return { root, props }
}

function spawnPlant(parent: Entity, placement: VegetationPlacement): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, {
    parent,
    position: Vector3.create(
      placement.position.x - ARENA_CENTER.x,
      placement.position.y,
      placement.position.z - ARENA_CENTER.z,
    ),
    scale: Vector3.create(placement.scale.x, placement.scale.y, placement.scale.z),
    rotation: Quaternion.fromEulerDegrees(0, placement.yaw, 0),
  })

  const model =
    placement.kind === 'grass' ? MODELS.grass : placement.kind === 'rock' ? MODELS.rock : MODELS.tree

  attachModelOrFallback(entity, model, () => {
    if (placement.kind === 'grass') {
      box(entity, { x: 0, y: 0.18, z: 0 }, { x: 0.55, y: 0.36, z: 0.18 }, moss)
      box(entity, { x: 0.12, y: 0.22, z: 0.08 }, { x: 0.18, y: 0.44, z: 0.12 }, canopy)
    } else if (placement.kind === 'rock') {
      sphere(entity, { x: 0, y: 0.18, z: 0 }, { x: 0.45, y: 0.28, z: 0.38 }, stone, {
        roughness: 0.9,
        metallic: 0.05,
      })
    } else {
      cylinder(entity, { x: 0, y: 0.7, z: 0 }, { x: 0.16, y: 0.7, z: 0.16 }, bark, { roughness: 0.88 })
      sphere(entity, { x: 0, y: 1.55, z: 0 }, { x: 0.7, y: 0.55, z: 0.7 }, canopy, { roughness: 0.85 })
    }
  })

  LODSystem.getInstance().registerLOD(
    entity,
    LODSystem.getInstance().defaultLevels(model),
    placement.position,
    placement.scale,
  )
  return entity
}

export function scatterVegetation(): VegetationHandle {
  return scatterVegetationEntities()
}
