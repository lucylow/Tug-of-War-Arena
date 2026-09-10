import { WORLD_COPY } from "../../shared/copy";
import { createWorldInvite as createInvite, parseWorldInvite as parseInvite, type WorldInvite } from "../../shared/invite";

export { createWorldInvite, parseWorldInvite, type WorldInvite } from "../../shared/invite";

export const INVITE_EXPIRED_MESSAGE = WORLD_COPY.inviteExpired;

export function httpsInviteBase(): string | null {
  if (typeof process === "undefined" || !process.env) return null;
  const raw = process.env.EXPO_PUBLIC_FRIENDZONE_DEEPLINK_HOST?.trim();
  return raw || null;
}

export function buildWorldInvite(roomCode: string): WorldInvite | null {
  return createInvite(roomCode, httpsInviteBase());
}

export function parseWorldInviteSafe(raw: string | null | undefined): { invite: WorldInvite | null; error: string | null } {
  try {
    const invite = parseInvite(raw);
    if (!invite) return { invite: null, error: INVITE_EXPIRED_MESSAGE };
    return { invite, error: null };
  } catch {
    return { invite: null, error: INVITE_EXPIRED_MESSAGE };
  }
}
