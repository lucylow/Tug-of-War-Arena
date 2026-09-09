import { useEffect, useState } from "react";

import {
  GraphicsQualityManager,
  configForLevel,
  type GraphicsConfig,
  type QualityLevel,
} from "@/lib/graphics";

export function useGraphicsQualityManager() {
  const manager = GraphicsQualityManager.getInstance();
  const [currentLevel, setCurrentLevel] = useState<QualityLevel>(manager.getCurrentLevel());
  const [config, setConfig] = useState<GraphicsConfig>(manager.getConfig());

  useEffect(() => {
    manager.arm();
    setCurrentLevel(manager.getCurrentLevel());
    setConfig(manager.getConfig());
    return manager.onChange((level, nextConfig) => {
      setCurrentLevel(level);
      setConfig(nextConfig);
    });
  }, [manager]);

  const setQuality = (level: QualityLevel) => {
    manager.setQuality(level);
    setCurrentLevel(level);
    setConfig(configForLevel(level));
  };

  return { currentLevel, config, setQuality };
}
