export function runWorldStep(name: string, step: () => void): boolean {
  try {
    step()
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error(`[world] ${name} failed: ${message}`)
    return false
  }
}

export function runWorldValue<T>(name: string, step: () => T, fallback: () => T): T {
  try {
    return step()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error(`[world] ${name} failed: ${message}`)
    return fallback()
  }
}
