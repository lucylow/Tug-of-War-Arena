export const DISCOVER_REQUIREMENTS = {
  performance: { minScore: 90 },
  ui: { minTouchTarget: 44, safeArea: true, mobileSizing: true },
  input: { avoidActions: ['IA_ACTION_3', 'IA_ACTION_4', 'IA_ACTION_5', 'IA_ACTION_6'] },
  testing: { requireRealDevice: true, recommendedDevice: 'Samsung Galaxy A54' },
} as const

export const FEATURED_SUBMIT_URL =
  'https://docs.decentraland.org/creator/build-for-mobile/develop/get-featured'

export function submitForFeaturing(): string {
  return FEATURED_SUBMIT_URL
}
