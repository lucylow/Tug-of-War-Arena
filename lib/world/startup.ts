export type MobileStartupStep =
  | "load_local_state"
  | "detect_runtime"
  | "detect_wallet"
  | "load_world_feed"
  | "hydrate_ui"
  | "start_sync";

export const MOBILE_STARTUP: MobileStartupStep[] = [
  "load_local_state",
  "detect_runtime",
  "detect_wallet",
  "load_world_feed",
  "hydrate_ui",
  "start_sync",
];

export const MOBILE_FIRST_FRAME = ["app_shell", "crew_state", "arena_entry"] as const;

export const WORLD_STARTUP = [
  "initialize_scene",
  "build_static_graphics",
  "load_demo_state",
  "create_arena",
  "create_social_systems",
  "start_schedulers",
] as const;

export const WORLD_FIRST_FRAME = ["spawn", "arena", "sun_base", "moon_base"] as const;
export const WORLD_SECOND_PASS = ["events", "social", "governance", "achievement", "ambient"] as const;
