import { Entity, Material, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'

import { ARENA_CENTER } from '../logic/mapping'
import { gold, withAlpha } from '../palette'
import { glowFrame } from './simulation'
import { powerSurgeDuration, powerSurgeMaxScale } from './budgets'

function applyGlowMaterial(entity: Entity, color: Color4, alpha: number, intensity: number): void {
  Material.setPbrMaterial(entity, {
    albedoColor: withAlpha(color, Math.max(0, alpha) * 0.8),
    emissiveColor: color,
    emissiveIntensity: Math.max(0, intensity),
    metallic: 0.35,
    roughness: 0.25,
  })
}

/**
 * Expanding disc for power spikes. One flat cylinder — cheap on mobile.
 */
export class PowerSurgeGlow {
  readonly name = 'power-surge'
  private entity: Entity | null = null
  private isActive = false
  private readonly isMobileDevice: boolean
  private onComplete: (() => void) | null = null
  private maxScale: number
  private duration: number
  private elapsed = 0
  private teamColor: Color4

  constructor(teamColor: Color4 = Color4.create(1, 0.2, 0.2, 1)) {
    this.teamColor = teamColor
    this.isMobileDevice = isMobile()
    this.maxScale = powerSurgeMaxScale(this.isMobileDevice)
    this.duration = powerSurgeDuration(this.isMobileDevice)
  }

  trigger(position: Vector3, color?: Color4): void {
    if (this.isActive) return
    if (color) this.teamColor = color
    this.isActive = true
    this.elapsed = 0

    if (!this.entity) {
      this.entity = engine.addEntity()
      MeshRenderer.setCylinder(this.entity)
    }

    if (Transform.has(this.entity)) {
      const transform = Transform.getMutable(this.entity)
      transform.position = position
      transform.scale = Vector3.create(0.1, 0.02, 0.1)
    } else {
      Transform.create(this.entity, {
        position,
        scale: Vector3.create(0.1, 0.02, 0.1),
      })
    }
    applyGlowMaterial(this.entity, this.teamColor, 0.9, 2)
  }

  update(dt: number): void {
    if (!this.isActive || !this.entity) return
    this.elapsed += dt
    const frame = glowFrame(this.elapsed, this.duration, this.maxScale)
    if (frame.done) {
      this.isActive = false
      Transform.getMutable(this.entity).scale = Vector3.create(0, 0, 0)
      this.onComplete?.()
      return
    }
    Transform.getMutable(this.entity).scale = Vector3.create(frame.scale, 0.02, frame.scale)
    applyGlowMaterial(this.entity, this.teamColor, frame.alpha, (1 - frame.progress) * 2)
  }

  onCompleteCallback(callback: () => void): void {
    this.onComplete = callback
  }

  setActive(active: boolean): void {
    if (active) return
    this.isActive = false
    if (this.entity && Transform.has(this.entity)) {
      Transform.getMutable(this.entity).scale = Vector3.create(0, 0, 0)
    }
  }

  destroy(): void {
    if (this.entity) {
      engine.removeEntity(this.entity)
      this.entity = null
    }
    this.isActive = false
  }
}

/**
 * Soft orb that rides the rope knot and brightens as pull climbs.
 */
export class RopeGlow {
  readonly name = 'rope-glow'
  private entity: Entity | null = null
  private enabled = true

  create(): Entity {
    if (this.entity) return this.entity
    this.entity = engine.addEntity()
    Transform.create(this.entity, {
      position: Vector3.create(ARENA_CENTER.x, 1.55, ARENA_CENTER.z),
      scale: Vector3.create(0.45, 0.45, 0.45),
    })
    MeshRenderer.setSphere(this.entity)
    applyGlowMaterial(this.entity, gold, 0.2, 1.2)
    return this.entity
  }

  follow(position: Vector3, intensity: number): void {
    if (!this.enabled) return
    if (!this.entity) this.create()
    const transform = Transform.getMutable(this.entity!)
    transform.position = Vector3.create(position.x, position.y, position.z)
    const scale = 0.32 + Math.min(1, Math.max(0, intensity)) * 0.7
    transform.scale = Vector3.create(scale, scale, scale)
    applyGlowMaterial(this.entity!, gold, 0.12 + intensity * 0.25, 0.8 + intensity * 2)
  }

  setActive(active: boolean): void {
    this.enabled = active
    if (this.entity && Transform.has(this.entity)) {
      Transform.getMutable(this.entity).scale = active
        ? Vector3.create(0.45, 0.45, 0.45)
        : Vector3.create(0, 0, 0)
    }
  }

  destroy(): void {
    if (this.entity) {
      engine.removeEntity(this.entity)
      this.entity = null
    }
  }
}

/**
 * Wide win flash at the plaza center.
 */
export class WinGlow {
  readonly name = 'win-glow'
  private readonly surge: PowerSurgeGlow

  constructor(color: Color4 = gold) {
    this.surge = new PowerSurgeGlow(color)
  }

  trigger(position: Vector3 = Vector3.create(ARENA_CENTER.x, 1.4, ARENA_CENTER.z), color?: Color4): void {
    this.surge.trigger(position, color)
  }

  update(dt: number): void {
    this.surge.update(dt)
  }

  setActive(active: boolean): void {
    this.surge.setActive(active)
  }

  destroy(): void {
    this.surge.destroy()
  }
}
