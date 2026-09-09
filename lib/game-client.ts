import { GameInput, mapArenaControl } from "@/lib/mobile";
import type { SwipeDirection } from "@/lib/animations";

/**
 * Companion input bridge. Gesture components talk to this instead of Redux.
 * Taps map to pull (IA_POINTER); upward swipes map to surge (IA_PRIMARY).
 */
export class GameClient {
  static sendTap(): void {
    GameInput.getInstance().emit(mapArenaControl("pull"));
  }

  static sendSwipe(direction: SwipeDirection, _intensity = 1): void {
    if (direction === "up") {
      GameInput.getInstance().emit(mapArenaControl("surge"));
    }
  }
}
