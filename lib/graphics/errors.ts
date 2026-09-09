export type GraphicsErrorCategory =
  | "asset_load"
  | "context_loss"
  | "render"
  | "animation"
  | "performance"
  | "platform";

export type GraphicsErrorSeverity = "info" | "warning" | "error" | "fatal";

export interface GraphicsErrorEvent {
  category: GraphicsErrorCategory;
  message: string;
  severity: GraphicsErrorSeverity;
  details?: unknown;
  timestamp: number;
}

export const GRAPHICS_ERROR_CATEGORIES: GraphicsErrorCategory[] = [
  "asset_load",
  "context_loss",
  "render",
  "animation",
  "performance",
  "platform",
];

const CATEGORY_PATTERNS: { category: GraphicsErrorCategory; pattern: RegExp }[] = [
  { category: "context_loss", pattern: /webgl|context lost|contextlost|gpu reset/i },
  { category: "animation", pattern: /reanimated|worklet|keyframe|animation/i },
  { category: "performance", pattern: /fps|frame drop|memory|out of memory|jank/i },
  { category: "asset_load", pattern: /glb|gltf|texture|asset|fetch|network|404|failed to load/i },
  { category: "platform", pattern: /webgl2|unsupported|not supported|low memory device/i },
  { category: "render", pattern: /skia|canvas|shader|draw|render/i },
];

export function errorMessageOf(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "Unknown graphics error";
}

export function classifyGraphicsError(error: unknown): GraphicsErrorCategory {
  const message = errorMessageOf(error);
  for (const entry of CATEGORY_PATTERNS) {
    if (entry.pattern.test(message)) return entry.category;
  }
  return "render";
}

export function severityForCategory(category: GraphicsErrorCategory): GraphicsErrorSeverity {
  if (category === "context_loss" || category === "render") return "fatal";
  if (category === "performance" || category === "platform") return "warning";
  return "error";
}

export function createGraphicsErrorEvent(
  error: unknown,
  category: GraphicsErrorCategory = classifyGraphicsError(error),
  now: number = Date.now(),
): GraphicsErrorEvent {
  return {
    category,
    message: errorMessageOf(error),
    severity: severityForCategory(category),
    details: error,
    timestamp: now,
  };
}

export const graphicsErrorCopy = {
  accessibilityLabel: "Tug of War Arena graphics recovery",
  icon: "🎨",
  kicker: "ARENA GRAPHICS",
  title: "Graphics Error",
  body: "Offline play continues. Effects were paused so you can keep pulling.",
  fallbackTitle: "Limited Graphics Mode",
  fallbackMessage: "Graphics are currently unavailable.",
  limitedModeTitle: "Limited graphics mode",
  limitedModeBody: "The match stays playable while visual effects recover.",
  defaultMessage: "An error occurred in the graphics system.",
  buttonLabel: "Try Again",
  buttonHint: "Attempts to restore arena effects without resetting the match",
  buttonText: "RETRY VISUALS",
  retryLabel: "Retry",
  unavailable: "Graphics unavailable",
  skiaDetail: "Skia rendering error",
} as const;
