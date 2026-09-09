/**
 * Touch input mapping for the Decentraland mobile client and the Expo companion.
 *
 * Desktop `InputAction` values are routed from on-screen controls on mobile.
 * Key actions must not use IA_ACTION_3–IA_ACTION_6 (the 1/2/3/4 keys) — they
 * sit behind a secondary menu and are not reachable during play.
 *
 * Companion mapping:
 * - Pull  → POINTER (interaction button / primary tap)
 * - Surge → PRIMARY (E / primary action button)
 * - Ready / rematch → SECONDARY (F / secondary action button)
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/input-on-mobile
 */

import { isMobile } from "./platform";

export type InputAction =
  | "IA_POINTER"
  | "IA_PRIMARY"
  | "IA_SECONDARY"
  | "IA_JUMP"
  | "IA_FORWARD"
  | "IA_BACKWARD"
  | "IA_LEFT"
  | "IA_RIGHT"
  | "IA_ACTION_3"
  | "IA_ACTION_4"
  | "IA_ACTION_5"
  | "IA_ACTION_6";

export type ArenaControl = "pull" | "surge" | "ready" | "jump";

export const BLOCKED_MOBILE_ACTIONS: readonly InputAction[] = [
  "IA_ACTION_3",
  "IA_ACTION_4",
  "IA_ACTION_5",
  "IA_ACTION_6",
];

export const MobileInputMap = {
  TAP: "IA_POINTER",
  PRIMARY_ACTION: "IA_PRIMARY",
  SECONDARY_ACTION: "IA_SECONDARY",
  JUMP: "IA_JUMP",
} as const satisfies Record<string, InputAction>;

export function isMobileFriendlyAction(action: InputAction): boolean {
  return !BLOCKED_MOBILE_ACTIONS.includes(action);
}

export function mapArenaControl(control: ArenaControl): InputAction {
  switch (control) {
    case "pull":
      return MobileInputMap.TAP;
    case "surge":
      return MobileInputMap.PRIMARY_ACTION;
    case "ready":
      return MobileInputMap.SECONDARY_ACTION;
    case "jump":
      return MobileInputMap.JUMP;
  }
}

export type InputRegistration = { registered: true } | { registered: false; reason: string };

type Handler = () => void;

/**
 * Registers mobile-friendly input handlers. Blocked actions are skipped on
 * mobile instead of silently binding to unreachable 1/2/3/4 keys.
 */
export class GameInput {
  private static instance: GameInput | null = null;
  private handlers = new Map<InputAction, Handler[]>();

  static getInstance(): GameInput {
    if (!GameInput.instance) GameInput.instance = new GameInput();
    return GameInput.instance;
  }

  static resetInstance(): void {
    GameInput.instance = null;
  }

  registerAction(action: InputAction, handler: Handler): InputRegistration {
    if (isMobile() && !isMobileFriendlyAction(action)) {
      return { registered: false, reason: `${action} is not reachable on mobile` };
    }
    const list = this.handlers.get(action) ?? [];
    list.push(handler);
    this.handlers.set(action, list);
    return { registered: true };
  }

  onTap(handler: Handler): InputRegistration {
    return this.registerAction(MobileInputMap.TAP, handler);
  }

  onPrimaryAction(handler: Handler): InputRegistration {
    return this.registerAction(MobileInputMap.PRIMARY_ACTION, handler);
  }

  onSecondaryAction(handler: Handler): InputRegistration {
    return this.registerAction(MobileInputMap.SECONDARY_ACTION, handler);
  }

  onJump(handler: Handler): InputRegistration {
    return this.registerAction(MobileInputMap.JUMP, handler);
  }

  emit(action: InputAction): number {
    const list = this.handlers.get(action) ?? [];
    for (const handler of list) handler();
    return list.length;
  }
}

export function setupMobileInput(): void {
  if (!isMobile()) return;
}
