import { GraphicsLogger } from "./logger";

export type GraphicsAssetType = "image" | "glb" | "audio" | "font";

export interface GraphicsAsset {
  uri: string;
  type: GraphicsAssetType;
  cacheKey?: string;
}

export interface GraphicsAssetLoadResult {
  uri: string;
  cached: boolean;
  fallback: boolean;
  attempts: number;
  error?: string;
}

export interface AssetLoaderOptions {
  retryCount?: number;
  retryDelayMs?: number;
  fetchImpl?: typeof fetch;
  delay?: (ms: number) => Promise<void>;
}

const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export const GRAPHICS_ASSET_FALLBACKS: Record<GraphicsAssetType, string> = {
  image: TRANSPARENT_PIXEL,
  glb: "models/dummy.glb",
  audio: "sounds/pull.mp3",
  font: "System",
};

export function hashAssetKey(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `asset_${Math.abs(hash)}`;
}

export function fallbackUriForType(type: GraphicsAssetType): string {
  return GRAPHICS_ASSET_FALLBACKS[type];
}

export function nextAssetRetryDelay(attempt: number, baseDelayMs: number): number {
  return Math.max(0, baseDelayMs) * Math.max(1, attempt);
}

export function shouldRetryAssetLoad(attempt: number, retryCount: number): boolean {
  return attempt <= retryCount;
}

export function isRemoteAssetUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

function defaultDelay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class AssetLoader {
  private static instance: AssetLoader | null = null;

  private cache = new Map<string, string>();
  private retryCount: number;
  private retryDelayMs: number;
  private fetchImpl: typeof fetch;
  private delay: (ms: number) => Promise<void>;

  constructor(options: AssetLoaderOptions = {}) {
    this.retryCount = options.retryCount ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.delay = options.delay ?? defaultDelay;
  }

  static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  static resetInstance(): void {
    AssetLoader.instance = null;
  }

  configure(options: AssetLoaderOptions): void {
    if (options.retryCount !== undefined) this.retryCount = Math.max(0, options.retryCount);
    if (options.retryDelayMs !== undefined) this.retryDelayMs = Math.max(0, options.retryDelayMs);
    if (options.fetchImpl) this.fetchImpl = options.fetchImpl;
    if (options.delay) this.delay = options.delay;
  }

  peekCache(cacheKey: string): string | undefined {
    return this.cache.get(cacheKey);
  }

  clearCache(): void {
    this.cache.clear();
  }

  async loadAsset(asset: GraphicsAsset): Promise<GraphicsAssetLoadResult> {
    const cacheKey = asset.cacheKey ?? asset.uri;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { uri: cached, cached: true, fallback: false, attempts: 0 };
    }

    if (!isRemoteAssetUri(asset.uri) && !asset.uri.startsWith("data:")) {
      this.cache.set(cacheKey, asset.uri);
      return { uri: asset.uri, cached: false, fallback: false, attempts: 1 };
    }

    let lastError: string | undefined;
    const maxAttempts = this.retryCount + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const uri = await this.downloadAsset(asset);
        this.cache.set(cacheKey, uri);
        return { uri, cached: false, fallback: false, attempts: attempt };
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Asset load failed";
        GraphicsLogger.getInstance().log("warning", "asset_load", `Attempt ${attempt} failed for ${asset.uri}`, {
          details: error,
        });
        if (shouldRetryAssetLoad(attempt, this.retryCount)) {
          await this.delay(nextAssetRetryDelay(attempt, this.retryDelayMs));
        }
      }
    }

    GraphicsLogger.getInstance().log("error", "asset_load", `Asset load failed for ${asset.uri}`, {
      details: lastError,
    });

    return {
      uri: fallbackUriForType(asset.type),
      cached: false,
      fallback: true,
      attempts: maxAttempts,
      error: lastError,
    };
  }

  private async downloadAsset(asset: GraphicsAsset): Promise<string> {
    if (asset.uri.startsWith("data:") || asset.uri.startsWith("file:") || asset.uri.startsWith("asset")) {
      return asset.uri;
    }

    const response = await this.fetchImpl(asset.uri);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText || "Asset request failed"}`);
    }
    return asset.uri;
  }
}
