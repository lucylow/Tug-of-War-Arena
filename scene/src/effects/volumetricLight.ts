import { Entity, Material, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'

import { ARENA_CENTER } from '../logic/mapping'
import { godRayCount, type QualityBand } from '../logic/visualFx'
import { TRANSPARENCY_ALPHA_BLEND, TRANSPARENCY_OPAQUE } from '../materials'
import { gold, withAlpha } from '../palette'
import { QualityManager } from '../performance/QualityManager'
import { isMobileClient } from '../performance/platform'
import { recordPrimitive } from '../performance/SceneBudgetChecker'

/**
 * Volumetric shafts as emissive cylinders. Do not add LightSource here —
 * the 2×2 parcel already uses the 4-light cap in `systems/lighting.ts`.
 */
export function createGodRay(position: Vector3, _direction: Vector3): Entity {
  const ray = engine.addEntity()
  Transform.create(ray, {
    position,
    scale: Vector3.create(0.45, 9.5, 0.45),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
  })
  MeshRenderer.setCylinder(ray)
  const color = withAlpha(gold, isMobileClient() ? 1 : 0.12)
  Material.setPbrMaterial(ray, {
    albedoColor: color,
    emissiveColor: Color4.create(1, 0.92, 0.7, 1),
    emissiveIntensity: isMobileClient() ? 0.45 : 1.1,
    roughness: 1,
    metallic: 0,
    transparencyMode: isMobileClient() ? TRANSPARENCY_OPAQUE : TRANSPARENCY_ALPHA_BLEND,
  })
  recordPrimitive({ triangles: 32, uniqueMaterial: true })
  return ray
}

export function createArenaGodRays(level?: QualityBand): Entity[] {
  const quality = level ?? QualityManager.getInstance().getLevel()
  const count = godRayCount(quality)
  const rays: Entity[] = []
  const offsets = [
    Vector3.create(ARENA_CENTER.x, 11.5, ARENA_CENTER.z),
    Vector3.create(ARENA_CENTER.x - 3.5, 11.2, ARENA_CENTER.z + 1.5),
    Vector3.create(ARENA_CENTER.x + 3.2, 11.4, ARENA_CENTER.z - 1.2),
  ]
  for (let i = 0; i < count; i += 1) {
    const pos = offsets[i]
    if (!pos) continue
    rays.push(createGodRay(pos, Vector3.create(0, -1, 0)))
  }
  return rays
}

export function pulseGodRays(rays: Entity[], time: number): void {
  for (const ray of rays) {
    if (!Transform.has(ray)) continue
    const transform = Transform.getMutable(ray)
    const pulse = 0.92 + Math.sin(time * 0.7) * 0.08
    transform.scale = Vector3.create(0.45 * pulse, 9.5, 0.45 * pulse)
  }
}
