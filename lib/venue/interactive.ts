function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function hitPracticeDummy(hits: number): { hits: number; glow: number } {
  const current = Number.isFinite(hits) ? Math.max(0, Math.floor(hits)) : 0;
  const next = current + 1;
  return {
    hits: next,
    glow: Math.min(1, Math.round((0.28 + next * 0.07) * 100) / 100),
  };
}

export function formatPracticeDummyPresentation(hits: number): {
  label: string;
  hint: string;
  title: string;
  meta: string;
  hoverText: string;
} {
  const safe = Number.isFinite(hits) ? Math.max(0, Math.floor(hits)) : 0;
  return {
    label: "Hit the practice dummy",
    hint: "Warms up your tap timing before you enter the arena",
    title: "PRACTICE DUMMY",
    hoverText: "Hit me!",
    meta: safe === 0 ? "Tap to warm up" : `${safe} hit${safe === 1 ? "" : "s"} · keep the rhythm`,
  };
}

export function formatVenueScoreboard(input: {
  crewLabel: string;
  opponentLabel: string;
  crewScore: number;
  opponentScore: number;
}): {
  title: string;
  crewText: string;
  opponentText: string;
  accessibilityLabel: string;
} {
  const crew = clampScore(input.crewScore);
  const opponent = clampScore(input.opponentScore);
  const crewLabel = input.crewLabel.trim() || "Crew";
  const opponentLabel = input.opponentLabel.trim() || "Opponent";

  return {
    title: "ARENA",
    crewText: String(crew),
    opponentText: String(opponent),
    accessibilityLabel: `${crewLabel} ${crew}, ${opponentLabel} ${opponent}`,
  };
}
