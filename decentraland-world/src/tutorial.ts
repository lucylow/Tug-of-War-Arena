import { gold } from './palette'
import { worldLabel } from './logic/labels'

const STEPS = [
  '1. Choose Sun or Moon.',
  '2. Walk to the PULL pad.',
  '3. Pull the rope.',
  '4. React.',
  '5. View results.',
  '6. Explore the World.',
]

export function createWorldTutorial(firstRun = true): void {
  if (!firstRun) return
  worldLabel({ x: 16, y: 2.2, z: 8.4 }, `WELCOME\n${STEPS.join('\n')}`, gold, 0.7)
}
