import { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";

import { toUserMessage } from "@/lib/errors/appError";
import {
  applyDemoScenario,
  createFallbackHybridWorldDataset,
  createHybridWorldDatasetSafe,
  discoverWorld,
  isDecentralandWorldUrl,
  projectWorldToMobile2D,
  resolveDecentralandWorldUrl,
  type DemoScenario,
  type HybridWorldDataset,
  type Team,
} from "@/lib/hybrid-world";

function loadDataset(scenario: DemoScenario): { dataset: HybridWorldDataset; error: string | null } {
  try {
    return { dataset: applyDemoScenario(createHybridWorldDatasetSafe(), scenario), error: null };
  } catch (error) {
    return {
      dataset: applyDemoScenario(createFallbackHybridWorldDataset(), scenario),
      error: toUserMessage(error) || "Demo universe failed to generate",
    };
  }
}

export function useHybridWorld(initialScenario: DemoScenario = "active-match") {
  const [scenario, setScenario] = useState<DemoScenario>(initialScenario);
  const [team, setTeam] = useState<Team>("sun");
  const [generation, setGeneration] = useState(0);
  const [status, setStatus] = useState("Synthetic demo universe ready");
  const [error, setError] = useState<string | null>(null);

  const loaded = useMemo(() => {
    void generation;
    return loadDataset(scenario);
  }, [generation, scenario]);

  const dataset = loaded.dataset;
  const projection = useMemo(() => projectWorldToMobile2D(dataset), [dataset]);
  const discovery = useMemo(() => discoverWorld(dataset, team), [dataset, team]);

  const refresh = useCallback(() => {
    setGeneration((value) => value + 1);
    setError(null);
    setStatus("Demo universe refreshed from seed 20260910");
  }, []);

  const openWorld = useCallback(async () => {
    const url = resolveDecentralandWorldUrl();
    try {
      if (!isDecentralandWorldUrl(url)) {
        throw new Error("World URL is invalid");
      }
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error("World URL unavailable");
      if (Platform.OS === "web" && typeof window !== "undefined" && typeof window.open === "function") {
        const popup = window.open(url, "_blank", "noopener,noreferrer");
        if (!popup) await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
      setStatus("Opened 3D World in Explorer. Companion preview stays here.");
      setError(null);
      return true;
    } catch (caught) {
      setStatus("World link unavailable — 2D companion still works offline");
      setError(toUserMessage(caught) || "World link unavailable");
      return false;
    }
  }, []);

  return {
    dataset,
    projection,
    discovery,
    scenario,
    setScenario,
    team,
    setTeam,
    status: loaded.error ? "Showing seeded mock universe" : status,
    error: error ?? loaded.error,
    refresh,
    openWorld,
  };
}
