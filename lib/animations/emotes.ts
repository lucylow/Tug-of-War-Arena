export const ARENA_EMOTES = [
  "👋",
  "👏",
  "😂",
  "❤️",
  "🔥",
  "🏆",
  "💪",
  "⭐",
  "😎",
  "🎉",
  "🤔",
  "😱",
  "😍",
  "💀",
  "🌈",
  "🍕",
  "🚀",
  "🌮",
  "🎮",
  "👾",
] as const;

export type ArenaEmote = (typeof ARENA_EMOTES)[number];

export function emoteAt(index: number): ArenaEmote {
  const i = Number.isFinite(index) ? Math.floor(index) : 0;
  const wrapped = ((i % ARENA_EMOTES.length) + ARENA_EMOTES.length) % ARENA_EMOTES.length;
  return ARENA_EMOTES[wrapped] ?? "👋";
}

export function matchResultCopy(isWin: boolean): {
  emoji: string;
  title: string;
  subtitle: string;
  accessibilityLabel: string;
} {
  if (isWin) {
    return {
      emoji: "🏆",
      title: "Victory!",
      subtitle: "Amazing performance!",
      accessibilityLabel: "Victory. Amazing performance.",
    };
  }
  return {
    emoji: "😢",
    title: "Defeat!",
    subtitle: "Better luck next time!",
    accessibilityLabel: "Defeat. Better luck next time.",
  };
}
