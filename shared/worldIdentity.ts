export interface WorldIdentity {
  worldName: string;
  worldTitle: string;
  description: string;
  contentRating: string;
  categories: string[];
  environment: "decentraland-world";
}

export const WORLD_TITLE = "Tug of War Arena: Friendzone";
export const WORLD_NAME_PLACEHOLDER = "YOUR-NAME.dcl.eth";

function readEnvWorldName(): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  const fromWorld = process.env.WORLD_NAME_FROM_ENV?.trim();
  const fromExpo = process.env.EXPO_PUBLIC_WORLD_NAME?.trim();
  return fromWorld || fromExpo || undefined;
}

/**
 * Placeholder World name until a real `.dcl.eth` name is published.
 * Do not invent a production name here.
 */
export function resolveWorldName(explicit?: string | null): string {
  const candidate = explicit?.trim() || readEnvWorldName();
  if (candidate) return candidate;
  return WORLD_NAME_PLACEHOLDER;
}

export function createWorldIdentity(overrides: Partial<WorldIdentity> = {}): WorldIdentity {
  return {
    worldName: resolveWorldName(overrides.worldName),
    worldTitle: overrides.worldTitle ?? WORLD_TITLE,
    description:
      overrides.description ??
      "A social tug-of-war arena for Friendzone: join a crew, pull, react, and explore the 3D World.",
    contentRating: overrides.contentRating ?? "Everyone",
    categories: overrides.categories ?? ["game", "social", "arena", "friendzone"],
    environment: "decentraland-world",
  };
}

export const FRIENDZONE_WORLD_IDENTITY = createWorldIdentity();
