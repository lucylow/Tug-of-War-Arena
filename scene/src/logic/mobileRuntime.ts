/**
 * Runtime policy for the Decentraland mobile explorer (Godot client).
 * Kept free of `@dcl/sdk` so Vitest can cover the same decisions the scene boots with.
 *
 * LightSource is still missing on mobile until explorer v1.13.0.
 * Interactable UI inset needs mobile client 1.12.1+.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/mobile-client/missing-features
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/safe-area
 */

export const MOBILE_EXPLORER_MIN_INTERACTABLE = '1.12.1'
export const POINTER_MAX_DISTANCE = 32

export type LightingPolicy = {
  skyboxTime: boolean
  dynamicLights: boolean
  shadows: boolean
}

export function lightingPolicy(mobile: boolean): LightingPolicy {
  return {
    skyboxTime: true,
    dynamicLights: !mobile,
    shadows: !mobile,
  }
}

export type HudPolicy = {
  virtualWidth: number
  virtualHeight: number
  screenInset?: 'none' | 'device' | 'interactable'
  showWeather: boolean
  showVignette: boolean
  showSocial: boolean
  stackMeters: boolean
  justifyContent: 'center' | 'space-between'
  pullWidth: number
  pullHeight: number
  secondaryWidth: number
  secondaryHeight: number
  fontSize: number
}

export function getArenaHudPolicy(mobile: boolean): HudPolicy {
  if (mobile) {
    return {
      virtualWidth: 1600,
      virtualHeight: 720,
      screenInset: 'interactable',
      showWeather: false,
      showVignette: false,
      showSocial: true,
      stackMeters: true,
      justifyContent: 'center',
      pullWidth: 220,
      pullHeight: 64,
      secondaryWidth: 160,
      secondaryHeight: 56,
      fontSize: 22,
    }
  }
  return {
    virtualWidth: 1920,
    virtualHeight: 1080,
    showWeather: true,
    showVignette: true,
    showSocial: true,
    stackMeters: false,
    justifyContent: 'space-between',
    pullWidth: 160,
    pullHeight: 48,
    secondaryWidth: 160,
    secondaryHeight: 48,
    fontSize: 18,
  }
}

export function defaultWeatherForPlatform(mobile: boolean): 'clear' | 'sparkle' {
  return mobile ? 'clear' : 'sparkle'
}
