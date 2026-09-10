;(globalThis as { __FRIENDZONE_RUNTIME__?: string }).__FRIENDZONE_RUNTIME__ = 'decentraland'

import { assembleWorld } from './world'

export function main() {
  assembleWorld()
}
