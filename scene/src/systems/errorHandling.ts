import { Entity, GltfContainer, Material, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'

import {
  WEBGL_RESTORE_DELAY_MS,
  classifySceneFault,
  planGltfFallback,
  shouldShowContextLostBanner,
  type SceneGraphicsFault,
} from '../logic/graphicsErrors'
import { GraphicsErrorHandler } from '../performance/GraphicsErrorHandler'

function sceneLog(level: 'info' | 'warn' | 'error', message: string, details?: unknown): void {
  const labeled = `[scene-graphics] ${message}`
  if (level === 'error') console.error(labeled, details ?? '')
  else if (level === 'warn') console.log(labeled, details ?? '')
  else console.log(labeled, details ?? '')
}

export class SceneErrorHandler {
  private static instance: SceneErrorHandler | null = null
  private errorCount = 0
  private lastErrorTime = 0
  private lastFault: SceneGraphicsFault = 'unknown'
  private fallbackEntity: Entity | null = null
  private listening = false

  static getInstance(): SceneErrorHandler {
    if (!SceneErrorHandler.instance) {
      SceneErrorHandler.instance = new SceneErrorHandler()
    }
    return SceneErrorHandler.instance
  }

  static resetInstance(): void {
    SceneErrorHandler.instance?.hideFallbackMessage()
    SceneErrorHandler.instance = null
  }

  /**
   * SDK 7 does not expose context loss directly. Listen on the explorer canvas when DOM is present.
   */
  setupWebGLErrorListener(): void {
    if (this.listening) return
    const host = globalThis as {
      document?: {
        querySelector?: (selector: string) => {
          addEventListener: (type: string, listener: (event: { preventDefault?: () => void }) => void, options?: boolean) => void
        } | null
      }
    }
    const canvas = host.document?.querySelector?.('canvas')
    if (!canvas) return
    canvas.addEventListener('webglcontextlost', this.onContextLost, false)
    canvas.addEventListener('webglcontextrestored', this.onContextRestored, false)
    this.listening = true
  }

  private onContextLost = (event: { preventDefault?: () => void }): void => {
    event.preventDefault?.()
    this.recordFault('WebGL context lost')
    this.showFallbackMessage('Graphics context lost. Attempting to recover...')
    // preventDefault allows the browser to restore; we only wait, we do not call restoreContext.
    setTimeout(() => {
      sceneLog('info', 'Waiting for webglcontextrestored')
    }, WEBGL_RESTORE_DELAY_MS)
  }

  private onContextRestored = (): void => {
    sceneLog('info', 'WebGL context restored')
    this.hideFallbackMessage()
  }

  recordFault(message: string, details?: unknown): SceneGraphicsFault {
    this.errorCount += 1
    this.lastErrorTime = Date.now()
    this.lastFault = classifySceneFault(message)
    sceneLog('error', message, details)
    GraphicsErrorHandler.getInstance().capture({
      category: this.lastFault === 'unknown' ? 'render' : this.lastFault,
      message,
    })
    return this.lastFault
  }

  recordAssetFailure(src: string, details?: unknown): void {
    this.recordFault(`GLB load failed for ${src}`, details)
  }

  showFallbackMessage(_message: string): void {
    if (this.fallbackEntity) return
    if (typeof engine === 'undefined') return
    this.fallbackEntity = engine.addEntity()
    Transform.create(this.fallbackEntity, {
      position: Vector3.create(0, 2, 0),
      scale: Vector3.create(4, 1, 4),
    })
    MeshRenderer.setBox(this.fallbackEntity)
    Material.setPbrMaterial(this.fallbackEntity, {
      albedoColor: Color4.create(0.2, 0.2, 0.3, 0.8),
      emissiveColor: Color4.create(1, 0, 0, 0.5),
      emissiveIntensity: 1.2,
    })
  }

  hideFallbackMessage(): void {
    if (!this.fallbackEntity) return
    engine.removeEntity(this.fallbackEntity)
    this.fallbackEntity = null
  }

  bannerVisible(now: number = Date.now()): boolean {
    return shouldShowContextLostBanner(this.errorCount, now - this.lastErrorTime)
  }

  getErrorCount(): number {
    return this.errorCount
  }

  getLastFault(): SceneGraphicsFault {
    return this.lastFault
  }

  planModel(src: string, fallbackSrc = '', failed = false) {
    return planGltfFallback(src, fallbackSrc, failed)
  }

  /**
   * Load a GLB and fall back to a colored box if the container constructor throws.
   * Async explorer fetch failures are not surfaced by SDK 7; callers still keep a primitive fallback.
   */
  safeLoadGltf(entity: Entity, src: string, fallbackSrc = ''): void {
    const primary = planGltfFallback(src, fallbackSrc, false)
    try {
      if (primary.usePlaceholder) {
        this.createPlaceholderMesh(entity)
        return
      }
      GltfContainer.create(entity, { src: primary.src })
    } catch (error) {
      this.recordAssetFailure(src, error)
      const fallback = planGltfFallback(src, fallbackSrc, true)
      if (!fallback.usePlaceholder) {
        try {
          GltfContainer.create(entity, { src: fallback.src })
          return
        } catch (fallbackError) {
          this.recordAssetFailure(fallback.src, fallbackError)
        }
      }
      this.createPlaceholderMesh(entity)
    }
  }

  private createPlaceholderMesh(entity: Entity): void {
    MeshRenderer.setBox(entity)
    Material.setPbrMaterial(entity, {
      albedoColor: Color4.create(1, 0, 0, 0.5),
      metallic: 0.08,
      roughness: 0.9,
    })
  }
}

export function setupSceneErrorHandling(): SceneErrorHandler {
  const handler = SceneErrorHandler.getInstance()
  handler.setupWebGLErrorListener()
  return handler
}
