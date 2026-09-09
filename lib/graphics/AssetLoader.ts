/**
 * Compatibility aliases for the AssetLoader service.
 * Implementation lives in asset-loader.ts so retries stay unit-testable.
 */

export {
  AssetLoader,
  GRAPHICS_ASSET_FALLBACKS,
  fallbackUriForType,
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

import type { GraphicsAssetLoadResult } from "./asset-loader";
import type { GraphicsErrorType } from "./types";

export function graphicsErrorFromAsset(
  result: GraphicsAssetLoadResult,
): { type: GraphicsErrorType; message: string } | null {
  if (!result.error) return null;
  return { type: "asset_load", message: result.error };
}
