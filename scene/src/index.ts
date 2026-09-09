import { Animator, InputAction, Transform, engine, pointerEventsSystem } from '@dcl/sdk/ecs'
import { getPlatform, isMobile } from '@dcl/sdk/platform'

import { ENABLE_CLICK_TO_PULL, MODELS, PERFORMANCE } from './config'
import { createArena } from './entities/arena'
import { createAvatar, getSpawnPosition } from './entities/avatar'
import { createFlags } from './entities/flags'
import { createHud3D } from './entities/hud3d'
import { box } from './entities/primitives'
import { createRope } from './entities/rope'
import { createWinZones } from './entities/winZones'
import { setupExplorerInput } from './input/mobileInput'
import { ARENA_CENTER } from './logic/mapping'
import { DrawCallBatcher, setupMaterials } from './materials'
import { midnight } from './palette'
import { AdaptiveQualitySystem, QualityManager, SceneBudgetChecker, setupPerformance } from './performance'
import { checkMobileLimits } from './performance/mobileLimits'
import { SceneErrorHandler, setupSceneErrorHandling } from './systems/errorHandling'
import { bindVisualSystems, registerMainLoop } from './systems/gameLoop'
import { setupLighting } from './systems/lighting'
import { maybeSync } from './systems/network'
import { bindMaterialRuntime, registerArenaFlags } from './systems/overdraw'
import { setupAmbientParticles } from './systems/particles'
import { createCenterBloom } from './systems/postfx'
import { applyCurrentQuality, bindQualityApplicator } from './systems/quality'
import { queueTap, session } from './systems/session'
import { setWeather } from './systems/weather'
import { setupUI } from './ui'
import { applyVfxPlatform, setupVfx } from './vfx'
import { setupAdvancedVisuals } from './visuals'

function whenPlatformReady(callback: () => void) {
  let frames = 0
  engine.addSystem(function waitForPlatform() {
    frames += 1
    if (getPlatform() !== null || frames > 30) {
      engine.removeSystem(waitForPlatform)
      callback()
    }
  })
}

export function main() {
  setupPerformance({
    mobile: true,
    debug: PERFORMANCE.enableMonitor,
    targetFps: PERFORMANCE.targetFpsMobile,
  })
  setupSceneErrorHandling()
  setupMaterials({ mobile: true, debug: PERFORMANCE.enableMonitor })
  bindQualityApplicator()
  bindMaterialRuntime()

  setupLighting()
  try {
    createArena()
  } catch (error) {
    SceneErrorHandler.getInstance().recordAssetFailure(MODELS.arena, error)
  }
  const flags = createFlags()
  createWinZones()

  let rope
  try {
    rope = createRope()
  } catch (error) {
    const handler = SceneErrorHandler.getInstance()
    handler.recordAssetFailure(MODELS.rope, error)
    const fallback = engine.addEntity()
    handler.safeLoadGltf(fallback, MODELS.rope, '')
    rope = { root: fallback, segments: [] as ReturnType<typeof createRope>['segments'], knot: fallback }
  }
  maybeSync(rope.root, [Transform.componentId], 1)

  const hud = createHud3D()
  createCenterBloom()
  setupAmbientParticles()
  setupVfx()
  setWeather(session.state.weather, session.state.weatherIntensity)

  session.state.players.forEach((player) => {
    const avatar = createAvatar({
      id: player.id,
      team: player.team,
      position: getSpawnPosition(player.team, player.index),
    })
    maybeSync(avatar, [Transform.componentId, Animator.componentId], 10 + player.index)
  })

  if (ENABLE_CLICK_TO_PULL) {
    const pad = box(
      undefined,
      { x: ARENA_CENTER.x, y: 0.12, z: ARENA_CENTER.z + 7.4 },
      { x: 4.4, y: 0.18, z: 2.2 },
      midnight,
      { emissive: midnight, emissiveIntensity: 0.4, collider: true },
    )
    pointerEventsSystem.onPointerDown(
      { entity: pad, opts: { button: InputAction.IA_POINTER, hoverText: 'Pull!' } },
      () => queueTap(1),
    )
  }

  whenPlatformReady(() => {
    const mobile = isMobile()
    AdaptiveQualitySystem.getInstance().setTargetFps(
      mobile ? PERFORMANCE.targetFpsMobile : PERFORMANCE.targetFpsDesktop,
    )
    const quality = QualityManager.getInstance()
    if (!mobile && quality.getLevel() === 'medium') {
      quality.setQuality('high')
    }

    setupUI()
    setupExplorerInput()
    applyCurrentQuality()
    applyVfxPlatform(mobile)
    try {
      setupAdvancedVisuals()
    } catch (error) {
      SceneErrorHandler.getInstance().recordFault('Advanced visuals failed to start', error)
    }
    registerArenaFlags(flags)
    DrawCallBatcher.getInstance().batch()

    const stats = SceneBudgetChecker.getInstance().collectStats()
    const limits = checkMobileLimits(stats)
    if (!limits.withinLimits) {
      console.warn('[mobile] scene budget warnings', limits.warnings)
    }
  })
  bindVisualSystems(hud, rope)
  registerMainLoop()
}
