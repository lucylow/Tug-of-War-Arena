export const ARENA_CENTER = { x: 16, y: 0, z: 16 }

export function ropeX(pull: number, segments = 19): number[] {
  const t = Math.max(-1, Math.min(1, pull))
  const xs: number[] = []
  for (let i = 0; i < segments; i += 1) {
    const u = i / (segments - 1)
    xs.push(ARENA_CENTER.x - 8 + u * 16 + t * 1.6)
  }
  return xs
}

export function ropeY(i: number, segments = 19, sag = 0.35): number {
  const u = i / (segments - 1)
  return 1.45 + Math.sin(u * Math.PI) * sag
}

export function isFeaturedPlayer(id: string, featured: readonly string[]): boolean {
  return featured.includes(id)
}

export function isNearArena(x: number, z: number, radius = 8): boolean {
  const dx = x - ARENA_CENTER.x
  const dz = z - ARENA_CENTER.z
  return dx * dx + dz * dz <= radius * radius
}

export function isVisibleArea(distance: number): boolean {
  return distance < 22
}
