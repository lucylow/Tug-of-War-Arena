import { ARENA_COLORS } from "./theme";

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastPalette = {
  bg: string;
  border: string;
};

export const TOAST_DURATION_MS = 3000;
export const TOAST_ENTER_MS = 300;
export const TOAST_EXIT_MS = 400;

export function toastPalette(type: ToastType = "info"): ToastPalette {
  switch (type) {
    case "success":
      return { bg: ARENA_COLORS.mint, border: "#4CAF50" };
    case "error":
      return { bg: ARENA_COLORS.error, border: "#E53935" };
    case "warning":
      return { bg: ARENA_COLORS.primary, border: "#FDD835" };
    default:
      return { bg: ARENA_COLORS.teamBlue, border: "#4D96FF" };
  }
}

export function isToastType(value: unknown): value is ToastType {
  return value === "success" || value === "error" || value === "warning" || value === "info";
}
