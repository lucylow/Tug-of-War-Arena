import { LightSource, ParticleSystem, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { ParticlePlayback } from '../logic/particleEnums'

import type { QualitySettings } from '../performance/QualityManager'
import { QualityManager } from '../performance/QualityManager'
import { currentWeather, setWeather } from './weather'
import { session } from './session'

type ParticleHandle = { entity: ReturnType<typeof engine.addEntity>; originalMax: number }
type LightHandle = { entity: ReturnType<typeof engine.addEntity>; originalShadow: boolean; originalIntensity: number }

const particleHandles: ParticleHandle[] = []
const lightHandles: LightHandle[] = []
let bloomEntity: ReturnType<typeof engine.addEntity> | null = null
const bloomScale = Vector3.create(1.4, 1.4, 1.4)
let bound = false

export function registerQualityParticle(entity: ReturnType<typeof engine.addEntity>): void {
  if (!ParticleSystem.has(entity)) return
  const maxParticles = ParticleSystem.get(entity).maxParticles ?? 0
  particleHandles.push({ entity, originalMax: maxParticles })
}

export function registerQualityLight(
  entity: ReturnType<typeof engine.addEntity>,
  originalShadow: boolean,
  originalIntensity: number,
): void {
  lightHandles.push({ entity, originalShadow, originalIntensity })
}

export function registerQualityBloom(entity: ReturnType<typeof engine.addEntity>): void {
  bloomEntity = entity
}

export function applySceneQuality(settings: QualitySettings): void {
  for (const handle of particleHandles) {
    try {
      if (!ParticleSystem.has(handle.entity)) continue
      const particle = ParticleSystem.getMutable(handle.entity)
      const nextMax = Math.min(handle.originalMax, settings.particleCount)
      particle.maxParticles = nextMax
      if (settings.particleCount <= 0) {
        particle.playbackState = ParticlePlayback.STOPPED
      }
    } catch {
      continue
    }
  }

  for (const handle of lightHandles) {
    try {
      if (!LightSource.has(handle.entity)) continue
      const light = LightSource.getMutable(handle.entity)
      light.shadow = settings.shadowsEnabled && handle.originalShadow
      light.intensity = handle.originalIntensity * settings.lightIntensityScale
    } catch {
      continue
    }
  }

  if (bloomEntity && Transform.has(bloomEntity)) {
    try {
      Transform.getMutable(bloomEntity).scale = settings.postProcessing ? bloomScale : Vector3.create(0.01, 0.01, 0.01)
    } catch {
      // Bloom entity may have been removed after a context restore.
    }
  }

  try {
    const weather = currentWeather()
    const intensity = session.state.weatherIntensity * settings.weatherIntensity
    setWeather(weather, intensity)
  } catch {
    // Weather systems are optional on low-end explorers.
  }
}

export function bindQualityApplicator(): void {
  if (bound) return
  bound = true
  QualityManager.getInstance().onQualityChange((_level, settings) => {
    applySceneQuality(settings)
  })
}

export function applyCurrentQuality(): void {
  applySceneQuality(QualityManager.getInstance().getSettings())
}

export function resetQualityApplicator(): void {
  particleHandles.length = 0
  lightHandles.length = 0
  bloomEntity = null
  bound = false
}
