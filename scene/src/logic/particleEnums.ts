/**
 * ParticleSystem enums from the SDK protobuf schema.
 * `@dcl/sdk` exports these as TypeScript const enums, which esbuild cannot
 * import as runtime values from `ecs.js`.
 */

export const ParticleBlend = {
  ALPHA: 0,
  ADD: 1,
  MULTIPLY: 2,
} as const

export type ParticleBlendMode = (typeof ParticleBlend)[keyof typeof ParticleBlend]

export const ParticlePlayback = {
  PLAYING: 0,
  PAUSED: 1,
  STOPPED: 2,
} as const

export type ParticlePlaybackState = (typeof ParticlePlayback)[keyof typeof ParticlePlayback]
