/**
 * AdaptiveQualitySystem lowers visual quality when FPS or scene budgets
 * slip, then climbs back one step when the frame time is stable.
 */

import { FramerateTracker } from './FramerateTracker'
import { SceneBudgetChecker } from './SceneBudgetChecker'
import { QualityManager, QUALITY_LEVELS, type QualityLevel } from './QualityManager'
import { MemoryTracker } from './MemoryTracker'
import { isMobileClient } from './platform'

export type AdaptationReason =
  | 'fps_low'
  | 'fps_critical'
  | 'budget_warning'
  | 'budget_error'
  | 'memory'
  | 'manual'

export class AdaptiveQualitySystem {
  private static instance: AdaptiveQualitySystem | null = null

  private targetFps = 60
  private recoveryFpsThreshold = 50
  private isAdapting = false
  private adaptationCooldown = 0
  private cooldownDuration = 5000
  private armed = false
  private lastReason: AdaptationReason | null = null
  private nowFn: () => number = () => Date.now()

  private constructor() {}

  static getInstance(): AdaptiveQualitySystem {
    if (!AdaptiveQualitySystem.instance) {
      AdaptiveQualitySystem.instance = new AdaptiveQualitySystem()
    }
    return AdaptiveQualitySystem.instance
  }

  static resetInstance(): void {
    AdaptiveQualitySystem.instance = null
  }

  /**
   * Wire FPS / budget / memory listeners. Call once from `setupPerformance`.
   */
  arm(now: () => number = () => Date.now()): void {
    if (this.armed) return
    this.armed = true
    this.nowFn = now

    const fpsTracker = FramerateTracker.getInstance()
    const budgetChecker = SceneBudgetChecker.getInstance()
    const memory = MemoryTracker.getInstance()

    fpsTracker.onLowFpsEvent((fps) => this.handleLowFps(fps))
    fpsTracker.onCriticalFpsEvent((fps) => this.handleCriticalFps(fps))
    fpsTracker.onFpsRecoveredEvent((fps) => this.handleFpsRecovered(fps))
    budgetChecker.onWarning((metric, usage, limit) => this.handleBudgetWarning(metric, usage, limit))
    budgetChecker.onError((metric, usage, limit) => this.handleBudgetError(metric, usage, limit))
    memory.onMemoryPressure((used, limit) => {
      void used
      void limit
      this.reduceQuality('memory', true)
    })
  }

  setTargetFps(fps: number): void {
    this.targetFps = fps
    this.recoveryFpsThreshold = Math.max(fps - 10, 40)
  }

  getTargetFps(): number {
    return this.targetFps
  }

  getLastReason(): AdaptationReason | null {
    return this.lastReason
  }

  forceReduceQuality(aggressive: boolean = false): void {
    this.reduceQuality('manual', aggressive)
  }

  forceIncreaseQuality(): void {
    this.tryIncreaseQuality()
  }

  /**
   * Periodic climb check. Recovery is edge-triggered on the FPS tracker,
   * so a later stable 50fps+ window still needs a chance to step quality up.
   */
  evaluate(): void {
    if (FramerateTracker.getInstance().getHistory().length < 3) return
    const fps = FramerateTracker.getInstance().getAverageFps()
    if (fps >= this.recoveryFpsThreshold) {
      this.tryIncreaseQuality()
    }
  }

  private handleLowFps(fps: number): void {
    void fps
    this.reduceQuality('fps_low')
  }

  private handleCriticalFps(fps: number): void {
    void fps
    this.reduceQuality('fps_critical', true)
  }

  private handleFpsRecovered(fps: number): void {
    if (fps < this.recoveryFpsThreshold) return
    this.tryIncreaseQuality()
  }

  private handleBudgetWarning(metric: string, usage: number, limit: number): void {
    void metric
    void usage
    void limit
    this.reduceQuality('budget_warning')
  }

  private handleBudgetError(metric: string, usage: number, limit: number): void {
    void metric
    void usage
    void limit
    this.reduceQuality('budget_error', true)
  }

  private reduceQuality(reason: AdaptationReason, aggressive: boolean = false): boolean {
    if (this.isAdapting) return false
    const now = this.nowFn()
    if (!aggressive && now < this.adaptationCooldown) return false

    const qualityManager = QualityManager.getInstance()
    this.isAdapting = true
    try {
      let reduced = qualityManager.reduceQuality()
      if (aggressive && reduced) {
        qualityManager.reduceQuality()
      }
      if (reduced) {
        this.lastReason = reason
        this.adaptationCooldown = now + this.cooldownDuration
      }
      return reduced
    } finally {
      this.isAdapting = false
    }
  }

  private tryIncreaseQuality(): void {
    if (this.isAdapting) return
    const now = this.nowFn()
    if (now < this.adaptationCooldown) return

    const fps = FramerateTracker.getInstance().getAverageFps()
    if (fps < this.recoveryFpsThreshold) return

    const budget = SceneBudgetChecker.getInstance().getLastReport()
    if (!budget.withinSoftLimits && budget.warnings.length + budget.errors.length > 0) return

    const qualityManager = QualityManager.getInstance()
    const nextIndex = QUALITY_LEVELS.indexOf(qualityManager.getLevel()) - 1
    const next = QUALITY_LEVELS[nextIndex] as QualityLevel | undefined
    if (next && !this.allowsLevel(next)) return

    this.isAdapting = true
    try {
      const increased = qualityManager.increaseQuality()
      if (increased) {
        this.lastReason = null
        this.adaptationCooldown = now + this.cooldownDuration
      }
    } finally {
      this.isAdapting = false
    }
  }

  private allowsLevel(level: QualityLevel): boolean {
    if (!isMobileClient()) return true
    return QUALITY_LEVELS.indexOf(level) >= QUALITY_LEVELS.indexOf('medium')
  }
}
