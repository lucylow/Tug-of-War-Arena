import { Entity, Material, MeshCollider, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'

const materials = new Map<string, Color4>()

export function color4(color: { r: number; g: number; b: number; a?: number }): Color4 {
  const key = `${color.r}:${color.g}:${color.b}:${color.a ?? 1}`
  const cached = materials.get(key)
  if (cached) return cached
  const created = Color4.create(color.r, color.g, color.b, color.a ?? 1)
  materials.set(key, created)
  return created
}

export function box(
  position: Vector3,
  scale: Vector3,
  color: { r: number; g: number; b: number; a?: number },
  collider = false,
): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position, scale })
  MeshRenderer.setBox(entity)
  Material.setPbrMaterial(entity, {
    albedoColor: color4(color),
    roughness: 0.72,
    metallic: 0.12,
  })
  if (collider) MeshCollider.setBox(entity)
  return entity
}

export function cylinder(
  position: Vector3,
  scale: Vector3,
  color: { r: number; g: number; b: number; a?: number },
  collider = false,
): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position, scale })
  MeshRenderer.setCylinder(entity)
  Material.setPbrMaterial(entity, {
    albedoColor: color4(color),
    roughness: 0.65,
    metallic: 0.18,
  })
  if (collider) MeshCollider.setCylinder(entity)
  return entity
}

export function sphere(position: Vector3, scale: Vector3, color: { r: number; g: number; b: number; a?: number }): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position, scale })
  MeshRenderer.setSphere(entity)
  Material.setPbrMaterial(entity, {
    albedoColor: color4(color),
    roughness: 0.5,
    metallic: 0.1,
  })
  return entity
}
