/**
 * Scene budgets + target FPS. All modules here are free of `@dcl/sdk`
 * so the Expo test suite can cover the adaptive path.
 */

import { AdaptiveQualitySystem } from './AdaptiveQualitySystem'
import { BudgetAwareLoader } from './BudgetAwareLoader'
import { FramerateTracker } from './FramerateTracker'
import { GraphicsErrorHandler } from './GraphicsErrorHandler'
import { MemoryTracker } from './MemoryTracker'
import { PerformanceMonitorUI } from './PerformanceMonitorUI'
import { QualityManager } from './QualityManager'
import { SceneBudgetChecker } from './SceneBudgetChecker'
import { configurePerformanceHost, isMobileClient, resetPerformanceHost } from './platform'

export interface PerformanceBootOptions {
  mobile?: boolean
  debug?: boolean
  targetFps?: number
  now?: () => number
}

export interface PerformanceHandles {
  fps: FramerateTracker
  budget: SceneBudgetChecker
  quality: QualityManager
  adaptive: AdaptiveQualitySystem
  memory: MemoryTracker
  loader: BudgetAwareLoader
  monitor: PerformanceMonitorUI
}

export function resetPerformance(): void {
  FramerateTracker.resetInstance()
  SceneBudgetChecker.resetInstance()
  QualityManager.resetInstance()
  AdaptiveQualitySystem.resetInstance()
  MemoryTracker.resetInstance()
  BudgetAwareLoader.resetInstance()
  PerformanceMonitorUI.resetInstance()
  GraphicsErrorHandler.resetInstance()
  resetPerformanceHost()
}

export function setupPerformance(options: PerformanceBootOptions = {}): PerformanceHandles {
  resetPerformance()
  configurePerformanceHost({ mobile: options.mobile ?? true })

  const fps = FramerateTracker.getInstance()
  const budget = SceneBudgetChecker.getInstance()
  const quality = QualityManager.getInstance()
  const adaptive = AdaptiveQualitySystem.getInstance()
  const memory = MemoryTracker.getInstance()
  const loader = BudgetAwareLoader.getInstance()
  const monitor = PerformanceMonitorUI.getInstance()

  const mobile = options.mobile ?? isMobileClient()
  adaptive.setTargetFps(options.targetFps ?? (mobile ? 30 : 60))
  adaptive.arm(options.now)

  if (options.debug === true) monitor.show()
  if (options.debug === false) monitor.hide()

  return { fps, budget, quality, adaptive, memory, loader, monitor }
}

/** Drive trackers from `engine.addSystem`. `dt` is seconds. */
export function tickPerformance(dt: number, now: number = Date.now()): void {
  FramerateTracker.getInstance().tick(dt)
  MemoryTracker.getInstance().sample(now)
  SceneBudgetChecker.getInstance().tick(now)
  BudgetAwareLoader.getInstance().tick(now)
  AdaptiveQualitySystem.getInstance().evaluate()
}

export { AdaptiveQualitySystem } from './AdaptiveQualitySystem'
export { BudgetAwareLoader } from './BudgetAwareLoader'
export type { AssetLoadRequest, Vec3Like } from './BudgetAwareLoader'
export { FramerateTracker } from './FramerateTracker'
export {
  GraphicsErrorHandler,
  classifySceneGraphicsError,
  decideGltfLoad,
  initialContextLossState,
  reduceContextLoss,
  shouldDropQualityForEvent,
} from './GraphicsErrorHandler'
export type {
  ContextLossState,
  GltfLoadDecision,
  GltfLoadInput,
  SceneGraphicsCategory,
  SceneGraphicsEvent,
} from './GraphicsErrorHandler'
export { MemoryTracker } from './MemoryTracker'
export { PerformanceMonitorUI, getPerformanceSnapshot } from './PerformanceMonitorUI'
export type { PerformanceSnapshot } from './PerformanceMonitorUI'
export { QUALITY_LEVELS, QUALITY_PRESETS, QualityManager, venueLodFromQuality } from './QualityManager'
export type { QualityLevel, QualityListener, QualitySettings } from './QualityManager'
export { SceneBudgetChecker, recordPrimitive } from './SceneBudgetChecker'
export type { BudgetCallback, BudgetReport } from './SceneBudgetChecker'
export {
  DESKTOP_BUDGETS,
  EMPTY_STATS,
  MOBILE_BUDGETS,
  createStats,
  estimateMemoryMb,
} from './budgets'
export type { BudgetBand, BudgetMetric, SceneBudget, SceneStats } from './budgets'
export { configurePerformanceHost, isMobileClient } from './platform'
