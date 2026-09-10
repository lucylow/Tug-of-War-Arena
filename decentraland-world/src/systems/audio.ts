export function playOptional(name: 'ambience' | 'pull' | 'start' | 'victory'): void {
  try {
    const audio = (globalThis as { Audio?: { play?: (clip: string) => void } }).Audio
    audio?.play?.(name)
  } catch {
    // Missing audio assets or APIs must never crash the World.
  }
}
