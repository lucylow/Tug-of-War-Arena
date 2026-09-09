import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  POINTER_MAX_DISTANCE,
  defaultWeatherForPlatform,
  getArenaHudPolicy,
  lightingPolicy,
} from "../scene/src/logic/mobileRuntime";
import { getSocialOverlayLayout, isSocialOverlayInSafeBand } from "../scene/src/logic/socialLayout";
import { evaluateDiscoverReadiness, isInSafeZone, mobilePreviewInstructions } from "../lib/mobile";

describe("Decentraland mobile explorer policy", () => {
  it("skips LightSource and shadows on the mobile client", () => {
    expect(lightingPolicy(true)).toEqual({ skyboxTime: true, dynamicLights: false, shadows: false });
    expect(lightingPolicy(false).dynamicLights).toBe(true);
    expect(lightingPolicy(false).shadows).toBe(true);
  });

  it("keeps the HUD inside the interactable band with touch-sized Pull/Reset only", () => {
    const mobile = getArenaHudPolicy(true);
    expect(mobile.screenInset).toBe("interactable");
    expect(mobile.virtualWidth).toBe(1600);
    expect(mobile.virtualHeight).toBe(720);
    expect(mobile.showWeather).toBe(false);
    expect(mobile.showVignette).toBe(false);
    expect(mobile.pullWidth).toBeGreaterThanOrEqual(44);
    expect(mobile.pullHeight).toBeGreaterThanOrEqual(44);
    expect(mobile.secondaryHeight).toBeGreaterThanOrEqual(44);
    expect(getArenaHudPolicy(false).showWeather).toBe(true);
    expect(isInSafeZone(0.525, 0.5, "dcl-explorer")).toBe(true);
  });

  it("uses a quieter default weather and a parcel-wide pointer range", () => {
    expect(defaultWeatherForPlatform(true)).toBe("clear");
    expect(defaultWeatherForPlatform(false)).toBe("sparkle");
    expect(POINTER_MAX_DISTANCE).toBe(32);
  });

  it("does not ship missing audio clips or the FPS overlay to the explorer", () => {
    const config = readFileSync(resolve("scene/src/config.ts"), "utf8");
    expect(config).toMatch(/ENABLE_SCENE_AUDIO = false/);
    expect(config).toMatch(/enableMonitor:\s*false/);
  });

  it("keeps the crew chip in the mobile safe band", () => {
    const layout = getSocialOverlayLayout(true);
    expect(isSocialOverlayInSafeBand(layout.leftPercent, layout.topPercent, true)).toBe(true);
    expect(layout.width).toBeGreaterThanOrEqual(44);
  });

  it("passes a Discover audit for the explorer control set", () => {
    const audit = evaluateDiscoverReadiness({
      layout: "dcl-explorer",
      uiPositions: [{ x: 0.525, y: 0.5 }],
      controls: [
        { name: "pull", width: 220, height: 64 },
        { name: "reset", width: 160, height: 56 },
      ],
      boundActions: ["IA_POINTER", "IA_PRIMARY", "IA_SECONDARY"],
      testedOnRealDevice: true,
    });
    expect(audit.ready).toBe(true);
  });
});

describe("Decentraland mobile preview wiring", () => {
  it("starts the scene CLI with --mobile and documents the QR flow", () => {
    const scenePkg = JSON.parse(readFileSync(resolve("scene/package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(scenePkg.scripts["start:mobile"]).toContain("--mobile");
    expect(mobilePreviewInstructions()).toContain("pnpm scene:start:mobile");
    expect(mobilePreviewInstructions()).toContain("pnpm start:mobile");
  });

  it("does not require extra explorer permissions", () => {
    const scene = JSON.parse(readFileSync(resolve("scene/scene.json"), "utf8")) as {
      requiredPermissions: unknown[];
      runtimeVersion: string;
      worldConfiguration?: { name?: string };
    };
    expect(scene.runtimeVersion).toBe("7");
    expect(scene.requiredPermissions).toEqual([]);
    expect(scene.worldConfiguration?.name).toContain(".dcl.eth");
    expect(existsSync(resolve("scene/images/scene-thumbnail.png"))).toBe(true);
  });
});
