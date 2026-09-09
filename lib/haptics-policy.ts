export function canPlayHaptics(os: string): boolean {
  return os !== "web";
}
