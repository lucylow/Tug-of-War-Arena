import { useEffect, useState } from "react";

import {
  AssetLoader,
  fallbackUriForType,
  type Asset,
  type AssetLoadResult,
} from "@/lib/graphics";

export function useAsset(asset: Asset) {
  const [result, setResult] = useState<AssetLoadResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loader = AssetLoader.getInstance();
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const res = await loader.loadAsset(asset);
        if (mounted) {
          setResult(res);
          setError(res.error || null);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setResult({
            uri: fallbackUriForType(asset.type),
            cached: false,
            fallback: true,
            attempts: 1,
            error: message,
          });
          setError(message);
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- identity is uri/type/cacheKey
  }, [asset.uri, asset.type, asset.cacheKey]);

  return { result, loading, error };
}
