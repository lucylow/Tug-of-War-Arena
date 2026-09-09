import { Vector3 } from '@dcl/sdk/math'

import { ARENA_CENTER, PULL_MAX, normalizeTeam, type CrewId, type TeamAlias, type WeatherKind } from '../logic/mapping'
import { crewColor, gold } from '../palette'
import { QualityManager } from '../performance/QualityManager'
import { isMobileClient } from '../performance/platform'
import { burstPowerSurge } from '../systems/particles'
import { ComboEffect } from './ComboEffect'
import { ConfettiEffect } from './ConfettiEffect'
import { DustParticles } from './DustParticles'
import { FogEffect, RainEffect, SnowEffect } from './EnvironmentalVFX'
import { FireflyParticles } from './FireflyParticles'
import { PowerSurgeGlow, RopeGlow, WinGlow } from './PowerSurgeGlow'
import { SparkTrail } from './SparkTrail'
import { VFXOptimizer } from './VFXOptimizer'
import { mapQualityLevel } from './budgets'
import { showComboPopup } from './comboState'

export type VfxRuntime = {
  dust: DustParticles
  fireflies: FireflyParticles
  sparks: SparkTrail
  confetti: ConfettiEffect
  powerSurge: PowerSurgeGlow
  ropeGlow: RopeGlow
  winGlow: WinGlow
  combo: ComboEffect
  rain: RainEffect
  fog: FogEffect
  snow: SnowEffect
}

let runtime: VfxRuntime | null = null
let lastWeather: WeatherKind | null = null
let lastWeatherIntensity = -1

export function setupVfx(): VfxRuntime {
  if (runtime) return runtime

  const optimizer = VFXOptimizer.getInstance()
  optimizer.bindQualityManager()

  const dust = new DustParticles()
  const fireflies = new FireflyParticles()
  const sparks = new SparkTrail()
  const confetti = new ConfettiEffect()
  const powerSurge = new PowerSurgeGlow()
  const ropeGlow = new RopeGlow()
  const winGlow = new WinGlow()
  const combo = new ComboEffect()
  const rain = new RainEffect()
  const fog = new FogEffect()
  const snow = new SnowEffect()

  ropeGlow.create()

  optimizer.registerEffect(dust)
  optimizer.registerEffect(fireflies)
  optimizer.registerEffect(sparks)
  optimizer.registerEffect(confetti)
  optimizer.registerEffect(powerSurge)
  optimizer.registerEffect(ropeGlow)
  optimizer.registerEffect(winGlow)
  optimizer.registerEffect(combo)

  runtime = { dust, fireflies, sparks, confetti, powerSurge, ropeGlow, winGlow, combo, rain, fog, snow }
  applyVfxPlatform(isMobileClient())
  console.log('[vfx] mobile-friendly system ready')
  return runtime
}

export function getVfx(): VfxRuntime | null {
  return runtime
}

export function applyVfxPlatform(mobile: boolean): void {
  const optimizer = VFXOptimizer.getInstance()
  if (mobile) {
    optimizer.setQuality('medium', true)
    runtime?.fireflies.setActive(false)
    return
  }
  const mapped = mapQualityLevel(QualityManager.getInstance().getLevel())
  optimizer.setQuality(mapped === 'medium' ? 'high' : mapped, false)
  runtime?.fireflies.setActive(optimizer.firefliesAllowed())
}

export function tickVfx(dt: number, weather?: WeatherKind, weatherIntensity?: number): void {
  if (!runtime) return
  runtime.dust.update(dt)
  runtime.fireflies.update(dt)
  runtime.sparks.update(dt)
  runtime.confetti.update(dt)
  runtime.powerSurge.update(dt)
  runtime.winGlow.update(dt)
  runtime.combo.update(dt)
  runtime.rain.update(dt)
  runtime.fog.update(dt)

  if (weather !== undefined) {
    const intensity = weatherIntensity ?? 1
    if (weather !== lastWeather || intensity !== lastWeatherIntensity) {
      lastWeather = weather
      lastWeatherIntensity = intensity
      if (weather === 'fog') {
        runtime.fog.create()
      } else {
        runtime.fog.destroy()
      }
    }
  }
}

export function triggerPowerSurge(position: Vector3, team: TeamAlias): void {
  const crew: CrewId = normalizeTeam(team)
  const color = crewColor(crew)
  runtime?.powerSurge.trigger(position, color)
  burstPowerSurge(crew)
}

export function triggerCelebration(position: Vector3 = Vector3.create(ARENA_CENTER.x, 4.4, ARENA_CENTER.z)): void {
  runtime?.confetti.burst(position, 80, 4)
  runtime?.winGlow.trigger(Vector3.create(position.x, 1.4, position.z), gold)
}

export function showCombo(count: number): void {
  if (runtime) {
    runtime.combo.show(`${Math.max(1, Math.floor(count))}x Combo!`)
    return
  }
  showComboPopup(count, VFXOptimizer.getInstance().isMobile())
}

export function emitSpark(position: Vector3): void {
  runtime?.sparks.emit(position)
}

export function pulseRopeGlow(position: Vector3, pull: number): void {
  const intensity = Math.min(1, Math.abs(pull) / PULL_MAX)
  runtime?.ropeGlow.follow(position, intensity)
}

export function resetVfx(): void {
  VFXOptimizer.getInstance().destroyAll()
  VFXOptimizer.resetInstance()
  runtime = null
  lastWeather = null
  lastWeatherIntensity = -1
}

export { ComboEffect } from './ComboEffect'
export { ConfettiEffect } from './ConfettiEffect'
export { DustParticles } from './DustParticles'
export { FogEffect, RainEffect, SnowEffect, syncEnvironmentalVfx } from './EnvironmentalVFX'
export { FireflyParticles } from './FireflyParticles'
export { ParticleSystem, type ParticleConfig } from './ParticleSystem'
export { PowerSurgeGlow, RopeGlow, WinGlow } from './PowerSurgeGlow'
export { SparkTrail, TrailParticles } from './SparkTrail'
export { VFXOptimizer } from './VFXOptimizer'
export * from './budgets'
export * from './comboState'
export * from './simulation'
