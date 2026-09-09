import { ParticleSystem as DclParticleSystem, ParticleSystemBlendMode, ParticleSystemPlaybackState } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'

import { ARENA_CENTER } from '../logic/mapping'
import { gold, mint, moon, sun } from '../palette'
import { ParticleSystem, type ParticleConfig } from './ParticleSystem'
import { CONFETTI_COUNT, confettiPieceCount } from './budgets'

const DEFAULT_COLORS = [
  Color4.create(1, 0.2, 0.2, 1),
  Color4.create(1, 0.8, 0.2, 1),
  Color4.create(0.2, 0.6, 1, 1),
  Color4.create(0.2, 1, 0.4, 1),
  Color4.create(1, 0.4, 0.8, 1),
]

/**
 * One-shot celebration burst. Native particles keep the draw call at 1.
 */
export class ConfettiEffect extends ParticleSystem {
  private playing = false
  private elapsed = 0
  private duration = 2.4
  private onComplete: (() => void) | null = null
  private readonly colors: Color4[]

  constructor(colors?: Color4[]) {
    const mobile = isMobile()
    const config: ParticleConfig = {
      count: mobile ? CONFETTI_COUNT.mobile : CONFETTI_COUNT.desktop,
      spread: 4,
      lifetime: 2.2,
      size: 0.08,
      color: gold,
      gravity: 0.55,
      speed: 4,
    }
    super(config, 'confetti')
    this.colors = colors && colors.length > 0 ? colors : DEFAULT_COLORS
    this.init()
    if (this.entity && DclParticleSystem.has(this.entity)) {
      DclParticleSystem.getMutable(this.entity).playbackState = ParticleSystemPlaybackState.PS_STOPPED
    }
  }

  init(): void {
    const accent = this.colors[1] ?? mint
    this.createEmitter({
      position: Vector3.create(ARENA_CENTER.x, 4.4, ARENA_CENTER.z),
      shape: DclParticleSystem.Shape.Sphere({ radius: 0.35 }),
      rate: 0,
      gravity: this.config.gravity,
      initialVelocitySpeed: { start: 2.2, end: this.config.speed },
      initialSize: { start: 0.05, end: 0.12 },
      sizeOverTime: { start: 1, end: 0.2 },
      initialColor: { start: sun, end: accent },
      colorOverTime: {
        start: Color4.create(1, 1, 1, 1),
        end: Color4.create(1, 1, 1, 0),
      },
      blendMode: ParticleSystemBlendMode.PSB_ADD,
      loop: false,
    })
  }

  burst(position: Vector3, count: number = 60, _spread: number = 4): void {
    if (this.playing || !this.isActive) return
    const pieces = confettiPieceCount(count, this.isMobileDevice)
    if (pieces <= 0) return

    this.playing = true
    this.elapsed = 0
    this.duration = this.isMobileDevice ? 1.8 : 2.4
    this.isActive = true
    this.moveEmitter(position)
    this.setParticleCount(pieces)

    if (!this.entity || !DclParticleSystem.has(this.entity)) return
    const particle = DclParticleSystem.getMutable(this.entity)
    const start = this.colors[Math.floor(Math.random() * this.colors.length)] ?? sun
    const end = this.colors[Math.floor(Math.random() * this.colors.length)] ?? moon
    particle.initialColor = { start, end }
    particle.bursts = {
      values: [{ time: 0, count: pieces, cycles: 1, interval: 0, probability: 1 }],
    }
    particle.loop = false
    particle.playbackState = ParticleSystemPlaybackState.PS_PLAYING
  }

  update(dt: number): void {
    if (!this.playing) return
    this.elapsed += dt
    if (this.elapsed >= this.duration) {
      this.playing = false
      if (this.entity && DclParticleSystem.has(this.entity)) {
        DclParticleSystem.getMutable(this.entity).playbackState = ParticleSystemPlaybackState.PS_STOPPED
      }
      this.onComplete?.()
    }
  }

  onCompleteCallback(callback: () => void): void {
    this.onComplete = callback
  }
}
