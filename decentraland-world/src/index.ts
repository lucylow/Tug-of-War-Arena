;(globalThis as { __FRIENDZONE_RUNTIME__?: string }).__FRIENDZONE_RUNTIME__ = 'decentraland'

import { assembleWorld } from './world'

export function main() {
  try {
    assembleWorld()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error(`[world] assembleWorld failed: ${message}`)
  }
}
