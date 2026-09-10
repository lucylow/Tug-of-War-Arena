import type { CrewEvent } from "../crewEvent";

export const eventFixture: CrewEvent[] = [
  { id: "sun-moon-cup", title: "Sun vs Moon Cup", team: "all", startsAt: 1_725_968_760_000, endsAt: 1_725_972_360_000, status: "upcoming", origin: "demo", type: "cup" },
  { id: "weekend-pull", title: "Weekend Pull", team: "all", startsAt: 1_725_968_000_000, endsAt: 1_725_980_000_000, status: "live", origin: "demo", type: "weekend" },
  { id: "crew-rush", title: "Crew Rush", team: "sun", startsAt: 1_725_969_000_000, endsAt: 1_725_971_000_000, status: "upcoming", origin: "demo", type: "rush" },
  { id: "achievement-hunt", title: "Achievement Hunt", team: "all", startsAt: 1_725_970_000_000, endsAt: 1_725_978_000_000, status: "upcoming", origin: "demo", type: "hunt" },
  { id: "friendzone-rally", title: "Friendzone Rally", team: "all", startsAt: 1_725_974_000_000, endsAt: 1_725_980_000_000, status: "upcoming", origin: "demo", type: "rally" },
  { id: "moonlight-scrim", title: "Moonlight Scrim", team: "moon", startsAt: 1_725_968_400_000, endsAt: 1_725_971_000_000, status: "live", origin: "demo", type: "rush" },
  { id: "plaza-open", title: "Plaza Open Invite", team: "all", startsAt: 1_725_976_000_000, endsAt: 1_725_981_000_000, status: "upcoming", origin: "demo", type: "rally" },
  { id: "captain-cup", title: "Captain's Cup", team: "sun", startsAt: 1_725_982_000_000, endsAt: 1_725_986_000_000, status: "upcoming", origin: "demo", type: "cup" },
];
