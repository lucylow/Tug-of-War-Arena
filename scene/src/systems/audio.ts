import { AudioSource, Entity, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { ENABLE_SCENE_AUDIO, SOUNDS } from '../config'
import { ARENA_CENTER } from '../logic/mapping'
import { ambientVolume, sfxVolume } from '../logic/visualFx'

const sources: Entity[] = []
let sfxBus: Entity | null = null

export function addAmbientSound(position: Vector3, clip: string, loop: boolean = true): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position })
  try {
    AudioSource.create(entity, {
      audioClipUrl: clip,
      playing: ENABLE_SCENE_AUDIO,
      loop,
      volume: ambientVolume(),
    })
  } catch (error) {
    console.log('[audio] Ambient clip failed', clip, error)
  }
  sources.push(entity)
  return entity
}

export function playSfx(clip: string, volume: number): void {
  if (!ENABLE_SCENE_AUDIO || !sfxBus) return
  try {
    if (AudioSource.has(sfxBus)) {
      AudioSource.getMutable(sfxBus).volume = volume
    }
    AudioSource.playSound(sfxBus, clip, true)
  } catch (error) {
    console.log('[audio] SFX failed', clip, error)
  }
}

export function playPullSound(): void {
  playSfx(SOUNDS.pull, sfxVolume('pull'))
}

export function playSurgeSound(): void {
  playSfx(SOUNDS.surge, sfxVolume('surge'))
}

export function playComboSound(): void {
  playSfx(SOUNDS.combo, sfxVolume('combo'))
}

export function setupAudio(): Entity[] {
  if (!ENABLE_SCENE_AUDIO) return []
  try {
    addAmbientSound(Vector3.create(ARENA_CENTER.x, 1.2, ARENA_CENTER.z), SOUNDS.ambientCrowd, true)
    sfxBus = engine.addEntity()
    Transform.create(sfxBus, { position: Vector3.create(ARENA_CENTER.x, 1.6, ARENA_CENTER.z) })
    AudioSource.create(sfxBus, {
      audioClipUrl: SOUNDS.pull,
      playing: false,
      loop: false,
      volume: sfxVolume('pull'),
    })
    sources.push(sfxBus)
  } catch (error) {
    console.log('[audio] AudioSource unavailable', error)
    return sources
  }
  return sources
}
