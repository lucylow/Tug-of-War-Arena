import { ParticleSystem as DclParticleSystem, ParticleSystemBlendMode } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'

import { ARENA_CENTER } from '../logic/mapping'
import { ParticleSystem, type ParticleConfig } from './ParticleSystem'
import { FIREFLY_COUNT, scaleCount } from './budgets'

/**
 * Warm drifting glow motes. Disabled on mobile via VFXOptimizer.
 */
export class FireflyParticles extends ParticleSystem {
  constructor() {
    const mobile = isMobile()
    const config: ParticleConfig = {
      count: scaleCount(FIREFLY_COUNT.desktop, FIREFLY_COUNT.mobile, mobile),
      spread: 14,
      lifetime: 15,
      size: 0.12,
      color: Color4.create(1, 1, 0.6, 0.8),
      gravity: 0,
      speed: 0.5,
    }
    super(config, 'fireflies')
    this.init()
  }

  init(): void {
    this.createEmitter({
      position: Vector3.create(ARENA_CENTER.x, 1.6, ARENA_CENTER.z),
      shape: DclParticleSystem.Shape.Box({
        size: Vector3.create(this.config.spread, 2.2, this.config.spread),
      }),
      rate: this.maxParticles <= 0 ? 0 : this.maxParticles / this.config.lifetime,
      gravity: 0,
      initialVelocitySpeed: { start: 0.08, end: this.config.speed },
      initialSize: { start: this.config.size * 0.45, end: this.config.size },
      sizeOverTime: { start: 0.7, end: 0.2 },
      initialColor: { start: this.config.color, end: Color4.create(1, 0.85, 0.35, 0.6) },
      colorOverTime: {
        start: Color4.create(1, 1, 0.6, 0.85),
        end: Color4.create(1, 0.8, 0.2, 0),
      },
      blendMode: ParticleSystemBlendMode.PSB_ADD,
    })
  }
}
