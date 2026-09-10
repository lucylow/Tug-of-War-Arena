const last = new Map<string, number>()

export function canPull(playerId: string, now = Date.now(), interval = 220): boolean {
  return now - (last.get(playerId) ?? 0) >= interval
}

export function recordPull(playerId: string, now = Date.now()): void {
  last.set(playerId, now)
}

export function resetPlayer(playerId: string): void {
  last.delete(playerId)
}

export function resetInputLimiter(): void {
  last.clear()
}
