export type Team = "sun" | "moon";
export type Presence = "online" | "away" | "offline";
export type RoomPhase = "lobby" | "active" | "finished";
export type EventKind = "tournament" | "crew" | "social" | "governance";
export type DemoOrigin = "demo";

export const WORLD_PROTOCOL_VERSION = 1 as const;

export interface WorldVec3 {
  x: number;
  y: number;
  z: number;
}

export interface WorldPlayer {
  id: string;
  displayName: string;
  team: Team;
  score: number;
  streak: number;
  presence: Presence;
  position: WorldVec3;
  origin: DemoOrigin;
}

export interface WorldRoom {
  id: string;
  code: string;
  title: string;
  playerCount: number;
  capacity: number;
  phase: RoomPhase;
  sunScore: number;
  moonScore: number;
  origin: DemoOrigin;
}

export interface WorldMission {
  id: string;
  title: string;
  progress: number;
  target: number;
  origin: DemoOrigin;
}

export interface WorldEvent {
  id: string;
  title: string;
  kind: EventKind;
  startsAt: number;
  origin: DemoOrigin;
}

export interface WorldMatchSummary {
  id: string;
  roomId: string;
  winner: Team;
  highlight: string;
  origin: DemoOrigin;
}

export interface WorldActivity {
  id: string;
  actor: string;
  message: string;
  origin: DemoOrigin;
}

export interface WorldGovernance {
  proposalTitle: string;
  discussionLinks: string[];
  daoUrl: string;
  origin: DemoOrigin;
}

export interface WorldFeed {
  version: number;
  generatedAt: number;
  origin: DemoOrigin;
  players: WorldPlayer[];
  rooms: WorldRoom[];
  missions: WorldMission[];
  events: WorldEvent[];
  matches: WorldMatchSummary[];
  activity: WorldActivity[];
  reactions: WorldActivity[];
  governance: WorldGovernance;
  scoreboard: {
    sunScore: number;
    moonScore: number;
    timeLabel: string;
    roomTitle: string;
    roomCode: string;
  };
}

export interface MobilePresenceCard {
  id: string;
  displayName: string;
  team: Team;
  presence: Presence;
  origin: DemoOrigin;
}

export interface MobileRoomCard {
  id: string;
  title: string;
  code: string;
  phase: RoomPhase;
  playerCount: number;
  capacity: number;
  origin: DemoOrigin;
}

export interface MobileEventCard {
  id: string;
  title: string;
  kind: EventKind;
  origin: DemoOrigin;
}

export interface MobileMissionCard {
  id: string;
  title: string;
  progress: number;
  target: number;
  origin: DemoOrigin;
}

export interface MobileWorldProjection {
  presence: MobilePresenceCard[];
  rooms: MobileRoomCard[];
  events: MobileEventCard[];
  missions: MobileMissionCard[];
  onlineDemoCount: number;
  scoreboard: WorldFeed["scoreboard"];
  origin: DemoOrigin;
}
