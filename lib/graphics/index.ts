export {
  AssetLoader,
  GRAPHICS_ASSET_FALLBACKS,
  fallbackUriForType,
  graphicsErrorFromAsset,
  hashAssetKey,
  isRemoteAssetUri,
  nextAssetRetryDelay,
  shouldRetryAssetLoad,
} from "./AssetLoader";
export type {
  Asset,
  AssetLoaderOptions,
  AssetLoadResult,
  AssetType,
  GraphicsAsset,
  GraphicsAssetLoadResult,
  GraphicsAssetType,
} from "./AssetLoader";

export { ErrorReportingService } from "./ErrorReportingService";
export { GraphicsQualityManager } from "./GraphicsQualityManager";
export type { QualityListener } from "./GraphicsQualityManager";
export { PerformanceMonitor } from "./PerformanceMonitor";

export {
  GRAPHICS_ERROR_CATEGORIES,
  classifyGraphicsError,
  createGraphicsErrorEvent,
  errorMessageOf,
  graphicsErrorCopy,
  severityForCategory,
} from "./errors";
export type { GraphicsErrorCategory, GraphicsErrorEvent, GraphicsErrorSeverity } from "./errors";

export {
  captureGraphicsFailure,
  initialGraphicsRecoveryState,
  reduceGraphicsRecovery,
  shouldDisableEffects,
} from "./recovery";
export type { GraphicsRecoveryAction, GraphicsRecoveryState } from "./recovery";

export { GraphicsErrorSeverity as GraphicsLogSeverity, GraphicsLogger, reportGraphicsError } from "./graphicsLogger";
export type { GraphicsErrorLog, GraphicsLogEntry } from "./graphicsLogger";

export {
  COMPANION_QUALITY_LEVELS,
  COMPANION_QUALITY_PRESETS,
  configForQuality,
  dropQualityLevel,
  raiseQualityLevel,
  recommendQualityFromError,
  recommendQualityFromFps,
  shouldPauseVisualEffects,
} from "./quality";
export type { CompanionGraphicsConfig, CompanionQualityLevel } from "./quality";

export {
  QUALITY_ORDER,
  QUALITY_PRESETS,
  configForLevel,
  nextQualityForFps,
} from "./types";
export type {
  GraphicsConfig,
  GraphicsError,
  GraphicsErrorType,
  PerformanceReport,
  QualityLevel,
} from "./types";
