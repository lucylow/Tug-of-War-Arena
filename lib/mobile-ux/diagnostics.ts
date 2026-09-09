/**
 * FPS / memory diagnostic copy for the Mobile UX Lab and optional HUD.
 */

import { memoryBand } from "./budget";

export type PerformanceGrade = "good" | "ok" | "low" | "critical";

export interface DiagnosticSnapshot {
  fps: number;
  memoryMb: number;
  visible: boolean;
  grade: PerformanceGrade;
  line: string;
}

export function gradeFromFps(fps: number): PerformanceGrade {
  if (!Number.isFinite(fps) || fps <= 0) return "critical";
  if (fps < 20) return "critical";
  if (fps < 30) return "low";
  if (fps < 50) return "ok";
  return "good";
}

export function formatFpsLine(fps: number, memoryMb = 0, visible = true): string {
  if (!visible) return "FPS paused · view hidden";
  const fpsLabel = Number.isFinite(fps) ? String(Math.round(fps)) : "—";
  const mem = Number.isFinite(memoryMb) && memoryMb > 0 ? ` · ${memoryMb.toFixed(0)}MB` : "";
  return `${fpsLabel} FPS${mem}`;
}

export function createDiagnosticSnapshot(input: {
  fps: number;
  memoryMb?: number;
  visible?: boolean;
}): DiagnosticSnapshot {
  const visible = input.visible !== false;
  const fps = Number.isFinite(input.fps) ? input.fps : 0;
  const memoryMb = Number.isFinite(input.memoryMb) ? (input.memoryMb as number) : 0;
  const band = memoryBand(memoryMb);
  let grade = gradeFromFps(visible ? fps : 60);
  if (band === "hard") grade = "critical";
  else if (band === "soft" && grade === "good") grade = "ok";
  return {
    fps,
    memoryMb,
    visible,
    grade,
    line: formatFpsLine(fps, memoryMb, visible),
  };
}
