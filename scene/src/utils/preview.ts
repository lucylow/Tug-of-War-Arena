export function mobilePreviewInstructions(): string {
  return [
    'Mobile preview',
    '1. Phone and machine on the same Wi-Fi.',
    '2. Install the Decentraland mobile app.',
    '3. From scene/: npm run start:mobile',
    '4. Scan the QR code. Hot reload updates without re-scanning.',
  ].join('\n')
}
