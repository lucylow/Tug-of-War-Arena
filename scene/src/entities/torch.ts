import { Entity, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { MODELS } from '../config'
import { torchFlicker } from '../logic/visualFx'
import { bark, flame, gold, midnight } from '../palette'
import { createFire } from '../effects/fire'
import { attachModelOrFallback, box, cylinder, setEmissiveMaterial, sphere } from './primitives'

export type TorchHandle = {
  root: Entity
  flame: Entity
  seed: number
}

export function createTorch(position: Vector3, seed: number = 0, withFire: boolean = true): TorchHandle {
  const root = engine.addEntity()
  Transform.create(root, {
    position,
    scale: Vector3.create(1, 1, 1),
  })

  let flameEntity = root
  attachModelOrFallback(root, MODELS.torch, () => {
    box(root, { x: 0, y: 0.12, z: 0 }, { x: 0.42, y: 0.24, z: 0.42 }, midnight, { collider: true })
    cylinder(root, { x: 0, y: 1.05, z: 0 }, { x: 0.09, y: 1.05, z: 0.09 }, bark, {
      roughness: 0.82,
      metallic: 0.05,
    })
    flameEntity = sphere(root, { x: 0, y: 2.15, z: 0 }, { x: 0.22, y: 0.32, z: 0.22 }, flame, {
      emissive: gold,
      emissiveIntensity: 1.8,
      roughness: 1,
      metallic: 0,
    })
  })

  if (withFire) {
    createFire(Vector3.create(position.x, position.y + 2.15, position.z), 18)
  }
  return { root, flame: flameEntity, seed }
}

export function animateTorch(torch: TorchHandle, time: number): void {
  const flicker = torchFlicker(time, torch.seed)
  setEmissiveMaterial(torch.flame, flame, 1.1 + flicker, {
    emissive: gold,
    roughness: 1,
    metallic: 0,
  })
}

export function createCornerTorches(center: Vector3, count: number = 4, withFire: boolean = true): TorchHandle[] {
  const offsets = [
    Vector3.create(-8, 0, -8),
    Vector3.create(8, 0, -8),
    Vector3.create(-8, 0, 8),
    Vector3.create(8, 0, 8),
  ]
  return offsets.slice(0, Math.max(0, count)).map((offset, index) =>
    createTorch(Vector3.create(center.x + offset.x, 0, center.z + offset.z), index * 1.7, withFire),
  )
}
