export type CrewEventStatus = "upcoming" | "live" | "ended";

export interface CrewEvent {
  id: string;
  title: string;
  team: "sun" | "moon" | "all";
  startsAt: number;
  endsAt: number;
  status: CrewEventStatus;
  origin: "demo" | "live";
  type: "cup" | "weekend" | "rush" | "hunt" | "rally";
}

export function eventStatusAt(event: CrewEvent, now: number): CrewEventStatus {
  if (now < event.startsAt) return "upcoming";
  if (now >= event.endsAt) return "ended";
  return "live";
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
