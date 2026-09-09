/**
 * Central VFX budget manager. Free of `@dcl/sdk` — scene classes register
 * here and QualityManager drives `setQuality`.
 */

import { QualityManager, type QualityLevel } from '../performance/QualityManager'
import { isMobileClient } from '../performance/platform'
import {
  DESKTOP_PARTICLE_BUDGET,
  type VfxQuality,
  firefliesEnabled,
  mapQualityLevel,
  particleBudgetFor,
} from './budgets'

export type VfxHandle = {
  name?: string
  maxParticles?: number
  setActive?: (active: boolean) => void
  setParticleCount?: (count: number) => void
  update?: (dt: number) => void
  destroy?: () => void
}

export class VFXOptimizer {
  private static instance: VFXOptimizer | null = null

  private quality: VfxQuality
  private particleBudget: number
  private activeEffects: VfxHandle[] = []
  private boundQuality = false
  private mobile: boolean

  private constructor() {
    this.mobile = isMobileClient()
    this.quality = this.mobile ? 'medium' : 'high'
    this.particleBudget = particleBudgetFor(this.quality, this.mobile)
  }

  static getInstance(): VFXOptimizer {
    if (!VFXOptimizer.instance) {
      VFXOptimizer.instance = new VFXOptimizer()
    }
    return VFXOptimizer.instance
  }

  static resetInstance(): void {
    VFXOptimizer.instance = null
  }

  bindQualityManager(): void {
    if (this.boundQuality) return
    this.boundQuality = true
    QualityManager.getInstance().onQualityChange((level: QualityLevel) => {
      this.setQuality(mapQualityLevel(level), this.mobile)
    })
    this.setQuality(mapQualityLevel(QualityManager.getInstance().getLevel()), this.mobile)
  }

  registerEffect(effect: VfxHandle): void {
    if (this.activeEffects.includes(effect)) return
    this.activeEffects.push(effect)
    this.applyTo(effect)
  }

  unregisterEffect(effect: VfxHandle): void {
    const index = this.activeEffects.indexOf(effect)
    if (index >= 0) this.activeEffects.splice(index, 1)
  }

  setQuality(quality: VfxQuality, mobile: boolean = this.mobile): void {
    this.quality = quality
    this.mobile = mobile
    this.particleBudget = particleBudgetFor(quality, this.mobile)
    if (!this.mobile && quality === 'high') {
      this.particleBudget = Math.floor(DESKTOP_PARTICLE_BUDGET)
    }
    for (const effect of this.activeEffects) {
      this.applyTo(effect)
    }
  }

  getQuality(): VfxQuality {
    return this.quality
  }

  getParticleBudget(): number {
    return this.particleBudget
  }

  isMobile(): boolean {
    return this.mobile
  }

  firefliesAllowed(): boolean {
    return firefliesEnabled(this.quality, this.mobile)
  }

  disableAll(): void {
    for (const effect of this.activeEffects) {
      effect.setActive?.(false)
    }
  }

  enableAll(): void {
    for (const effect of this.activeEffects) {
      if (effect.name === 'fireflies' && !this.firefliesAllowed()) {
        effect.setActive?.(false)
        continue
      }
      effect.setActive?.(true)
    }
  }

  updateAll(dt: number): void {
    for (const effect of this.activeEffects) {
      effect.update?.(dt)
    }
  }

  destroyAll(): void {
    for (const effect of this.activeEffects) {
      effect.destroy?.()
    }
    this.activeEffects = []
  }

  private applyTo(effect: VfxHandle): void {
    if (this.quality === 'low' && QualityManager.getInstance().getSettings().particleCount <= 0) {
      effect.setActive?.(false)
      return
    }

    if (effect.name === 'fireflies') {
      effect.setActive?.(this.firefliesAllowed())
    }

    if (effect.setParticleCount && effect.maxParticles !== undefined) {
      const ratio = this.particleBudget / Math.max(1, this.mobile ? 50 : 200)
      effect.setParticleCount(Math.max(0, Math.floor(effect.maxParticles * Math.min(1, ratio))))
    }
  }
}
