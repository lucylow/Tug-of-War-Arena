export type MatchStatus = "waiting" | "countdown" | "playing" | "ended";
export type MatchmakingMode = "casual" | "ranked" | "custom";
export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type ChatChannel = "global" | "team" | "party";
export type ArenaAction = "tap" | "swipe";
export type CrewTeam = "sun" | "moon";
export type EmoteCategory = "celebration" | "taunt" | "friendly" | "reaction";
export type LeaderboardType = "global" | "friends" | "guild" | "region";

export type RoomJoinOptions = {
  realm?: string;
  playerId: string;
  playerName: string;
  spectator?: boolean;
  partyId?: string;
  team?: number;
};

export type PlayerState = {
  id: string;
  name: string;
  team: number;
  power: number;
  taps: number;
  latency: number;
  isReady: boolean;
  isConnected: boolean;
  isSpectator: boolean;
  lastUpdate: number;
};

export type MatchState = {
  roomId: string;
  players: Record<string, PlayerState>;
  teamPower: [number, number];
  ropePosition: number;
  matchTime: number;
  matchStatus: MatchStatus;
  round: number;
  scores: [number, number];
  mvp: string;
  startTime: number;
  endTime: number;
  version: number;
  viewers: number;
};

export type MatchmakingOptions = {
  mode: MatchmakingMode;
  maxPlayers?: number;
  minPlayers?: number;
  skillLevel?: SkillLevel;
  region?: string;
  partyId?: string;
};

export type MatchmakingQueue = {
  id: string;
  players: string[];
  options: MatchmakingOptions;
  createdAt: number;
  status: "waiting" | "matching" | "ready";
};

export type PartyMember = {
  id: string;
  name: string;
  avatar: string;
  isReady: boolean;
  isLeader: boolean;
  team?: CrewTeam;
};

export type Party = {
  id: string;
  name: string;
  leaderId: string;
  members: PartyMember[];
  inviteCode: string;
  createdAt: number;
  maxMembers: number;
  gameMode: string;
};

export type SpectatorInfo = {
  roomId: string;
  matchState: MatchState | null;
  players: PlayerState[];
  viewers: number;
  startedAt: number;
};

export type MatchEvent = {
  at: number;
  type: string;
  payload?: unknown;
};

export type MatchRecord = {
  id: string;
  players: string[];
  winner: string;
  score: [number, number];
  mvp: string;
  duration: number;
  date: number;
  ropeHistory: number[];
  events: MatchEvent[];
};

export type VoiceStatus = {
  connected: boolean;
  muted: boolean;
  enabled: boolean;
  audioLevel: number;
  roomId: string | null;
};

export type Emote = {
  id: string;
  name: string;
  icon: string;
  category: EmoteCategory;
  animation?: string;
  sound?: string;
};

export type LeaderboardEntry = {
  playerId: string;
  playerName: string;
  avatar: string;
  wins: number;
  losses: number;
  winRatio: number;
  elo: number;
  streak: number;
  bestStreak: number;
  rank: number;
  level: number;
  xp: number;
};

export type LeaderboardFilter = {
  type: LeaderboardType;
  region?: string;
  guildId?: string;
  limit?: number;
};

export type ChatMessage = {
  playerId: string;
  playerName: string;
  message: string;
  channel: ChatChannel;
  at: number;
};

export type EmoteMessage = {
  playerId: string;
  playerName: string;
  emoteId: string;
  at: number;
};
