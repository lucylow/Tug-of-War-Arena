import { Entity, Material, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'

import { ARENA_CENTER, type WeatherKind } from '../logic/mapping'
import { fog, withAlpha } from '../palette'
import { createFog, currentWeather, setWeather, startRain, stopWeather } from '../systems/weather'
import { rainCount } from './budgets'

/**
 * Rain facade over the native weather emitter. Counts follow the mobile budget.
 */
export class RainEffect {
  readonly name = 'rain'
  private isActive = false
  private readonly isMobileDevice = isMobile()

  start(intensity: number = 1): void {
    if (this.isActive && currentWeather() === 'rain') return
    this.isActive = true
    startRain(this.isMobileDevice ? intensity * 0.7 : intensity)
  }

  update(_dt: number): void {
    return
  }

  stop(): void {
    this.isActive = false
    if (currentWeather() === 'rain') stopWeather()
  }

  setActive(active: boolean): void {
    if (!active) this.stop()
  }

  setParticleCount(count: number): void {
    if (!this.isActive) return
    const intensity = count <= 0 ? 0 : Math.min(1, count / rainCount(this.isMobileDevice, 'high'))
    if (intensity <= 0) this.stop()
    else startRain(intensity)
  }

  get maxParticles(): number {
    return rainCount(this.isMobileDevice, 'high')
  }

  destroy(): void {
    this.stop()
  }
}

/**
 * Ground-hugging translucent volume. Cheaper than extra fog particles.
 */
export class FogEffect {
  readonly name = 'fog-plane'
  private entity: Entity | null = null
  private isActive = false
  private elapsed = 0
  private readonly isMobileDevice = isMobile()

  create(): void {
    if (this.isActive) return
    this.isActive = true
    this.elapsed = 0
    this.entity = engine.addEntity()
    Transform.create(this.entity, {
      position: Vector3.create(ARENA_CENTER.x, 0.55, ARENA_CENTER.z),
      scale: Vector3.create(25, 0.5, 25),
    })
    MeshRenderer.setBox(this.entity)
    this.paint(0.08)
  }

  update(dt: number): void {
    if (!this.isActive || !this.entity) return
    if (this.isMobileDevice) return
    this.elapsed += dt
    const pulse = 0.05 + 0.03 * Math.sin(this.elapsed * 0.35)
    this.paint(pulse)
  }

  setActive(active: boolean): void {
    if (!active) this.destroy()
  }

  destroy(): void {
    if (this.entity) {
      engine.removeEntity(this.entity)
      this.entity = null
    }
    this.isActive = false
  }

  private paint(alpha: number): void {
    if (!this.entity) return
    Material.setPbrMaterial(this.entity, {
      albedoColor: withAlpha(Color4.create(0.5, 0.5, 0.6, 1), alpha),
      emissiveColor: fog,
      emissiveIntensity: 0.15,
      metallic: 0,
      roughness: 1,
    })
  }
}

export class SnowEffect {
  readonly name = 'snow'
  private isActive = false

  start(intensity: number = 1): void {
    this.isActive = true
    setWeather('snow', intensity)
  }

  stop(): void {
    this.isActive = false
    if (currentWeather() === 'snow') stopWeather()
  }

  setActive(active: boolean): void {
    if (!active) this.stop()
  }

  destroy(): void {
    this.stop()
  }
}

export function syncEnvironmentalVfx(
  kind: WeatherKind,
  intensity: number,
  rain: RainEffect,
  fogPlane: FogEffect,
  snow: SnowEffect,
): void {
  if (kind === 'rain') {
    rain.start(intensity)
    snow.stop()
    fogPlane.destroy()
    return
  }
  if (kind === 'snow') {
    snow.start(intensity)
    rain.stop()
    fogPlane.destroy()
    return
  }
  if (kind === 'fog') {
    createFog(intensity)
    fogPlane.create()
    rain.stop()
    snow.stop()
    return
  }
  rain.stop()
  snow.stop()
  fogPlane.destroy()
}
