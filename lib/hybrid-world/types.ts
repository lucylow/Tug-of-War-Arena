export type WorldMode = "demo" | "live";
export type Team = "sun" | "moon";
export type WorldPresence = "online" | "away" | "offline";
export type WorldZone = "sun-base" | "moon-base" | "spectator" | "plaza";
export type WorldRoomPhase = "waiting" | "countdown" | "active" | "finished";
export type WorldEventKind = "match" | "tournament" | "social" | "mission" | "governance" | "discovery";
export type WorldSocialKind = "reaction" | "join" | "win" | "invite" | "streak";
export type WorldPortalTarget = "mobile" | "governance" | "arena" | "rooms";
export type WorldFeedSource = "mobile-2d" | "world-3d";
export type WorldSyncSource = "shared" | WorldFeedSource;
export type DemoScenario =
  | "fresh"
  | "busy-plaza"
  | "active-match"
  | "mission-ready"
  | "tournament"
  | "offline-companion";

export interface DemoOrigin {
  origin: "demo";
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface WorldPlayerDemo {
  id: string;
  displayName: string;
  team: Team;
  presence: WorldPresence;
  level: number;
  score: number;
  pulls: number;
  streak: number;
  wins: number;
  losses: number;
  avatarHue: number;
  spawn: Vec3;
  zone: WorldZone;
  isHighlighted: boolean;
}

export interface WorldRoomDemo {
  id: string;
  code: string;
  title: string;
  phase: WorldRoomPhase;
  playerIds: string[];
  maxPlayers: number;
  ropePosition: number;
  timeRemaining: number;
  sunScore: number;
  moonScore: number;
  featured: boolean;
}

export interface WorldEventDemo {
  id: string;
  kind: WorldEventKind;
  title: string;
  startsInMinutes: number;
  participants: number;
  rewardLabel: string;
  position: Vec3;
  featured: boolean;
}

export interface WorldMissionDemo {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardLabel: string;
  complete: boolean;
  position: Vec3;
}

export interface WorldMatchDemo {
  id: string;
  roomId: string;
  winner: Team;
  sunPulls: number;
  moonPulls: number;
  durationSeconds: number;
  highlight: string;
  createdAt: number;
}

export interface WorldSocialSignalDemo {
  id: string;
  kind: WorldSocialKind;
  actorId: string;
  message: string;
  emoji: string;
  createdAt: number;
}

export interface WorldPortalDemo {
  id: string;
  title: string;
  subtitle: string;
  target: WorldPortalTarget;
  position: Vec3;
}

export interface WorldMetricsDemo {
  onlinePlayers: number;
  activeRooms: number;
  upcomingEvents: number;
  matchesToday: number;
  socialSignals: number;
  communityScore: number;
}

export interface WorldScoreboardDemo {
  roomId: string;
  sunScore: number;
  moonScore: number;
  ropePosition: number;
  leadingTeam: Team | "tie";
  sunCrewLabel: string;
  moonCrewLabel: string;
}

export interface HybridWorldDataset {
  protocolVersion: 1;
  generatedAt: number;
  mode: WorldMode;
  origin: DemoOrigin;
  players: WorldPlayerDemo[];
  rooms: WorldRoomDemo[];
  events: WorldEventDemo[];
  missions: WorldMissionDemo[];
  matches: WorldMatchDemo[];
  socialSignals: WorldSocialSignalDemo[];
  portals: WorldPortalDemo[];
  scoreboard: WorldScoreboardDemo;
  metrics: WorldMetricsDemo;
}

export interface MobileWorldProjection {
  heroRoom: WorldRoomDemo | null;
  nearbyPlayers: WorldPlayerDemo[];
  upcomingEvents: WorldEventDemo[];
  missions: WorldMissionDemo[];
  recentMatches: WorldMatchDemo[];
  socialSignals: WorldSocialSignalDemo[];
  portals: WorldPortalDemo[];
  scoreboard: WorldScoreboardDemo;
  metrics: WorldMetricsDemo;
  generatedAt: number;
  mode: WorldMode;
}

export interface DiscoveryResult {
  nearbyPlayers: WorldPlayerDemo[];
  publicRooms: WorldRoomDemo[];
  recommendedRoom: WorldRoomDemo | null;
  reason: string;
}

export interface WorldFeedEnvelope {
  protocolVersion: 1;
  generatedAt: number;
  source: WorldFeedSource;
  dataset: HybridWorldDataset;
}

export interface WorldSyncPacket {
  protocolVersion: 1;
  sentAt: number;
  source: WorldSyncSource;
  roomId: string;
  ropePosition: number;
  sunScore: number;
  moonScore: number;
  phase: WorldRoomPhase;
  highlightedPlayerId: string;
}

export interface HybridSimulationState {
  roomId: string;
  phase: WorldRoomPhase;
  ropePosition: number;
  sunScore: number;
  moonScore: number;
  elapsedSeconds: number;
  highlightedPlayerId: string;
}
