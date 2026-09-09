/**
 * MemoryTracker estimates working set from scene stats and optional
 * `performance.memory` when the host exposes it (Chrome / some explorers).
 */

import { estimateMemoryMb, type SceneStats } from './budgets'
import { SceneBudgetChecker } from './SceneBudgetChecker'

export type MemoryCallback = (usedMb: number, limitMb: number) => void

type MemoryProbe = {
  usedJSHeapSize?: number
}

declare const performance: { memory?: MemoryProbe; now: () => number } | undefined

export class MemoryTracker {
  private static instance: MemoryTracker | null = null

  private usedMb = 0
  private lastSample = 0
  private sampleInterval = 2000
  private onPressure: MemoryCallback | null = null
  private warned = false

  private constructor() {}

  static getInstance(): MemoryTracker {
    if (!MemoryTracker.instance) {
      MemoryTracker.instance = new MemoryTracker()
    }
    return MemoryTracker.instance
  }

  static resetInstance(): void {
    MemoryTracker.instance = null
  }

  sample(now: number = Date.now(), stats?: SceneStats): number {
    if (now - this.lastSample < this.sampleInterval) return this.usedMb
    this.lastSample = now

    const sceneStats = stats ?? SceneBudgetChecker.getInstance().collectStats()
    const estimated = estimateMemoryMb(sceneStats)
    const heapMb = this.readHeapMb()
    this.usedMb = Math.max(estimated, heapMb)

    const limit = SceneBudgetChecker.getInstance().getBudget().memoryMb.soft
    if (this.usedMb > limit && !this.warned) {
      this.warned = true
      this.onPressure?.(this.usedMb, limit)
    } else if (this.usedMb <= limit * 0.8) {
      this.warned = false
    }

    return this.usedMb
  }

  getUsedMb(): number {
    return this.usedMb
  }

  onMemoryPressure(callback: MemoryCallback): void {
    this.onPressure = callback
  }

  private readHeapMb(): number {
    try {
      const heap = typeof performance !== 'undefined' ? performance.memory?.usedJSHeapSize : undefined
      if (!heap || !Number.isFinite(heap)) return 0
      return Math.round((heap / (1024 * 1024)) * 10) / 10
    } catch {
      return 0
    }
  }
}
