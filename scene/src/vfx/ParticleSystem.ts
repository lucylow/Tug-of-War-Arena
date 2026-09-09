import {
  Entity,
  ParticleSystem as DclParticleSystem,
  Transform,
  engine,
} from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'

import { ParticleBlend, ParticlePlayback, type ParticleBlendMode } from '../logic/particleEnums'
import { registerQualityParticle } from '../systems/quality'
import { maintainRate, mobileSizeBoost } from './budgets'

export interface ParticleConfig {
  count: number
  spread: number
  lifetime: number
  size: number
  color: Color4
  gravity: number
  speed: number
}

export type NativeShape =
  | ReturnType<typeof DclParticleSystem.Shape.Point>
  | ReturnType<typeof DclParticleSystem.Shape.Box>
  | ReturnType<typeof DclParticleSystem.Shape.Cone>
  | ReturnType<typeof DclParticleSystem.Shape.Sphere>

export type NativeEmitterOptions = {
  position: Vector3
  rotation?: Quaternion
  shape: NativeShape
  rate?: number
  gravity?: number
  initialVelocitySpeed?: { start: number; end: number }
  initialSize?: { start: number; end: number }
  sizeOverTime?: { start: number; end: number }
  initialColor?: { start: Color4; end: Color4 }
  colorOverTime?: { start: Color4; end: Color4 }
  blendMode?: ParticleBlendMode
  loop?: boolean
  billboard?: boolean
  faceTravelDirection?: boolean
  additionalForce?: Vector3
  bursts?: {
    values: Array<{ time: number; count: number; cycles: number; interval: number; probability: number }>
  }
}

/**
 * Base class for arena VFX. Each effect is one SDK ParticleSystem entity
 * (one draw call) instead of a mesh per mote — required for mobile budgets.
 */
export abstract class ParticleSystem {
  readonly name: string = 'particles'
  protected entity: Entity | null = null
  protected config: ParticleConfig
  protected isMobileDevice: boolean
  protected isActive = true
  maxParticles: number

  constructor(config: ParticleConfig, name: string = 'particles') {
    this.name = name
    this.isMobileDevice = isMobile()
    this.config = {
      ...config,
      size: mobileSizeBoost(config.size, this.isMobileDevice),
    }
    this.maxParticles = Math.max(0, Math.floor(config.count))
  }

  abstract init(): void

  update(_dt: number): void {
    if (!this.isActive) return
  }

  setActive(active: boolean): void {
    this.isActive = active
    if (!this.entity || !DclParticleSystem.has(this.entity)) return
    DclParticleSystem.getMutable(this.entity).playbackState = active
      ? ParticlePlayback.PLAYING
      : ParticlePlayback.STOPPED
  }

  setParticleCount(count: number): void {
    const next = Math.max(0, Math.floor(count))
    if (!this.entity || !DclParticleSystem.has(this.entity)) return
    const particle = DclParticleSystem.getMutable(this.entity)
    const playing = particle.playbackState !== ParticlePlayback.STOPPED
    particle.maxParticles = next
    if (particle.loop !== false && (particle.rate ?? 0) > 0) {
      particle.rate = next <= 0 ? 0 : maintainRate(next, this.config.lifetime)
    }
    if (next <= 0) {
      particle.playbackState = ParticlePlayback.STOPPED
    } else if (this.isActive && playing) {
      particle.playbackState = ParticlePlayback.PLAYING
    }
  }

  protected createEmitter(options: NativeEmitterOptions): Entity {
    const entity = engine.addEntity()
    Transform.create(entity, {
      position: options.position,
      rotation: options.rotation ?? Quaternion.fromEulerDegrees(0, 0, 0),
    })
    try {
      DclParticleSystem.create(entity, {
        shape: options.shape,
        rate: options.rate ?? maintainRate(this.maxParticles, this.config.lifetime),
        maxParticles: this.maxParticles,
        lifetime: this.config.lifetime,
        gravity: options.gravity ?? this.config.gravity,
        initialVelocitySpeed: options.initialVelocitySpeed ?? {
          start: this.config.speed * 0.35,
          end: this.config.speed,
        },
        initialSize: options.initialSize ?? {
          start: this.config.size * 0.6,
          end: this.config.size,
        },
        sizeOverTime: options.sizeOverTime ?? { start: 1, end: 0.25 },
        initialColor: options.initialColor ?? { start: this.config.color, end: this.config.color },
        colorOverTime: options.colorOverTime ?? {
          start: this.config.color,
          end: Color4.create(this.config.color.r, this.config.color.g, this.config.color.b, 0),
        },
        blendMode: options.blendMode ?? ParticleBlend.ADD,
        loop: options.loop ?? true,
        billboard: options.billboard ?? true,
        faceTravelDirection: options.faceTravelDirection,
        additionalForce: options.additionalForce,
        bursts: options.bursts,
      })
      registerQualityParticle(entity)
      this.entity = entity
    } catch (error) {
      console.log(`[vfx] ${this.name} emitter unavailable`, error)
    }
    return entity
  }

  protected moveEmitter(position: Vector3): void {
    if (!this.entity || !Transform.has(this.entity)) return
    Transform.getMutable(this.entity).position = position
  }

  protected spawnBurst(position: Vector3, count: number): void {
    if (!this.entity || !DclParticleSystem.has(this.entity)) return
    this.moveEmitter(position)
    const particle = DclParticleSystem.getMutable(this.entity)
    const burstCount = Math.min(this.maxParticles, Math.max(1, Math.floor(count)))
    particle.bursts = {
      values: [{ time: 0, count: burstCount, cycles: 1, interval: 0, probability: 1 }],
    }
    particle.playbackState = ParticlePlayback.PLAYING
  }

  destroy(): void {
    if (this.entity) {
      engine.removeEntity(this.entity)
      this.entity = null
    }
    this.isActive = false
  }
}
