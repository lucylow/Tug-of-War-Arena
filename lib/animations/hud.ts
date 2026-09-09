export const HUD_LOW_TIME = 10;

export function shouldPulseTimer(time: number): boolean {
  return Number.isFinite(time) && time > 0 && time < HUD_LOW_TIME;
}

export function formatHudTimer(time: number): string {
  if (!Number.isFinite(time)) return "00";
  return String(Math.max(0, Math.ceil(time))).padStart(2, "0");
}

export function formatHudScore(scoreRed: number, scoreBlue: number): string {
  const red = Number.isFinite(scoreRed) ? Math.round(scoreRed) : 0;
  const blue = Number.isFinite(scoreBlue) ? Math.round(scoreBlue) : 0;
  return `${red} - ${blue}`;
}
