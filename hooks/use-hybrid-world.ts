import { useCallback, useMemo, useState } from "react";
import * as Linking from "expo-linking";

import {
  applyDemoScenario,
  createHybridWorldDataset,
  discoverWorld,
  projectWorldToMobile2D,
  resolveDecentralandWorldUrl,
  type DemoScenario,
  type Team,
} from "@/lib/hybrid-world";

export function useHybridWorld(initialScenario: DemoScenario = "active-match") {
  const [scenario, setScenario] = useState<DemoScenario>(initialScenario);
  const [team, setTeam] = useState<Team>("sun");
  const [generation, setGeneration] = useState(0);
  const [status, setStatus] = useState("Synthetic demo universe ready");

  const dataset = useMemo(() => {
    void generation;
    return applyDemoScenario(createHybridWorldDataset(), scenario);
  }, [generation, scenario]);

  const projection = useMemo(() => projectWorldToMobile2D(dataset), [dataset]);
  const discovery = useMemo(() => discoverWorld(dataset, team), [dataset, team]);

  const refresh = useCallback(() => {
    setGeneration((value) => value + 1);
    setStatus("Demo universe refreshed from seed 20260909");
  }, []);

  const openWorld = useCallback(async () => {
    const url = resolveDecentralandWorldUrl();
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error("World URL unavailable");
      await Linking.openURL(url);
      setStatus("Opened 3D World");
      return true;
    } catch {
      setStatus("World link unavailable — 2D companion still works offline");
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
    status,
    refresh,
    openWorld,
  };
}
