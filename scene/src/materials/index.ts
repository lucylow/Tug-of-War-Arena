/**
 * Materials + overdraw suite. Free of `@dcl/sdk` so the Expo test suite
 * can cover pooling, LOD, culling, and budgets. Scene runtime apply lives
 * in `systems/overdraw.ts`.
 */

import { configurePerformanceHost, isMobileClient } from '../performance/platform'
import { AssetPreprocessor } from './AssetPreprocessor'
import { BackfaceCulling } from './BackfaceCulling'
import { DrawCallBatcher } from './DrawCallBatcher'
import { LODSystem } from './LODSystem'
import { MaterialBudgetTracker } from './MaterialBudget'
import { MaterialPool } from './MaterialPool'
import { MobileShader } from './MobileShader'
import { OcclusionCuller } from './OcclusionCuller'
import { TextureAtlasManager } from './TextureAtlas'
import type { CameraPose, Vec3Like } from './types'

export interface MaterialsBootOptions {
  mobile?: boolean
  debug?: boolean
}

export interface MaterialsHandles {
  budget: MaterialBudgetTracker
  pool: MaterialPool
  atlas: TextureAtlasManager
  lod: LODSystem
  occlusion: OcclusionCuller
  culling: BackfaceCulling
  shader: MobileShader
  batcher: DrawCallBatcher
  preprocessor: AssetPreprocessor
}

export function resetMaterials(): void {
  MaterialBudgetTracker.resetInstance()
  MaterialPool.resetInstance()
  TextureAtlasManager.resetInstance()
  LODSystem.resetInstance()
  OcclusionCuller.resetInstance()
  BackfaceCulling.resetInstance()
  MobileShader.resetInstance()
  DrawCallBatcher.resetInstance()
  AssetPreprocessor.resetInstance()
}

export function setupMaterials(options: MaterialsBootOptions = {}): MaterialsHandles {
  const mobile = options.mobile ?? true
  resetMaterials()
  configurePerformanceHost({ mobile })

  const budget = MaterialBudgetTracker.getInstance()
  const pool = MaterialPool.getInstance()
  const atlas = TextureAtlasManager.getInstance()
  const lod = LODSystem.getInstance()
  const occlusion = OcclusionCuller.getInstance()
  const culling = BackfaceCulling.getInstance()
  const shader = MobileShader.getInstance()
  const batcher = DrawCallBatcher.getInstance()
  const preprocessor = AssetPreprocessor.getInstance()

  if (options.debug) {
    budget.onBudgetWarning((metric, usage, limit) => {
      console.log(`[Budget] ${metric}: ${usage}/${limit}`)
    })
    console.log(`[materials] mobile=${isMobileClient()}`)
    console.log(`[materials] max texture ${preprocessor.getMaxTextureResolution()} (${preprocessor.getTextureFormat()})`)
    console.log(`[materials] atlas ${preprocessor.getAtlasSize()} mesh=${preprocessor.getMeshQuality()}`)
  }

  return { budget, pool, atlas, lod, occlusion, culling, shader, batcher, preprocessor }
}

/** Drive from `engine.addSystem`. `dt` is unused; clocks use `now`. */
export function tickMaterials(dt: number, camera?: CameraPose, now: number = Date.now()): void {
  void dt
  const position: Vec3Like | undefined = camera?.position
  LODSystem.getInstance().tick(now, position)
  OcclusionCuller.getInstance().tick(now, camera)
  MaterialBudgetTracker.getInstance().tick(now)
}

export { createUvAnimation, emissiveScrollProxy, stepUvAnimation, uvOffsetArray } from './animatedTexture'
export type { UvAnimation } from './animatedTexture'
export { createGlowMaterial, glowPulseIntensity, updateGlowIntensity } from './glowMaterial'
export { AssetPreprocessor } from './AssetPreprocessor'
export { BackfaceCulling } from './BackfaceCulling'
export { DrawCallBatcher } from './DrawCallBatcher'
export { LODSystem } from './LODSystem'
export { DESKTOP_MATERIAL_BUDGET, MOBILE_MATERIAL_BUDGET, MaterialBudgetTracker } from './MaterialBudget'
export { MaterialPool } from './MaterialPool'
export { MobileShader } from './MobileShader'
export { OcclusionCuller } from './OcclusionCuller'
export { TextureAtlasManager } from './TextureAtlas'
export type {
  AtlasUVs,
  CameraPose,
  ColorLike,
  CullChange,
  EntityId,
  LODChange,
  LODLevel,
  MaterialBudget,
  MeshKey,
  PbrMaterialConfig,
  PooledMaterial,
  Vec3Like,
} from './types'
export {
  TRANSPARENCY_ALPHA_BLEND,
  TRANSPARENCY_ALPHA_TEST,
  TRANSPARENCY_OPAQUE,
  colorKey,
  parseColor,
} from './types'
