import { ParticleSystem as DclParticleSystem, ParticleSystemBlendMode } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'

import { ARENA_CENTER } from '../logic/mapping'
import { ParticleSystem, type ParticleConfig } from './ParticleSystem'
import { DUST_COUNT, scaleCount } from './budgets'

/**
 * Low-cost floating dust over the plaza. One box emitter, additive fade.
 */
export class DustParticles extends ParticleSystem {
  constructor() {
    const mobile = isMobile()
    const config: ParticleConfig = {
      count: scaleCount(DUST_COUNT.desktop, DUST_COUNT.mobile, mobile),
      spread: 18,
      lifetime: 10,
      size: 0.08,
      color: Color4.create(0.8, 0.8, 0.9, 0.15),
      gravity: 0.01,
      speed: 0.3,
    }
    super(config, 'dust')
    this.init()
  }

  init(): void {
    this.createEmitter({
      position: Vector3.create(ARENA_CENTER.x, 2.0, ARENA_CENTER.z),
      shape: DclParticleSystem.Shape.Box({
        size: Vector3.create(this.config.spread, 3, this.config.spread * 0.55),
      }),
      rate: this.maxParticles <= 0 ? 0 : this.maxParticles / this.config.lifetime,
      gravity: this.config.gravity,
      initialVelocitySpeed: { start: 0.05, end: this.config.speed },
      initialSize: { start: this.config.size * 0.5, end: this.config.size },
      sizeOverTime: { start: 1, end: 0.35 },
      initialColor: { start: this.config.color, end: Color4.create(0.9, 0.9, 1, 0.08) },
      colorOverTime: {
        start: Color4.create(0.8, 0.8, 0.9, 0.18),
        end: Color4.create(0.8, 0.8, 0.9, 0),
      },
      blendMode: ParticleSystemBlendMode.PSB_ADD,
    })
  }
}
