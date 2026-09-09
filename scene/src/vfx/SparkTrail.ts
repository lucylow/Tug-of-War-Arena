import { ParticleSystem as DclParticleSystem } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'

import { ARENA_CENTER } from '../logic/mapping'
import { ParticleBlend, ParticlePlayback } from '../logic/particleEnums'
import { gold } from '../palette'
import { ParticleSystem, type ParticleConfig } from './ParticleSystem'
import { SPARK_COUNT, scaleCount } from './budgets'

/**
 * Short-lived sparks that follow a moving point (rope knot, pull taps).
 */
export class SparkTrail extends ParticleSystem {
  private idleTimer = 0
  private readonly idleAfter = 0.18

  constructor(color: Color4 = Color4.create(1, 0.8, 0.2, 1)) {
    const mobile = isMobile()
    const config: ParticleConfig = {
      count: scaleCount(SPARK_COUNT.desktop, SPARK_COUNT.mobile, mobile),
      spread: 0.4,
      lifetime: mobile ? 0.28 : 0.4,
      size: mobile ? 0.04 : 0.06,
      color,
      gravity: 0.8,
      speed: 1.8,
    }
    super(config, 'sparks')
    this.init()
  }

  init(): void {
    this.createEmitter({
      position: Vector3.create(ARENA_CENTER.x, 1.55, ARENA_CENTER.z),
      shape: DclParticleSystem.Shape.Sphere({ radius: 0.12 }),
      rate: 0,
      gravity: this.config.gravity,
      initialVelocitySpeed: { start: 0.4, end: this.config.speed },
      initialSize: { start: this.config.size, end: this.config.size * 1.4 },
      sizeOverTime: { start: 1, end: 0.1 },
      initialColor: { start: this.config.color, end: gold },
      colorOverTime: {
        start: Color4.create(this.config.color.r, this.config.color.g, this.config.color.b, 0.95),
        end: Color4.create(this.config.color.r, this.config.color.g, this.config.color.b, 0),
      },
      blendMode: ParticleBlend.ADD,
      loop: true,
    })
    if (this.entity && DclParticleSystem.has(this.entity)) {
      const particle = DclParticleSystem.getMutable(this.entity)
      particle.rate = 0
      particle.playbackState = ParticlePlayback.STOPPED
    }
  }

  emit(position: Vector3): void {
    if (!this.isActive || this.maxParticles <= 0) return
    this.idleTimer = 0
    this.moveEmitter(position)
    if (!this.entity || !DclParticleSystem.has(this.entity)) return
    const particle = DclParticleSystem.getMutable(this.entity)
    particle.rate = this.isMobileDevice ? 14 : 22
    particle.playbackState = ParticlePlayback.PLAYING
    this.spawnBurst(position, this.isMobileDevice ? 3 : 6)
  }

  update(dt: number): void {
    if (!this.isActive || !this.entity || !DclParticleSystem.has(this.entity)) return
    this.idleTimer += dt
    if (this.idleTimer > this.idleAfter) {
      const particle = DclParticleSystem.getMutable(this.entity)
      particle.rate = 0
      particle.playbackState = ParticlePlayback.STOPPED
    }
  }

  setActive(active: boolean): void {
    this.isActive = active
    if (active || !this.entity || !DclParticleSystem.has(this.entity)) return
    const particle = DclParticleSystem.getMutable(this.entity)
    particle.rate = 0
    particle.playbackState = ParticlePlayback.STOPPED
  }
}

export { SparkTrail as TrailParticles }
