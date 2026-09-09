/**
 * FramerateTracker monitors FPS from engine dt (or an injected clock)
 * and fires callbacks when a rolling average crosses low / critical / recovered.
 *
 * Call `tick(dt)` from the scene system. Do not start a rAF loop here —
 * Decentraland scenes should stay on `engine.addSystem`.
 */

export type FpsCallback = (fps: number) => void

const DEFAULT_HISTORY = 30
const SMOOTH_SECONDS = 5

export class FramerateTracker {
  private static instance: FramerateTracker | null = null

  private frameCount = 0
  private elapsedSeconds = 0
  private currentFps = 60
  private fpsHistory: number[] = []
  private maxHistoryLength = DEFAULT_HISTORY

  private lowFpsThreshold = 30
  private criticalFpsThreshold = 20
  private onLowFps: FpsCallback | null = null
  private onCriticalFps: FpsCallback | null = null
  private onFpsRecovered: FpsCallback | null = null

  private isLowFps = false
  private isCriticalFps = false

  private constructor() {}

  static getInstance(): FramerateTracker {
    if (!FramerateTracker.instance) {
      FramerateTracker.instance = new FramerateTracker()
    }
    return FramerateTracker.instance
  }

  static resetInstance(): void {
    FramerateTracker.instance = null
  }

  /**
   * Advance by one engine frame. `dt` is seconds (SDK system signature).
   */
  tick(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) return
    this.frameCount += 1
    this.elapsedSeconds += dt
    if (this.elapsedSeconds >= 1) {
      const fps = this.frameCount / this.elapsedSeconds
      this.frameCount = 0
      this.elapsedSeconds = 0
      this.updateFps(fps)
    }
  }

  /**
   * Push a measured FPS sample directly (tests / external samplers).
   */
  recordSample(fps: number): void {
    if (!Number.isFinite(fps) || fps < 0) return
    this.updateFps(fps)
  }

  private updateFps(fps: number): void {
    this.currentFps = fps
    this.fpsHistory.push(fps)
    if (this.fpsHistory.length > this.maxHistoryLength) {
      this.fpsHistory.shift()
    }

    const avgFps = this.getAverageFps(SMOOTH_SECONDS)

    if (avgFps < this.criticalFpsThreshold && !this.isCriticalFps) {
      this.isCriticalFps = true
      this.isLowFps = true
      this.onCriticalFps?.(avgFps)
      return
    }

    if (avgFps < this.lowFpsThreshold && !this.isLowFps) {
      this.isLowFps = true
      this.onLowFps?.(avgFps)
      return
    }

    if (avgFps >= this.lowFpsThreshold && (this.isLowFps || this.isCriticalFps)) {
      this.isLowFps = false
      this.isCriticalFps = false
      this.onFpsRecovered?.(avgFps)
    }
  }

  getCurrentFps(): number {
    return this.currentFps
  }

  getAverageFps(seconds: number = SMOOTH_SECONDS): number {
    const count = Math.min(Math.max(1, Math.floor(seconds)), this.fpsHistory.length)
    if (count === 0) return this.currentFps
    const recent = this.fpsHistory.slice(-count)
    return recent.reduce((sum, value) => sum + value, 0) / recent.length
  }

  getHistory(): readonly number[] {
    return this.fpsHistory
  }

  isBelowLowThreshold(): boolean {
    return this.isLowFps
  }

  isBelowCriticalThreshold(): boolean {
    return this.isCriticalFps
  }

  setThresholds(low: number, critical: number): void {
    this.lowFpsThreshold = low
    this.criticalFpsThreshold = Math.min(critical, low)
  }

  onLowFpsEvent(callback: FpsCallback): void {
    this.onLowFps = callback
  }

  onCriticalFpsEvent(callback: FpsCallback): void {
    this.onCriticalFps = callback
  }

  onFpsRecoveredEvent(callback: FpsCallback): void {
    this.onFpsRecovered = callback
  }
}
