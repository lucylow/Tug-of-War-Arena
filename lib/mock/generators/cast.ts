export type FeaturedFaction = "red" | "blue";

export type FeaturedCastMember = {
  displayName: string;
  email: string;
  faction: FeaturedFaction;
  wins: number;
  losses: number;
  extraMatches: number;
  verified: boolean;
  role: string;
};

export const FEATURED_DEMO_CAST: readonly FeaturedCastMember[] = [
  { displayName: "Arena Captain", email: "captain@friendzone.local", faction: "red", wins: 18, losses: 4, extraMatches: 2, verified: true, role: "Sun Crew captain" },
  { displayName: "RopeRanger", email: "roperanger@friendzone.local", faction: "red", wins: 22, losses: 6, extraMatches: 3, verified: true, role: "Watching the arena" },
  { displayName: "PixelPuller", email: "pixelpuller@friendzone.local", faction: "blue", wins: 15, losses: 8, extraMatches: 2, verified: true, role: "Moon Crew scout" },
  { displayName: "NovaNina", email: "novanina@friendzone.local", faction: "red", wins: 12, losses: 5, extraMatches: 1, verified: true, role: "Sun Crew captain" },
  { displayName: "MoonRunner", email: "moonrunner@friendzone.local", faction: "blue", wins: 11, losses: 7, extraMatches: 2, verified: true, role: "Building a streak" },
  { displayName: "SunSpark", email: "sunspark@friendzone.local", faction: "red", wins: 9, losses: 6, extraMatches: 1, verified: true, role: "Ready for Plaza Sprint" },
  { displayName: "TorqueKid", email: "torquekid@friendzone.local", faction: "blue", wins: 8, losses: 9, extraMatches: 0, verified: false, role: "Last seen 12m ago" },
  { displayName: "CloudPull", email: "cloudpull@friendzone.local", faction: "red", wins: 7, losses: 4, extraMatches: 2, verified: false, role: "Queued for a match" },
  { displayName: "ManaMax", email: "manamax@friendzone.local", faction: "blue", wins: 14, losses: 3, extraMatches: 1, verified: true, role: "In Plaza" },
  { displayName: "DecentraDeb", email: "decentradeb@friendzone.local", faction: "blue", wins: 10, losses: 8, extraMatches: 2, verified: true, role: "At Arena" },
  { displayName: "OrbitAce", email: "orbitace@friendzone.local", faction: "red", wins: 6, losses: 5, extraMatches: 1, verified: false, role: "Friendzone lounge" },
  { displayName: "NeonTug", email: "neontug@friendzone.local", faction: "blue", wins: 5, losses: 3, extraMatches: 4, verified: false, role: "Queued for a match" },
];

export const WEARABLE_NAMES = [
  "Sun Rope",
  "Moon Gauntlet",
  "Plaza Banner",
  "Captain Sash",
  "Neon Pull Gloves",
  "Arena Crown",
  "Friendzone Pin",
  "Torque Boots",
  "Orbit Visor",
  "Cloud Cape",
] as const;
