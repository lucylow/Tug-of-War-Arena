/**
 * Part 2 visual suite bootstrap: skybox, props, vegetation, audio, VFX.
 * Quality-gated so the 2×2 mobile parcel stays inside explorer budgets.
 */

import { Vector3 } from '@dcl/sdk/math'

import { ENABLE_ADVANCED_VISUALS } from './config'
import { createFireTrail, updateFire, updateFireTrail } from './effects/fire'
import { createComboBurst, createPowerSurge, updatePowerSurges } from './effects/powerSurge'
import { createArenaGodRays, pulseGodRays } from './effects/volumetricLight'
import { animateBanner, createTeamBanners, type BannerHandle } from './entities/banner'
import { createInteractiveDummy } from './entities/interactive'
import { box } from './entities/primitives'
import { createSkybox, pulseSunGlow, type SkyboxHandle } from './entities/skybox'
import { animateTorch, createCornerTorches, type TorchHandle } from './entities/torch'
import { scatterVegetation } from './entities/vegetation'
import { ARENA_CENTER, type CrewId } from './logic/mapping'
import { advancedPropBudget, isComboActive, skyboxEnabled } from './logic/visualFx'
import { gold, mint } from './palette'
import { QualityManager } from './performance/QualityManager'
import { isMobileClient } from './performance/platform'
import { startUVAnimation, updateUVAnimations } from './systems/animatedTexture'
import { playComboSound, playSurgeSound, setupAudio } from './systems/audio'
import { tickPropLod } from './systems/lod'

type VisualRuntime = {
  sky?: SkyboxHandle
  torches: TorchHandle[]
  banners: BannerHandle[]
  godRays: ReturnType<typeof createArenaGodRays>
  trail?: ReturnType<typeof createFireTrail>
  lastCombo: boolean
}

const runtime: VisualRuntime = {
  torches: [],
  banners: [],
  godRays: [],
  lastCombo: false,
}

export function setupAdvancedVisuals(): void {
  if (!ENABLE_ADVANCED_VISUALS) return

  const quality = QualityManager.getInstance().getLevel()
  const props = advancedPropBudget(quality)
  const mobile = isMobileClient()

  try {
    if (quality !== 'minimal') {
      runtime.sky = createSkybox(undefined, { walls: skyboxEnabled(quality, mobile) })
    }
  } catch (error) {
    console.log('[visuals] skybox unavailable', error)
  }

  try {
    runtime.torches = createCornerTorches(
      Vector3.create(ARENA_CENTER.x, 0, ARENA_CENTER.z),
      props.torches,
      quality !== 'low' && quality !== 'minimal',
    )
  } catch (error) {
    console.log('[visuals] torches unavailable', error)
  }

  try {
    if (props.banners) {
      runtime.banners = createTeamBanners(Vector3.create(ARENA_CENTER.x, 0, ARENA_CENTER.z))
    }
  } catch (error) {
    console.log('[visuals] banners unavailable', error)
  }

  try {
    if (quality !== 'minimal' && quality !== 'low') {
      scatterVegetation()
    }
  } catch (error) {
    console.log('[visuals] vegetation unavailable', error)
  }

  try {
    if (props.dummy) {
      createInteractiveDummy(Vector3.create(ARENA_CENTER.x - 5.4, 0, ARENA_CENTER.z - 8.4))
    }
  } catch (error) {
    console.log('[visuals] interactive dummy unavailable', error)
  }

  try {
    runtime.godRays = createArenaGodRays(quality)
  } catch (error) {
    console.log('[visuals] god rays unavailable', error)
  }

  try {
    const energy = box(
      undefined,
      { x: ARENA_CENTER.x, y: 0.06, z: ARENA_CENTER.z },
      { x: 16.5, y: 0.04, z: 0.55 },
      mint,
      { emissive: gold, emissiveIntensity: 0.8, roughness: 1, metallic: 0 },
    )
    startUVAnimation(energy, 0.12)
  } catch (error) {
    console.log('[visuals] energy strip unavailable', error)
  }

  try {
    if (props.trails) {
      runtime.trail = createFireTrail(Vector3.create(ARENA_CENTER.x, 1.55, ARENA_CENTER.z))
    }
  } catch (error) {
    console.log('[visuals] fire trail unavailable', error)
  }

  try {
    setupAudio()
  } catch (error) {
    console.log('[audio] skipped; clips missing or AudioSource unavailable', error)
  }
}

export function tickAdvancedVisuals(
  dt: number,
  time: number,
  knot?: { x: number; y: number; z: number },
  powers?: { sun: number; moon: number },
): void {
  if (!ENABLE_ADVANCED_VISUALS) return

  try {
    for (const torch of runtime.torches) animateTorch(torch, time)
    for (const banner of runtime.banners) animateBanner(banner, time)
    if (runtime.sky) pulseSunGlow(runtime.sky.sun, time)
    pulseGodRays(runtime.godRays, time)
    tickPropLod(runtime.torches.map((torch) => torch.root))
    updateUVAnimations(dt, time)
    updateFire(dt)
    updatePowerSurges(dt)

    if (runtime.trail && knot) {
      updateFireTrail(runtime.trail, Vector3.create(knot.x, knot.y, knot.z))
    }

    if (powers && isComboActive(powers.sun, powers.moon)) {
      if (!runtime.lastCombo) {
        triggerComboFx()
        runtime.lastCombo = true
      }
    } else {
      runtime.lastCombo = false
    }
  } catch (error) {
    console.log('[visuals] advanced tick failed', error)
  }
}

export function triggerPowerSurgeFx(team: CrewId): void {
  try {
    const x = team === 'sun' ? ARENA_CENTER.x - 4 : ARENA_CENTER.x + 4
    createPowerSurge(Vector3.create(x, 1.2, ARENA_CENTER.z), team)
    playSurgeSound()
  } catch (error) {
    console.log('[visuals] power surge fx failed', error)
  }
}

export function triggerComboFx(): void {
  try {
    createComboBurst()
    playComboSound()
  } catch (error) {
    console.log('[visuals] combo fx failed', error)
  }
}
