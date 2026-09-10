import { Material, type Entity } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'

import { cloud, friendzone, gold, governance, midnight, moon, sky, sun } from '../palette'

type Key = 'sun' | 'moon' | 'rope' | 'arena' | 'highlight' | 'neutral' | 'glass'

const cache = new Map<Key, { albedo: Color4; emissive: Color4; intensity: number }>()

function def(key: Key, albedo: Color4, emissive: Color4, intensity: number) {
  if (!cache.has(key)) cache.set(key, { albedo, emissive, intensity })
  return cache.get(key)!
}

export const materials = {
  sun: () => def('sun', sun, sun, 1.1),
  moon: () => def('moon', moon, moon, 1.1),
  rope: () => def('rope', cloud, gold, 0.45),
  arena: () => def('arena', midnight, friendzone, 0.35),
  highlight: () => def('highlight', gold, gold, 1.6),
  neutral: () => def('neutral', sky, sky, 0.25),
  glass: () => def('glass', Color4.create(0.8, 0.9, 1, 0.35), cloud, 0.2),
}

export function applyMaterial(entity: Entity, key: Key, extras?: { intensity?: number }): void {
  const spec = materials[key]()
  Material.setPbrMaterial(entity, {
    albedoColor: spec.albedo,
    emissiveColor: spec.emissive,
    emissiveIntensity: extras?.intensity ?? spec.intensity,
    metallic: key === 'rope' ? 0.2 : 0.12,
    roughness: key === 'glass' ? 0.15 : 0.62,
  })
}
