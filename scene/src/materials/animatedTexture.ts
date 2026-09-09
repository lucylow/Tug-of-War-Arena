/**
 * UV-scroll helpers. SDK7 PBR does not expose texture offset, so moving
 * energy is simulated with wrapped UV math (for GLB-baked clips) plus an
 * emissive proxy the runtime can apply each frame.
 */

import { emissiveScrollProxy, scrollUvOffset, wrap01, type Vec2 } from '../logic/visualFx'

export type UvAnimation = {
  offset: Vec2
  speed: Vec2
}

export function createUvAnimation(speedX: number = 0.1, speedY: number = 0.05): UvAnimation {
  return {
    offset: { x: 0, y: 0 },
    speed: { x: speedX, y: speedY },
  }
}

export function stepUvAnimation(animation: UvAnimation, dt: number): UvAnimation {
  return {
    ...animation,
    offset: scrollUvOffset(animation.offset, dt, animation.speed),
  }
}

export function uvOffsetArray(offset: Vec2): number[] {
  return [wrap01(offset.x), wrap01(offset.y)]
}

export { emissiveScrollProxy, scrollUvOffset }
