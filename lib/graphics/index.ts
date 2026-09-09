export {
  AssetLoader,
  GRAPHICS_ASSET_FALLBACKS,
  fallbackUriForType,
  graphicsErrorFromAsset,
  hashAssetKey,
  isRemoteAssetUri,
  nextAssetRetryDelay,
  shouldRetryAssetLoad,
} from "./asset-loader";
export type {
  AssetLoaderOptions,
  GraphicsAsset,
  GraphicsAsset as Asset,
  GraphicsAssetLoadResult,
  GraphicsAssetLoadResult as AssetLoadResult,
  GraphicsAssetType,
  GraphicsAssetType as AssetType,
} from "./asset-loader";

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

export { GraphicsLogSeverity, GraphicsLogger, reportGraphicsError } from "./logger";
export type { GraphicsErrorLog, GraphicsLogEntry } from "./logger";

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
  classifyGraphicsErrorType,
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
