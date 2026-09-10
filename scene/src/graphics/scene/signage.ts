import { Billboard, TextShape, Transform, engine, type Entity } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import {
  getHeroSignBackplate,
  getHeroSignLabelPosition,
  getHeroSignSubtitlePosition,
  getLoopSignBackplate,
  getLoopSignLabelPosition,
} from '../../logic/graphicsLayout'
import type { Vec3 } from '../../logic/mapping'
import { GRAPHIC_COLORS, toColor4, type GraphicColor } from '../materials'
import { createBox } from '../primitives'

function label(text: string, position: Vec3, size: number, color: GraphicColor = GRAPHIC_COLORS.white): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position: Vector3.create(position.x, position.y, position.z) })
  Billboard.create(entity)
  TextShape.create(entity, { text, fontSize: size, textColor: toColor4(color) })
  return entity
}

export function buildGraphicSignage(): void {
  const hero = getHeroSignBackplate()
  createBox(hero.position, hero.scale, hero.tone, { emissive: true })
  label('FRIENDZONE', getHeroSignLabelPosition(), 1.45, GRAPHIC_COLORS.pinkSoft)
  label('TUG OF WAR ARENA', getHeroSignSubtitlePosition(), 0.58, GRAPHIC_COLORS.white)

  const loop = getLoopSignBackplate()
  createBox(loop.position, loop.scale, loop.tone, { emissive: true })
  label('PULL TOGETHER • REACT • REMATCH', getLoopSignLabelPosition(), 0.5, GRAPHIC_COLORS.cyan)
}
