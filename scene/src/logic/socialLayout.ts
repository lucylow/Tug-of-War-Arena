/**
 * Social overlay placement. Kept free of Decentraland SDK imports so companion
 * tests can assert the icon sits in the mobile safe band.
 *
 * Mobile interactable band: x 30%–75%, y 8%–92%.
 */
export function getSocialOverlayLayout(isOnMobile: boolean) {
  const size = isOnMobile ? 56 : 40;
  return {
    leftPercent: isOnMobile ? 62 : 72,
    topPercent: isOnMobile ? 10 : 22,
    width: size,
    height: size,
    fontSize: isOnMobile ? 13 : 12,
    label: "CREW",
  };
}

export function isSocialOverlayInSafeBand(leftPercent: number, topPercent: number, isOnMobile: boolean): boolean {
  if (!isOnMobile) return leftPercent >= 60 && topPercent >= 8;
  return leftPercent >= 30 && leftPercent <= 75 && topPercent >= 8 && topPercent <= 92;
}
