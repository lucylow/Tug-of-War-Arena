export type FriendzoneEventTitle = "Plaza Sprint" | "Wearable Rush";
export type FriendzoneShareContext = FriendzoneEventTitle | "Plaza Match Recap";
export type FriendzoneEventModalAction = "rsvp" | "cancel-rsvp" | "join-waitlist" | "leave-waitlist";
export type FriendzoneModalSelection = { eventTitle: FriendzoneEventTitle; shouldClose: false } | { eventTitle: null; shouldClose: true };

export function resolveFriendzoneEventTitle(value: unknown): FriendzoneEventTitle | null {
  if (value === "Plaza Sprint" || value === "Wearable Rush") return value;
  return null;
}

export function recoverFriendzoneModalSelection(value: unknown): FriendzoneModalSelection {
  const eventTitle = resolveFriendzoneEventTitle(value);
  return eventTitle ? { eventTitle, shouldClose: false } : { eventTitle: null, shouldClose: true };
}

export function resolveFriendzoneEventModalAction(
  eventTitle: FriendzoneEventTitle,
  rsvpEvent: FriendzoneEventTitle | null,
  eventWaitlisted: boolean,
): FriendzoneEventModalAction {
  if (eventTitle === "Wearable Rush") return eventWaitlisted ? "leave-waitlist" : "join-waitlist";
  return rsvpEvent === eventTitle ? "cancel-rsvp" : "rsvp";
}

export function formatFriendzoneEventShareMessage(eventTitle: FriendzoneShareContext, partyCode: string): string {
  const rewardContext = eventTitle === "Wearable Rush"
    ? "Top pullers unlock the Friendzone Plaza Band preview."
    : eventTitle === "Plaza Sprint"
      ? "Top crews earn a Plaza leaderboard finish."
      : "Bring your crew back to Plaza 0,0 for the next round.";
  return `Meet me in Decentraland Friendzone Plaza 0,0 for ${eventTitle}. ${rewardContext} Join my Tug of War Arena party with code ${partyCode}.\nhttps://play.decentraland.org/?position=0,0`;
}

export function toggleFriendzoneRsvp(
  currentEvent: FriendzoneEventTitle | null,
  selectedEvent: FriendzoneEventTitle,
): FriendzoneEventTitle | null {
  return currentEvent === selectedEvent ? null : selectedEvent;
}
