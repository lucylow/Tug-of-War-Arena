import { Billboard, Entity, TextShape, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'

import { ARENA_CENTER } from '../logic/mapping'
import { gold, withAlpha } from '../palette'
import { comboAlpha, getComboPopup, hideComboPopup, showComboPopup, tickComboPopup } from './comboState'

/**
 * World-space combo popup. UI also reads `comboState` for the 2D overlay.
 */
export class ComboEffect {
  readonly name = 'combo'
  private entity: Entity | null = null
  private readonly isMobileDevice: boolean
  private color: Color4 = gold

  constructor() {
    this.isMobileDevice = isMobile()
  }

  show(text: string, color: Color4 = gold): void {
    const match = /(\d+)/.exec(text)
    const count = match ? Number(match[1]) : 1
    this.color = color
    showComboPopup(count, this.isMobileDevice)
    const popup = getComboPopup()
    popup.text = text
    this.ensureEntity()
    this.apply(popup.text, 1)
  }

  update(dt: number): void {
    const popup = tickComboPopup(dt)
    if (!popup.active) {
      if (this.entity && Transform.has(this.entity)) {
        Transform.getMutable(this.entity).scale = Vector3.create(0, 0, 0)
      }
      return
    }
    this.ensureEntity()
    const alpha = comboAlpha(popup)
    const pop = 1 + (1 - popup.age / popup.duration) * 0.22
    this.apply(popup.text, alpha, pop)
  }

  hide(): void {
    hideComboPopup()
    if (this.entity && Transform.has(this.entity)) {
      Transform.getMutable(this.entity).scale = Vector3.create(0, 0, 0)
    }
  }

  setActive(active: boolean): void {
    if (!active) this.hide()
  }

  destroy(): void {
    this.hide()
    if (this.entity) {
      engine.removeEntity(this.entity)
      this.entity = null
    }
  }

  private ensureEntity(): void {
    if (this.entity) return
    const entity = engine.addEntity()
    Transform.create(entity, {
      position: Vector3.create(ARENA_CENTER.x, 3.35, ARENA_CENTER.z),
      scale: Vector3.create(1, 1, 1),
    })
    TextShape.create(entity, {
      text: '',
      fontSize: this.isMobileDevice ? 2.2 : 3.1,
      textColor: this.color,
    })
    Billboard.create(entity)
    this.entity = entity
  }

  private apply(text: string, alpha: number, scale: number = 1): void {
    if (!this.entity) return
    TextShape.getMutable(this.entity).text = text
    TextShape.getMutable(this.entity).textColor = withAlpha(this.color, alpha)
    Transform.getMutable(this.entity).scale = Vector3.create(scale, scale, scale)
  }
}
