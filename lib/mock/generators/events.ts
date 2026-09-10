import { SeededRandom } from "@/lib/mock/seed";

export type MockEventStatus = "live" | "upcoming" | "ended";
export type MockEventType = "cup" | "weekend" | "rush" | "hunt" | "rally" | "scrim";

export interface MockWorldEvent {
  id: string;
  title: string;
  type: MockEventType;
  status: MockEventStatus;
  origin: "demo";
  startsInMin: number;
  durationMin: number;
  crew: "sun" | "moon" | "all";
  rsvpCount: number;
}

const EVENT_TEMPLATES = [
  { id: "sun-moon-cup", title: "Sun vs Moon Cup", type: "cup" as const, crew: "all" as const, status: "upcoming" as const },
  { id: "weekend-pull", title: "Weekend Pull", type: "weekend" as const, crew: "all" as const, status: "live" as const },
  { id: "crew-rush", title: "Crew Rush", type: "rush" as const, crew: "sun" as const, status: "upcoming" as const },
  { id: "achievement-hunt", title: "Achievement Hunt", type: "hunt" as const, crew: "all" as const, status: "upcoming" as const },
  { id: "friendzone-rally", title: "Friendzone Rally", type: "rally" as const, crew: "all" as const, status: "upcoming" as const },
  { id: "moonlight-scrim", title: "Moonlight Scrim", type: "scrim" as const, crew: "moon" as const, status: "live" as const },
  { id: "plaza-open", title: "Plaza Open Invite", type: "rally" as const, crew: "all" as const, status: "upcoming" as const },
  { id: "captain-cup", title: "Captain's Cup", type: "cup" as const, crew: "sun" as const, status: "upcoming" as const },
] as const;

export function generateWorldEvents(random: SeededRandom): MockWorldEvent[] {
  return EVENT_TEMPLATES.map((template, index) => ({
    id: template.id,
    title: template.title,
    type: template.type,
    status: template.status,
    origin: "demo" as const,
    startsInMin: template.status === "live" ? 0 : 15 + index * 12,
    durationMin: template.type === "cup" ? 90 : 45,
    crew: template.crew,
    rsvpCount: random.nextInt(12, 48),
  }));
}
