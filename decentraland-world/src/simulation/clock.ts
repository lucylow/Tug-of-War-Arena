export class DemoWorldClock {
  private nowMs: number
  private paused = false
  private readonly origin: number

  constructor(start = 1_725_968_000_000) {
    this.origin = start
    this.nowMs = start
  }

  now(): number {
    return this.nowMs
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
  }

  advance(ms: number): number {
    if (!this.paused) this.nowMs += Math.max(0, ms)
    return this.nowMs
  }

  reset(): void {
    this.nowMs = this.origin
    this.paused = false
  }
}
