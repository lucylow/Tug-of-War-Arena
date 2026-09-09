import { afterEach, describe, expect, it } from "vitest";

import { resetPerformance } from "../scene/src/performance";
import {
  BackfaceCulling,
  DESKTOP_MATERIAL_BUDGET,
  DrawCallBatcher,
  LODSystem,
  MOBILE_MATERIAL_BUDGET,
  MaterialBudgetTracker,
  MaterialPool,
  MobileShader,
  OcclusionCuller,
  TextureAtlasManager,
  parseColor,
  resetMaterials,
  setupMaterials,
  tickMaterials,
} from "../scene/src/materials";

afterEach(() => {
  resetMaterials();
  resetPerformance();
});

describe("material budget", () => {
  it("uses the mobile optimization budget on phones", () => {
    const { budget } = setupMaterials({ mobile: true });
    expect(budget.getBudget()).toEqual(MOBILE_MATERIAL_BUDGET);
    expect(budget.getBudget().maxMaterials).toBe(200);
    expect(budget.getBudget().maxTextureResolution).toBe(512);
  });

  it("uses the desktop budget off mobile", () => {
    const { budget } = setupMaterials({ mobile: false });
    expect(budget.getBudget()).toEqual(DESKTOP_MATERIAL_BUDGET);
  });

  it("warns when unique materials cross 90% of the cap", () => {
    const { budget, pool } = setupMaterials({ mobile: true });
    const seen: string[] = [];
    budget.onBudgetWarning((metric) => {
      seen.push(metric);
    });

    for (let index = 0; index < 185; index += 1) {
      pool.getColoredMaterial({ r: index / 200, g: 0.1, b: 0.2, a: 1 });
    }

    budget.forceCheck();
    expect(seen).toContain("materials");
    expect(budget.getStats().materials).toBe(185);
  });
});

describe("material pool", () => {
  it("reuses identical color configs", () => {
    const { pool } = setupMaterials({ mobile: true });
    const color = { r: 1, g: 0.2, b: 0.2, a: 1 };
    const first = pool.getColoredMaterial(color, 0.5, 0);
    const second = pool.getColoredMaterial(color, 0.5, 0);
    expect(first.reused).toBe(false);
    expect(second.reused).toBe(true);
    expect(first.config).toBe(second.config);
    expect(pool.getSize()).toBe(1);
  });

  it("caps unique materials at the mobile budget and reuses the nearest color", () => {
    const { pool } = setupMaterials({ mobile: true });
    for (let index = 0; index < 300; index += 1) {
      pool.getColoredMaterial({ r: index / 300, g: 0.4, b: 0.1, a: 1 }, 0.5, 0);
    }
    expect(pool.getSize()).toBeLessThanOrEqual(200);
    expect(pool.getMaxMaterials()).toBe(200);
  });
});

describe("texture atlas", () => {
  it("packs UV rects into a 1024 atlas on mobile", () => {
    const { atlas } = setupMaterials({ mobile: true });
    expect(atlas.getMaxAtlasSize()).toBe(1024);

    const first = atlas.registerTexture("sun-decal", 256, 256);
    const second = atlas.registerTexture("moon-decal", 256, 256);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();

    const uvs = atlas.getUVs("sun-decal");
    expect(uvs?.uMin).toBe(0);
    expect(uvs?.vMin).toBe(0);
    expect(uvs?.uMax).toBe(256 / 1024);

    const moon = atlas.getUVs("moon-decal");
    expect(moon?.uMin).toBe(256 / 1024);
    expect(atlas.getStats().count).toBe(2);
    expect(atlas.getAtlasTexture("arena")?.size).toBe(1024);
  });
});

describe("LOD system", () => {
  it("switches mesh and scale by camera distance", () => {
    const { lod } = setupMaterials({ mobile: true });
    lod.registerLOD(
      7,
      [
        { distance: 0, mesh: "assets/models/decoration_high.glb", scale: 1 },
        { distance: 10, mesh: "assets/models/decoration_medium.glb", scale: 0.8 },
        { distance: 20, mesh: "assets/models/decoration_low.glb", scale: 0.6 },
      ],
      { x: 0, y: 0, z: 0 },
    );

    lod.forceUpdate({ x: 0, y: 0, z: 0 });
    expect(lod.getCurrentLOD(7)).toBe(0);

    const changes = lod.forceUpdate({ x: 0, y: 0, z: 25 });
    expect(lod.getCurrentLOD(7)).toBe(2);
    expect(changes[0]?.mesh).toBe("assets/models/decoration_low.glb");
    expect(changes[0]?.scale).toBeCloseTo(0.54);
  });
});

describe("occlusion culling", () => {
  it("hides entities behind the camera or past the mobile radius", () => {
    const { occlusion } = setupMaterials({ mobile: true });
    expect(occlusion.getCullingDistance()).toBe(15);

    occlusion.register(3, { x: 0, y: 0, z: 0 });
    occlusion.forceCull({
      position: { x: 0, y: 2, z: 10 },
      direction: { x: 0, y: 0, z: -1 },
    });
    expect(occlusion.isCulled(3)).toBe(false);

    occlusion.setPosition(3, { x: 0, y: 2, z: 20 });
    occlusion.forceCull({
      position: { x: 0, y: 2, z: 10 },
      direction: { x: 0, y: 0, z: -1 },
    });
    expect(occlusion.isCulled(3)).toBe(true);

    occlusion.reset();
    expect(occlusion.isCulled(3)).toBe(false);
  });

  it("never culls important entities", () => {
    const { occlusion } = setupMaterials({ mobile: true });
    occlusion.register(9, { x: 80, y: 0, z: 80 }, true);
    occlusion.forceCull({
      position: { x: 0, y: 2, z: 10 },
      direction: { x: 0, y: 0, z: -1 },
    });
    expect(occlusion.isCulled(9)).toBe(false);
  });
});

describe("backface culling and mobile shaders", () => {
  it("forces opaque shading and damps metallic on mobile", () => {
    const { shader, culling } = setupMaterials({ mobile: true });
    const material = shader.createOpaqueMaterial("#FF6B6B", 0.4);
    expect(material.transparencyMode).toBe(0);
    expect(material.roughness).toBe(0.4);
    expect(culling.isCullingEnabled(material)).toBe(true);

    const shiny = {
      roughness: 0.2,
      metallic: 0.9,
      emissiveIntensity: 4,
      albedoColor: { r: 1, g: 1, b: 1, a: 0.2 },
      transparencyMode: 2,
    };
    shader.optimizeMaterial(shiny);
    expect(shiny.metallic).toBe(0);
    expect(shiny.emissiveIntensity).toBe(1);
    expect(shiny.albedoColor?.a).toBe(1);
    expect(shiny.transparencyMode).toBe(0);

    const glow = shader.createEmissiveMaterial({ r: 1, g: 0.8, b: 0.2, a: 1 }, 2);
    expect(glow.emissiveIntensity).toBe(1);
    expect(shader.createUnlitMaterial("#ffffff").roughness).toBe(1);
  });

  it("parses hex colors", () => {
    expect(parseColor("#fff")).toEqual({ r: 1, g: 1, b: 1, a: 1 });
    expect(parseColor("#000000").r).toBe(0);
  });
});

describe("draw-call batching and preprocessing", () => {
  it("groups entities that share a material and mesh", () => {
    const { batcher } = setupMaterials({ mobile: true });
    batcher.registerEntity(1, "color_floor", "box");
    batcher.registerEntity(2, "color_floor", "box");
    batcher.registerEntity(3, "color_gold", "sphere");
    const stats = batcher.batch();
    expect(stats.totalEntities).toBe(3);
    expect(stats.totalGroups).toBe(2);
    expect(stats.estimatedDrawCalls).toBe(2);
    expect(stats.largestGroup).toBe(2);
  });

  it("recommends compressed low-res textures on mobile", () => {
    const { preprocessor } = setupMaterials({ mobile: true });
    expect(preprocessor.getTextureFormat()).toBe("webp");
    expect(preprocessor.getMaxTextureResolution()).toBe(512);
    expect(preprocessor.getMeshQuality()).toBe("medium");
    expect(preprocessor.getAtlasSize()).toBe(1024);
    expect(preprocessor.shouldCompressTexture()).toBe(true);
    expect(preprocessor.getLODDistances()).toEqual({ near: 5, medium: 10, far: 15 });
    expect(preprocessor.clampTextureSize(2048, 1024)).toEqual({ width: 512, height: 256 });
  });

  it("keeps higher desktop budgets", () => {
    const { preprocessor } = setupMaterials({ mobile: false });
    expect(preprocessor.getTextureFormat()).toBe("png");
    expect(preprocessor.getMaxTextureResolution()).toBe(2048);
    expect(preprocessor.getLODDistances().far).toBe(30);
  });
});

describe("integration tick", () => {
  it("advances LOD, occlusion, and budget from a single tick", () => {
    const handles = setupMaterials({ mobile: true });
    handles.lod.registerLOD(1, handles.lod.defaultLevels("high.glb"), { x: 0, y: 0, z: 0 });
    handles.occlusion.register(1, { x: 0, y: 0, z: 0 });
    tickMaterials(0.016, { position: { x: 0, y: 2, z: 10 }, direction: { x: 0, y: 0, z: -1 } }, Date.now() + 2000);
    expect(MaterialBudgetTracker.getInstance()).toBe(handles.budget);
    expect(BackfaceCulling.getInstance()).toBe(handles.culling);
    expect(MobileShader.getInstance()).toBe(handles.shader);
    expect(TextureAtlasManager.getInstance()).toBe(handles.atlas);
    expect(LODSystem.getInstance()).toBe(handles.lod);
    expect(OcclusionCuller.getInstance()).toBe(handles.occlusion);
    expect(DrawCallBatcher.getInstance()).toBe(handles.batcher);
  });
});
