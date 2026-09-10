import { HapticService } from "@/lib/haptics";

function haptic(kind: "light" | "medium" | "success"): void {
  try {
    HapticService.play(kind);
  } catch {
    // Unsupported haptic APIs must not crash play.
  }
}

export function onPrimaryPress(): void {
  haptic("medium");
}

export function onSecondaryPress(): void {
  haptic("light");
}

export function onPullPress(): void {
  haptic("medium");
}

export function onReactionPress(): void {
  haptic("light");
}
