import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

import { canPlayHaptics } from "./haptics-policy";

export type HapticKind = "light" | "medium" | "heavy" | "success" | "error" | "warning";
export { canPlayHaptics };

async function safeRun(task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch {
    // Haptics are optional; native capability failures must never block play.
  }
}

export class HapticService {
  static light(): void {
    if (!canPlayHaptics(Platform.OS)) return;
    void safeRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  }

  static medium(): void {
    if (!canPlayHaptics(Platform.OS)) return;
    void safeRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  }

  static heavy(): void {
    if (!canPlayHaptics(Platform.OS)) return;
    void safeRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  }

  static success(): void {
    if (!canPlayHaptics(Platform.OS)) return;
    void safeRun(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  }

  static error(): void {
    if (!canPlayHaptics(Platform.OS)) return;
    void safeRun(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  }

  static warning(): void {
    if (!canPlayHaptics(Platform.OS)) return;
    void safeRun(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  }

  static play(kind: HapticKind): void {
    switch (kind) {
      case "light":
        this.light();
        return;
      case "medium":
        this.medium();
        return;
      case "heavy":
        this.heavy();
        return;
      case "success":
        this.success();
        return;
      case "error":
        this.error();
        return;
      case "warning":
        this.warning();
        return;
    }
  }
}
