export type PlayerBadge = "ROOKIE" | "STREAKER" | "CREW PLAYER" | "ARENA VETERAN" | "CHAMPION";

export function featuredBadge(input: { streak: number; wins: number; pulls: number }): PlayerBadge {
  if (input.wins >= 20) return "CHAMPION";
  if (input.pulls >= 400) return "ARENA VETERAN";
  if (input.streak >= 4) return "STREAKER";
  if (input.wins >= 3) return "CREW PLAYER";
  return "ROOKIE";
}
