export type ConnectionMode = "live" | "demo";
export type ConnectModeRequest = "auto" | "live" | "demo";

export type Eip1193RequestArgs = {
  method: string;
  params?: unknown;
};

export type Eip1193Like = {
  request: (args: Eip1193RequestArgs) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export type ArenaMatchView = {
  id: string;
  players: string[];
  startTime: string;
  endTime: string;
  status: number;
  winner: number;
  prizePool: string;
  sunPower: string;
  moonPower: string;
};

export type ArenaPlayerView = {
  wallet: string;
  displayName: string;
  team: number;
  power: string;
  isReady: boolean;
};

export type ArenaPlayerStats = {
  elo: string;
  displayName: string;
  team: number;
  power: string;
  isReady: boolean;
};

export type WalletTxStatus = "idle" | "pending" | "success" | "error";
