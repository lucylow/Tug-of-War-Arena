/**
 * Local platform flag so performance modules stay free of `@dcl/sdk`.
 * `setupPerformance({ mobile })` sets this from the scene boot path.
 */

let mobileClient = true

export function configurePerformanceHost(options: { mobile?: boolean } = {}): void {
  if (options.mobile !== undefined) {
    mobileClient = options.mobile
  }
}

export function isMobileClient(): boolean {
  return mobileClient
}

export function resetPerformanceHost(): void {
  mobileClient = true
}
