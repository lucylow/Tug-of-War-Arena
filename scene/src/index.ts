import { Animator, Transform, engine } from '@dcl/sdk/ecs'
import { getPlatform } from '@dcl/sdk/platform'

import { MODELS, PERFORMANCE } from './config'
import { createArena } from './entities/arena'
import { createAvatar, getSpawnPosition } from './entities/avatar'
import { createFlags } from './entities/flags'
import { createHud3D } from './entities/hud3d'
import { createRope } from './entities/rope'
import { createWinZones } from './entities/winZones'
import { setupExplorerInput } from './input/mobileInput'
import { defaultWeatherForPlatform, lightingPolicy } from './logic/mobileRuntime'
import { DrawCallBatcher, setupMaterials } from './materials'
import { AdaptiveQualitySystem, QualityManager, SceneBudgetChecker, setupPerformance } from './performance'
import { checkMobileLimits } from './performance/mobileLimits'
import { configurePerformanceHost } from './performance/platform'
import { SceneErrorHandler, setupSceneErrorHandling } from './systems/errorHandling'
import { bindVisualSystems, registerMainLoop } from './systems/gameLoop'
import { setupLighting, setupSkyboxTime } from './systems/lighting'
import { setupWorldBus } from './systems/messageBus'
import { maybeSync } from './systems/network'
import { bindMaterialRuntime, registerArenaFlags } from './systems/overdraw'
import { setupAmbientParticles } from './systems/particles'
import { createCenterBloom } from './systems/postfx'
import { applyCurrentQuality, bindQualityApplicator } from './systems/quality'
import { session } from './systems/session'
import { setWeather } from './systems/weather'
import { setupUI } from './ui'
import { isExplorerMobile } from './utils/platform'
import { applyVfxPlatform, setupVfx } from './vfx'
import { setupAdvancedVisuals } from './visuals'
import { assembleWorld } from './world'

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
  setupSkyboxTime()

  try {
    createArena()
  } catch (error) {
    SceneErrorHandler.getInstance().recordAssetFailure(MODELS.arena, error)
  }
  let flags: ReturnType<typeof createFlags> = []
  try {
    flags = createFlags()
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('Team flags unavailable', error)
  }
  try {
    createWinZones()
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('Win zones unavailable', error)
  }

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

  let hud: ReturnType<typeof createHud3D> | null = null
  try {
    hud = createHud3D()
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('3D HUD unavailable', error)
  }
  try {
    createCenterBloom()
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('Center bloom unavailable', error)
  }
  try {
    setupAmbientParticles()
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('Ambient particles unavailable', error)
  }
  try {
    setupVfx()
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('VFX unavailable', error)
  }

  session.state.players.forEach((player) => {
    try {
      const avatar = createAvatar({
        id: player.id,
        team: player.team,
        position: getSpawnPosition(player.team, player.index),
      })
      maybeSync(avatar, [Transform.componentId, Animator.componentId], 10 + player.index)
    } catch (error) {
      SceneErrorHandler.getInstance().recordFault(`Avatar unavailable for ${player.id}`, error)
    }
  })

  try {
    setupWorldBus()
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('World message bus unavailable', error)
  }

  try {
    assembleWorld()
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('World assembly unavailable', error)
  }

  whenPlatformReady(() => {
    const mobile = isExplorerMobile()
    configurePerformanceHost({ mobile })
    AdaptiveQualitySystem.getInstance().setTargetFps(
      mobile ? PERFORMANCE.targetFpsMobile : PERFORMANCE.targetFpsDesktop,
    )
    const quality = QualityManager.getInstance()
    if (!mobile && quality.getLevel() === 'medium') {
      quality.setQuality('high')
    }

    const lights = lightingPolicy(mobile)
    try {
      setupLighting({ mobile, enableLights: lights.dynamicLights, shadows: lights.shadows })
    } catch (error) {
      SceneErrorHandler.getInstance().recordFault('Dynamic lights unavailable', error)
    }

    if (mobile) {
      session.state.weather = defaultWeatherForPlatform(true)
      session.state.weatherIntensity = 0
      setWeather(session.state.weather, session.state.weatherIntensity)
    }

    try {
      setupUI()
    } catch (error) {
      SceneErrorHandler.getInstance().recordFault('Arena HUD failed to start', error)
    }
    try {
      setupExplorerInput()
    } catch (error) {
      SceneErrorHandler.getInstance().recordFault('Explorer input unavailable', error)
    }
    try {
      applyCurrentQuality()
    } catch (error) {
      SceneErrorHandler.getInstance().recordFault('Quality applicator failed', error)
    }
    try {
      applyVfxPlatform(mobile)
    } catch (error) {
      SceneErrorHandler.getInstance().recordFault('VFX platform profile unavailable', error)
    }
    try {
      setupAdvancedVisuals()
    } catch (error) {
      SceneErrorHandler.getInstance().recordFault('Advanced visuals failed to start', error)
    }
    try {
      registerArenaFlags(flags)
    } catch (error) {
      SceneErrorHandler.getInstance().recordFault('Arena flag batching unavailable', error)
    }
    try {
      DrawCallBatcher.getInstance().batch()
    } catch (error) {
      SceneErrorHandler.getInstance().recordFault('Draw-call batching unavailable', error)
    }

    try {
      const stats = SceneBudgetChecker.getInstance().collectStats()
      const limits = checkMobileLimits(stats)
      if (!limits.withinLimits) {
        console.log('[mobile] scene budget warnings', limits.warnings)
      }
    } catch (error) {
      SceneErrorHandler.getInstance().recordFault('Scene budget check unavailable', error)
    }
  })
  bindVisualSystems(hud, rope)
  registerMainLoop()
}
