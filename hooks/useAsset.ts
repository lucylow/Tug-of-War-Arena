import { useEffect, useState } from "react";

import { AssetLoader, type Asset, type AssetLoadResult } from "@/lib/graphics";

export function useAsset(asset: Asset) {
  const [result, setResult] = useState<AssetLoadResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loader = AssetLoader.getInstance();

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
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [asset.uri, asset.type, asset.cacheKey]);

  return { result, loading, error };
}
