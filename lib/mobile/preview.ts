/**
 * Mobile preview / hot-reload notes for the Expo companion and a DCL scene.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/preview-on-mobile
 */

export const PREVIEW_COMMANDS = {
  companion: "pnpm start:mobile",
  companionIos: "pnpm ios",
  companionAndroid: "pnpm android",
  scene: "pnpm scene:start:mobile",
  qr: "pnpm qr",
} as const;

export function mobilePreviewInstructions(): string {
  return [
    "Mobile preview",
    "1. Phone and machine on the same Wi-Fi (or use the Expo tunnel).",
    "2. Install Expo Go (companion) and/or the Decentraland mobile app (scene).",
    "3. Companion: pnpm start:mobile",
    "4. Decentraland app: pnpm scene:start:mobile  (prints a QR for the explorer)",
    "5. Scan the QR code. Hot reload updates without re-scanning.",
    "6. If the QR does not open, launch the target app once, then retry.",
  ].join("\n");
}
