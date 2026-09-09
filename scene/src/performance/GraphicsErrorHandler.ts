/**
 * SDK-free graphics failure policy for the Decentraland scene.
 * Expo tests cover the same recovery decisions the explorer uses.
 */

import { QualityManager } from './QualityManager'
import type { QualityLevel } from './QualityManager'

export type SceneGraphicsCategory =
  | 'asset_load'
  | 'context_loss'
  | 'render'
  | 'performance'
  | 'platform'

export type SceneGraphicsSeverity = 'info' | 'warning' | 'error' | 'fatal'

export interface SceneGraphicsEvent {
  category: SceneGraphicsCategory
  message: string
  severity: SceneGraphicsSeverity
  src?: string
  timestamp: number
}

export type GltfLoadDecision = 'model' | 'fallback'

export interface GltfLoadInput {
  useGlbAssets: boolean
  src: string
  createThrows?: boolean
}

export interface ContextLossState {
  lost: boolean
  restoreAttempts: number
  message: string | null
}

export const initialContextLossState: ContextLossState = {
  lost: false,
  restoreAttempts: 0,
  message: null,
}

const DEFAULT_MAX_LOGS = 80

export function classifySceneGraphicsError(message: string): SceneGraphicsCategory {
  if (/webgl|context lost|contextlost|gpu reset/i.test(message)) return 'context_loss'
  if (/fps|memory|budget|frame/i.test(message)) return 'performance'
  if (/glb|gltf|texture|asset|load/i.test(message)) return 'asset_load'
  if (/unsupported|webgl2|low memory/i.test(message)) return 'platform'
  return 'render'
}

export function decideGltfLoad(input: GltfLoadInput): GltfLoadDecision {
  if (!input.useGlbAssets) return 'fallback'
  if (input.createThrows) return 'fallback'
  if (!input.src.trim()) return 'fallback'
  return 'model'
}

export function reduceContextLoss(
  state: ContextLossState,
  action: { type: 'lost' } | { type: 'restored' } | { type: 'reset' },
): ContextLossState {
  if (action.type === 'reset') return { ...initialContextLossState }
  if (action.type === 'lost') {
    return {
      lost: true,
      restoreAttempts: state.restoreAttempts + 1,
      message: 'Graphics context lost. Attempting to recover...',
    }
  }
  return {
    lost: false,
    restoreAttempts: state.restoreAttempts,
    message: null,
  }
}

export function shouldDropQualityForEvent(category: SceneGraphicsCategory): boolean {
  return category === 'context_loss' || category === 'render' || category === 'performance'
}

export class GraphicsErrorHandler {
  private static instance: GraphicsErrorHandler | null = null

  private events: SceneGraphicsEvent[] = []
  private context = initialContextLossState
  private maxLogs: number

  private constructor(maxLogs: number = DEFAULT_MAX_LOGS) {
    this.maxLogs = maxLogs
  }

  static getInstance(): GraphicsErrorHandler {
    if (!GraphicsErrorHandler.instance) {
      GraphicsErrorHandler.instance = new GraphicsErrorHandler()
    }
    return GraphicsErrorHandler.instance
  }

  static resetInstance(): void {
    GraphicsErrorHandler.instance = null
  }

  capture(input: {
    category?: SceneGraphicsCategory
    message: string
    src?: string
    now?: number
  }): SceneGraphicsEvent {
    const category = input.category ?? classifySceneGraphicsError(input.message)
    const event: SceneGraphicsEvent = {
      category,
      message: input.message,
      severity: category === 'context_loss' || category === 'render' ? 'fatal' : 'error',
      src: input.src,
      timestamp: input.now ?? Date.now(),
    }
    this.events.push(event)
    if (this.events.length > this.maxLogs) this.events.shift()

    if (shouldDropQualityForEvent(category)) {
      QualityManager.getInstance().reduceQuality()
    }

    if (typeof console !== 'undefined') {
      console.warn(`[scene:graphics] ${category}: ${event.message}`)
    }

    return event
  }

  markContextLost(now?: number): ContextLossState {
    this.context = reduceContextLoss(this.context, { type: 'lost' })
    this.capture({
      category: 'context_loss',
      message: this.context.message ?? 'WebGL context lost',
      now,
    })
    return this.getContextState()
  }

  markContextRestored(): ContextLossState {
    this.context = reduceContextLoss(this.context, { type: 'restored' })
    return this.getContextState()
  }

  safeLoadDecision(input: GltfLoadInput): GltfLoadDecision {
    const decision = decideGltfLoad(input)
    if (decision === 'fallback' && input.useGlbAssets) {
      this.capture({
        category: 'asset_load',
        message: `GLB load failed for ${input.src || 'unknown'}`,
        src: input.src,
      })
    }
    return decision
  }

  getEvents(): SceneGraphicsEvent[] {
    return [...this.events]
  }

  getContextState(): ContextLossState {
    return { ...this.context }
  }

  getRecommendedQuality(): QualityLevel {
    return QualityManager.getInstance().getLevel()
  }
}
