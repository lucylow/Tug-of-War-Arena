# Tug of War Arena — 25+ Page 3D Graphics Upgrade

> In this repository the Decentraland SDK7 World lives at `scene/`. The graphics package is `scene/src/graphics/`, composed from `assembleWorld()` in `scene/src/world.ts`. Layout is remapped from the original 16×16 sketch onto the 2×2 parcel (`ARENA_CENTER` 16,16).

This implementation extends the existing Decentraland SDK7 World with a dedicated 3D graphics layer. The goal is to make the World read visually as a spatial game rather than as a 2D interface projected into a scene. The upgrade is additive and keeps the existing arena, Friendzone social systems, mock-data systems, governance plaza, and mobile companion boundaries intact.

The code below is the implementation reference for the graphics package. Each numbered section is treated as a “page” in the engineering handoff. The package contains the actual source files under `src/graphics/`.

## Design goals

1. Establish a recognizable Friendzone visual identity.
2. Create depth using layered primitive geometry.
3. Make team identity physically visible.
4. Make the arena feel like a destination with a stage, gateway, signage, portals, and landmarks.
5. Animate only a small number of visual properties.
6. Keep the scene deterministic and lightweight for a hackathon World.
7. Keep graphics separate from gameplay state.


---
# PAGE 1: `src/graphics/materials.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { Material } from '@dcl/sdk/ecs';
import { Color4 } from '@dcl/sdk/math';

export interface GraphicColor { r: number; g: number; b: number; a?: number }

export const GRAPHIC_COLORS = {
  midnight: { r: 0.035, g: 0.02, b: 0.09, a: 1 },
  violet: { r: 0.36, g: 0.16, b: 0.75, a: 1 },
  violetBright: { r: 0.68, g: 0.32, b: 1.0, a: 1 },
  pink: { r: 1.0, g: 0.13, b: 0.58, a: 1 },
  pinkSoft: { r: 1.0, g: 0.42, b: 0.78, a: 1 },
  peach: { r: 1.0, g: 0.58, b: 0.26, a: 1 },
  sun: { r: 1.0, g: 0.60, b: 0.14, a: 1 },
  sunSoft: { r: 1.0, g: 0.82, b: 0.38, a: 1 },
  moon: { r: 0.24, g: 0.68, b: 1.0, a: 1 },
  moonSoft: { r: 0.52, g: 0.86, b: 1.0, a: 1 },
  cyan: { r: 0.2, g: 0.95, b: 1.0, a: 1 },
  white: { r: 1, g: 1, b: 1, a: 1 },
  glass: { r: 0.12, g: 0.08, b: 0.22, a: 0.94 },
  glassLight: { r: 0.28, g: 0.17, b: 0.44, a: 0.92 },
};

export function applyPbr(entity: number, color: GraphicColor, metallic = 0.12, roughness = 0.48): void {
  Material.setPbrMaterial(entity, {
    albedoColor: Color4.create(color.r, color.g, color.b, color.a ?? 1),
    metallic,
    roughness,
  });
}

export function applyEmissive(entity: number, color: GraphicColor, intensity = 1.8): void {
  Material.setPbrMaterial(entity, {
    albedoColor: Color4.create(color.r, color.g, color.b, color.a ?? 1),
    emissiveColor: Color4.create(color.r, color.g, color.b, 1),
    emissiveIntensity: intensity,
    metallic: 0.05,
    roughness: 0.32,
  });
}

```


---
# PAGE 2: `src/graphics/primitives.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { engine, MeshCollider, MeshRenderer, Transform } from '@dcl/sdk/ecs';
import { Vector3, Quaternion } from '@dcl/sdk/math';
import { applyEmissive, applyPbr, GraphicColor } from './materials';

export interface BoxOptions {
  collider?: boolean;
  emissive?: boolean;
  metallic?: number;
  roughness?: number;
}

export function createBox(position: Vector3, scale: Vector3, color: GraphicColor, options: BoxOptions = {}): number {
  const entity = engine.addEntity();
  Transform.create(entity, { position, scale });
  MeshRenderer.setBox(entity);
  if (options.emissive) applyEmissive(entity, color);
  else applyPbr(entity, color, options.metallic ?? 0.12, options.roughness ?? 0.48);
  if (options.collider) MeshCollider.setBox(entity);
  return entity;
}

export function createSphere(position: Vector3, scale: Vector3, color: GraphicColor, emissive = false): number {
  const entity = engine.addEntity();
  Transform.create(entity, { position, scale });
  MeshRenderer.setSphere(entity);
  if (emissive) applyEmissive(entity, color);
  else applyPbr(entity, color, 0.08, 0.5);
  return entity;
}

export function createRotatedBox(position: Vector3, scale: Vector3, rotation: Quaternion, color: GraphicColor, emissive = false): number {
  const entity = engine.addEntity();
  Transform.create(entity, { position, scale, rotation });
  MeshRenderer.setBox(entity);
  if (emissive) applyEmissive(entity, color);
  else applyPbr(entity, color, 0.14, 0.44);
  return entity;
}

```


---
# PAGE 3: `src/graphics/animation/pulses.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { engine, Transform } from '@dcl/sdk/ecs';
import { Vector3 } from '@dcl/sdk/math';

export interface PulseRef {
  entity: number;
  baseScale: Vector3;
  speed: number;
  amount: number;
  phase: number;
}

const pulses: PulseRef[] = [];
let initialized = false;

export function addPulse(entity: number, baseScale: Vector3, speed = 2, amount = 0.08, phase = 0): void {
  pulses.push({ entity, baseScale, speed, amount, phase });
}

export function initPulseSystem(): void {
  if (initialized) return;
  initialized = true;
  engine.addSystem(() => {
    const time = Date.now() / 1000;
    for (const item of pulses) {
      const wave = 1 + Math.sin(time * item.speed + item.phase) * item.amount;
      const t = Transform.getMutable(item.entity);
      t.scale = Vector3.create(
        item.baseScale.x * wave,
        item.baseScale.y * wave,
        item.baseScale.z * wave,
      );
    }
  });
}

```


---
# PAGE 4: `src/graphics/animation/float.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { engine, Transform } from '@dcl/sdk/ecs';
import { Vector3 } from '@dcl/sdk/math';

interface FloatingRef {
  entity: number;
  origin: Vector3;
  amplitude: number;
  speed: number;
  phase: number;
}

const floating: FloatingRef[] = [];
let initialized = false;

export function addFloat(entity: number, origin: Vector3, amplitude = 0.25, speed = 1, phase = 0): void {
  floating.push({ entity, origin, amplitude, speed, phase });
}

export function initFloatSystem(): void {
  if (initialized) return;
  initialized = true;
  engine.addSystem(() => {
    const time = Date.now() / 1000;
    for (const item of floating) {
      const offset = Math.sin(time * item.speed + item.phase) * item.amplitude;
      Transform.getMutable(item.entity).position = Vector3.create(
        item.origin.x,
        item.origin.y + offset,
        item.origin.z,
      );
    }
  });
}

```


---
# PAGE 5: `src/graphics/scene/skyDome.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { Vector3 } from '@dcl/sdk/math';
import { createSphere, createBox } from '../primitives';
import { GRAPHIC_COLORS } from '../materials';
import { addFloat, initFloatSystem } from '../animation/float';

export function buildSkyBackdrop(): void {
  const backPanels = [
    { x: 8, y: 5.8, z: 15.5, sx: 15.4, sy: 10.4, sz: 0.25, c: GRAPHIC_COLORS.violet },
    { x: 0.5, y: 5.2, z: 8, sx: 0.25, sy: 9.4, sz: 15.4, c: GRAPHIC_COLORS.pink },
    { x: 15.5, y: 5.2, z: 8, sx: 0.25, sy: 9.4, sz: 15.4, c: GRAPHIC_COLORS.moon },
  ];
  for (const panel of backPanels) {
    createBox(Vector3.create(panel.x, panel.y, panel.z), Vector3.create(panel.sx, panel.sy, panel.sz), panel.c, { emissive: true });
  }

  const cloudSeeds = [
    [2.2, 6.4, 2.5, 0], [5.8, 7.0, 1.1, 0.6], [10.8, 6.6, 2.2, 1.3], [13.5, 7.5, 0.8, 2.1],
    [3.5, 5.2, 12.5, 0.4], [11.8, 5.7, 12.9, 1.8],
  ];
  initFloatSystem();
  cloudSeeds.forEach(([x, y, z, phase], index) => {
    const cloud = createSphere(Vector3.create(x, y, z), Vector3.create(1.15, 0.45, 0.72), GRAPHIC_COLORS.white);
    addFloat(cloud, Vector3.create(x, y, z), 0.12 + (index % 2) * 0.04, 0.55 + (index % 3) * 0.1, phase);
    const cloud2 = createSphere(Vector3.create(x + 0.85, y + 0.12, z + 0.1), Vector3.create(0.82, 0.36, 0.56), GRAPHIC_COLORS.white);
    addFloat(cloud2, Vector3.create(x + 0.85, y + 0.12, z + 0.1), 0.1, 0.6, phase + 0.4);
  });
}

```


---
# PAGE 6: `src/graphics/scene/stars.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { Vector3 } from '@dcl/sdk/math';
import { createSphere } from '../primitives';
import { GRAPHIC_COLORS } from '../materials';
import { addPulse, initPulseSystem } from '../animation/pulses';

export function buildStarField(): void {
  initPulseSystem();
  const points = [
    [1.2, 8.0, 4.2], [3.4, 7.5, 6.4], [6.2, 8.5, 3.4], [9.4, 7.9, 5.2],
    [12.2, 8.4, 4.1], [14.1, 7.7, 6.7], [2.1, 8.2, 10.4], [5.1, 7.9, 12.2],
    [9.2, 8.6, 11.0], [13.1, 8.0, 10.2], [7.7, 7.8, 14.2],
  ];
  points.forEach(([x, y, z], index) => {
    const star = createSphere(Vector3.create(x, y, z), Vector3.create(0.06, 0.06, 0.06), index % 3 === 0 ? GRAPHIC_COLORS.sunSoft : GRAPHIC_COLORS.white, true);
    addPulse(star, Vector3.create(0.06, 0.06, 0.06), 1.7 + index * 0.12, 0.45, index * 0.3);
  });
}

```


---
# PAGE 7: `src/graphics/arena/stage.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { Vector3, Quaternion } from '@dcl/sdk/math';
import { createBox, createRotatedBox } from '../primitives';
import { GRAPHIC_COLORS } from '../materials';

export function buildArenaStage(): void {
  createBox(Vector3.create(8, 0.38, 8), Vector3.create(10.8, 0.18, 6.8), GRAPHIC_COLORS.midnight);
  createBox(Vector3.create(8, 0.52, 8), Vector3.create(10.2, 0.08, 6.2), GRAPHIC_COLORS.glassLight, { emissive: true });

  for (const z of [5.1, 10.9]) {
    for (let i = 0; i < 9; i += 1) {
      const x = 3.1 + i * 1.225;
      createBox(Vector3.create(x, 0.66, z), Vector3.create(0.72, 0.08, 0.12), i % 2 === 0 ? GRAPHIC_COLORS.pink : GRAPHIC_COLORS.violetBright, { emissive: true });
    }
  }

  for (const x of [2.75, 13.25]) {
    for (let i = 0; i < 5; i += 1) {
      const z = 5.4 + i * 1.3;
      createBox(Vector3.create(x, 0.68, z), Vector3.create(0.12, 0.08, 0.75), i % 2 === 0 ? GRAPHIC_COLORS.sun : GRAPHIC_COLORS.moon, { emissive: true });
    }
  }

  createRotatedBox(Vector3.create(8, 0.8, 8), Vector3.create(0.12, 0.14, 5.25), Quaternion.fromEulerDegrees(0, 45, 0), GRAPHIC_COLORS.white, true);
  createRotatedBox(Vector3.create(8, 0.81, 8), Vector3.create(0.12, 0.14, 5.25), Quaternion.fromEulerDegrees(0, -45, 0), GRAPHIC_COLORS.white, true);
}

```


---
# PAGE 8: `src/graphics/arena/pillars.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { Vector3 } from '@dcl/sdk/math';
import { createBox, createSphere } from '../primitives';
import { GRAPHIC_COLORS } from '../materials';
import { addPulse, initPulseSystem } from '../animation/pulses';

export function buildArenaPillars(): void {
  initPulseSystem();
  const positions = [
    [2.1, 3.1, 3.0, GRAPHIC_COLORS.sun], [13.9, 3.1, 3.0, GRAPHIC_COLORS.moon],
    [2.1, 3.1, 13.0, GRAPHIC_COLORS.sunSoft], [13.9, 3.1, 13.0, GRAPHIC_COLORS.moonSoft],
  ] as const;
  positions.forEach(([x, y, z, color], index) => {
    createBox(Vector3.create(x, y, z), Vector3.create(0.42, 5.2, 0.42), GRAPHIC_COLORS.midnight, { emissive: true });
    const orb = createSphere(Vector3.create(x, 5.9, z), Vector3.create(0.52, 0.52, 0.52), color, true);
    addPulse(orb, Vector3.create(0.52, 0.52, 0.52), 1.5, 0.14, index * 0.8);
    createBox(Vector3.create(x, 1.0, z), Vector3.create(0.85, 0.16, 0.85), color, { emissive: true });
  });
}

```


---
# PAGE 9: `src/graphics/arena/centerpiece.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { Vector3 } from '@dcl/sdk/math';
import { createBox, createSphere } from '../primitives';
import { GRAPHIC_COLORS } from '../materials';
import { addFloat, initFloatSystem } from '../animation/float';
import { addPulse, initPulseSystem } from '../animation/pulses';

export function buildArenaCenterpiece(): void {
  initFloatSystem();
  initPulseSystem();
  const orb = createSphere(Vector3.create(8, 4.9, 8), Vector3.create(0.72, 0.72, 0.72), GRAPHIC_COLORS.white, true);
  addFloat(orb, Vector3.create(8, 4.9, 8), 0.18, 1.4, 0.2);
  addPulse(orb, Vector3.create(0.72, 0.72, 0.72), 2.3, 0.12, 0.5);

  for (let i = 0; i < 6; i += 1) {
    const ray = createBox(Vector3.create(8, 4.85, 8 + 1.35 - i * 0.45), Vector3.create(0.08, 0.08, 0.32 + i * 0.06), i % 2 === 0 ? GRAPHIC_COLORS.pink : GRAPHIC_COLORS.cyan, { emissive: true });
    addFloat(ray, Vector3.create(8, 4.85, 8 + 1.35 - i * 0.45), 0.1, 1.1, i * 0.7);
  }
}

```


---
# PAGE 10: `src/graphics/scene/signage.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { Billboard, TextShape, Transform, engine } from '@dcl/sdk/ecs';
import { Vector3 } from '@dcl/sdk/math';
import { createBox } from '../primitives';
import { GRAPHIC_COLORS } from '../materials';

function label(text: string, position: Vector3, size: number, color = GRAPHIC_COLORS.white): number {
  const entity = engine.addEntity();
  Transform.create(entity, { position });
  Billboard.create(entity);
  TextShape.create(entity, { text, fontSize: size, textColor: color });
  return entity;
}

export function buildGraphicSignage(): void {
  createBox(Vector3.create(8, 6.8, 0.8), Vector3.create(9.6, 1.15, 0.18), GRAPHIC_COLORS.glass, { emissive: true });
  label('FRIENDZONE', Vector3.create(8, 6.85, 0.58), 1.45, GRAPHIC_COLORS.pinkSoft);
  label('TUG OF WAR ARENA', Vector3.create(8, 6.15, 0.6), 0.58, GRAPHIC_COLORS.white);

  createBox(Vector3.create(8, 1.9, 1.0), Vector3.create(7.4, 1.2, 0.15), GRAPHIC_COLORS.glass, { emissive: true });
  label('PULL TOGETHER • REACT • REMATCH', Vector3.create(8, 1.92, 0.7), 0.5, GRAPHIC_COLORS.cyan);
}

```


---
# PAGE 11: `src/graphics/social/teamBadges.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { Vector3 } from '@dcl/sdk/math';
import { createBox, createSphere } from '../primitives';
import { GRAPHIC_COLORS } from '../materials';
import { addPulse, initPulseSystem } from '../animation/pulses';

export function buildTeamBadges(): void {
  initPulseSystem();
  const teams = [
    { x: 2.9, z: 8, color: GRAPHIC_COLORS.sun, secondary: GRAPHIC_COLORS.sunSoft },
    { x: 13.1, z: 8, color: GRAPHIC_COLORS.moon, secondary: GRAPHIC_COLORS.moonSoft },
  ];
  teams.forEach((team, index) => {
    createBox(Vector3.create(team.x, 2.35, team.z), Vector3.create(2.1, 1.6, 0.18), GRAPHIC_COLORS.glass, { emissive: true });
    const orb = createSphere(Vector3.create(team.x, 2.4, team.z - 0.12), Vector3.create(0.62, 0.62, 0.24), team.color, true);
    addPulse(orb, Vector3.create(0.62, 0.62, 0.24), 1.8, 0.1, index);
    createBox(Vector3.create(team.x, 1.46, team.z), Vector3.create(1.5, 0.1, 0.12), team.secondary, { emissive: true });
  });
}

```


---
# PAGE 12: `src/graphics/scene/portalFrames.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { Vector3, Quaternion } from '@dcl/sdk/math';
import { createRotatedBox, createSphere } from '../primitives';
import { GRAPHIC_COLORS } from '../materials';
import { addPulse, initPulseSystem } from '../animation/pulses';

export function buildPortalFrames(): void {
  initPulseSystem();
  const portals = [
    { x: 3.0, z: 2.0, color: GRAPHIC_COLORS.pink },
    { x: 13.0, z: 14.0, color: GRAPHIC_COLORS.cyan },
  ];
  portals.forEach((portal, index) => {
    createRotatedBox(Vector3.create(portal.x - 0.7, 2.2, portal.z), Vector3.create(0.18, 4.2, 0.55), Quaternion.fromEulerDegrees(0, 0, 4), portal.color, true);
    createRotatedBox(Vector3.create(portal.x + 0.7, 2.2, portal.z), Vector3.create(0.18, 4.2, 0.55), Quaternion.fromEulerDegrees(0, 0, -4), portal.color, true);
    createRotatedBox(Vector3.create(portal.x, 4.25, portal.z), Vector3.create(1.5, 0.18, 0.55), Quaternion.fromEulerDegrees(0, 0, 0), portal.color, true);
    const core = createSphere(Vector3.create(portal.x, 2.2, portal.z), Vector3.create(0.7, 1.6, 0.1), portal.color, true);
    addPulse(core, Vector3.create(0.7, 1.6, 0.1), 1.5, 0.07, index * 1.2);
  });
}

```


---
# PAGE 13: `src/graphics/scene/heroEmblem.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { Vector3 } from '@dcl/sdk/math';
import { createBox, createSphere } from '../primitives';
import { GRAPHIC_COLORS } from '../materials';
import { addFloat, initFloatSystem } from '../animation/float';

export function buildHeroEmblem(): void {
  initFloatSystem();
  const base = createBox(Vector3.create(8, 6.0, 8), Vector3.create(1.6, 0.25, 0.5), GRAPHIC_COLORS.pink, { emissive: true });
  addFloat(base, Vector3.create(8, 6.0, 8), 0.25, 0.75, 0);
  const ballA = createSphere(Vector3.create(7.2, 6.35, 8), Vector3.create(0.3, 0.3, 0.3), GRAPHIC_COLORS.sun, true);
  const ballB = createSphere(Vector3.create(8.8, 6.35, 8), Vector3.create(0.3, 0.3, 0.3), GRAPHIC_COLORS.moon, true);
  addFloat(ballA, Vector3.create(7.2, 6.35, 8), 0.12, 1.3, 0.4);
  addFloat(ballB, Vector3.create(8.8, 6.35, 8), 0.12, 1.3, 1.0);
}

```


---
# PAGE 14: `src/graphics/arena/rails.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { Vector3, Quaternion } from '@dcl/sdk/math';
import { createBox, createRotatedBox } from '../primitives';
import { GRAPHIC_COLORS } from '../materials';

export function buildArenaRails(): void {
  const colors = [GRAPHIC_COLORS.pink, GRAPHIC_COLORS.violetBright, GRAPHIC_COLORS.cyan, GRAPHIC_COLORS.pink];
  for (let i = 0; i < 4; i += 1) {
    const x = 4.0 + i * 2.7;
    createBox(Vector3.create(x, 1.05, 4.45), Vector3.create(2.0, 0.12, 0.12), colors[i], { emissive: true });
    createBox(Vector3.create(x, 1.05, 11.55), Vector3.create(2.0, 0.12, 0.12), colors[(i + 1) % colors.length], { emissive: true });
  }
  createRotatedBox(Vector3.create(8, 1.0, 4.45), Vector3.create(0.14, 0.14, 5.2), Quaternion.fromEulerDegrees(0, 90, 0), GRAPHIC_COLORS.pinkSoft, true);
}

```


---
# PAGE 15: `src/graphics/scene/confetti.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { Vector3 } from '@dcl/sdk/math';
import { createBox } from '../primitives';
import { GRAPHIC_COLORS } from '../materials';
import { addFloat, initFloatSystem } from '../animation/float';

export function buildConfettiField(): void {
  initFloatSystem();
  const colors = [GRAPHIC_COLORS.pink, GRAPHIC_COLORS.sun, GRAPHIC_COLORS.cyan, GRAPHIC_COLORS.violetBright];
  for (let i = 0; i < 18; i += 1) {
    const x = 1.5 + (i * 1.17) % 13;
    const y = 2.2 + (i % 5) * 0.75;
    const z = 2.0 + (i * 2.1) % 12;
    const piece = createBox(Vector3.create(x, y, z), Vector3.create(0.08, 0.22, 0.04), colors[i % colors.length], { emissive: true });
    addFloat(piece, Vector3.create(x, y, z), 0.22, 0.55 + (i % 4) * 0.12, i * 0.43);
  }
}

```


---
# PAGE 16: `src/graphics/scene/decorativeTiles.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { Vector3 } from '@dcl/sdk/math';
import { createBox } from '../primitives';
import { GRAPHIC_COLORS } from '../materials';

export function buildDecorativeTiles(): void {
  const palette = [GRAPHIC_COLORS.pink, GRAPHIC_COLORS.violet, GRAPHIC_COLORS.cyan, GRAPHIC_COLORS.sun];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const x = 3.25 + col * 2.35;
      const z = 3.2 + row * 2.35;
      if (x > 5.5 && x < 10.5 && z > 5.5 && z < 10.5) continue;
      createBox(Vector3.create(x, 0.62, z), Vector3.create(0.58, 0.04, 0.58), palette[(row + col) % palette.length], { emissive: true });
    }
  }
}

```


---
# PAGE 17: `src/graphics/worldGraphics.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
import { buildSkyBackdrop } from './scene/skyDome';
import { buildStarField } from './scene/stars';
import { buildArenaStage } from './arena/stage';
import { buildArenaPillars } from './arena/pillars';
import { buildArenaCenterpiece } from './arena/centerpiece';
import { buildGraphicSignage } from './scene/signage';
import { buildTeamBadges } from './social/teamBadges';
import { buildPortalFrames } from './scene/portalFrames';
import { buildHeroEmblem } from './scene/heroEmblem';
import { buildArenaRails } from './arena/rails';
import { buildConfettiField } from './scene/confetti';
import { buildDecorativeTiles } from './scene/decorativeTiles';

let built = false;

export function buildAdvancedWorldGraphics(): void {
  if (built) return;
  built = true;

  buildSkyBackdrop();
  buildStarField();
  buildArenaStage();
  buildArenaPillars();
  buildArenaCenterpiece();
  buildGraphicSignage();
  buildTeamBadges();
  buildPortalFrames();
  buildHeroEmblem();
  buildArenaRails();
  buildConfettiField();
  buildDecorativeTiles();
}

```


---
# PAGE 18: `src/graphics/index.ts`

**Purpose:** Isolate one graphics responsibility so visual changes do not leak into gameplay or social logic.

```ts
export * from './materials';
export * from './primitives';
export * from './worldGraphics';

```


---
# PAGE 19: Visual Architecture

The graphics layer is a presentation subsystem. `world.ts` owns composition, `worldGraphics.ts` owns the graphics bundle, and leaf modules own individual visual families. This lets the 3D art pass evolve without changing the tug-of-war scoring reducer or social domain.

The recommended flow is `world.ts → buildAdvancedWorldGraphics() → scene/arena/social graphics modules`. The graphics modules never import the mobile app, blockchain client, or governance data layer. The only shared dependency is math plus lightweight ECS primitives.


---
# PAGE 20: Palette and Material Strategy

The palette intentionally combines midnight violet foundations with saturated pink, cyan, Sun orange, and Moon blue accents. PBR materials are kept slightly rough so the world reads as polished game art rather than mirror-like chrome. Emissive materials are reserved for focal points, rails, badges, stars, and hero objects.

A central `GRAPHIC_COLORS` object prevents accidental drift between modules. A future art pass can change the entire scene by editing one module.


---
# PAGE 21: Layered Depth

Depth is created through three layers: distant sky/cloud panels, midground arena structures, and foreground interactive landmarks. This is more efficient than a large number of bespoke assets and produces a stronger sense of place with simple primitives.

The stage and rails establish the arena boundary; pillars create a vertical silhouette; the centerpiece gives a central focal point; portals and signs establish navigational anchors.


---
# PAGE 22: Sky Backdrop

The backdrop is not intended to be a literal skybox. It uses oversized low-cost panels and clouds to establish a color field behind the gameplay. Clouds float slowly so the scene never feels completely static. The system initializes the float animation once and keeps the motion bounded.


---
# PAGE 23: Star Field

The stars provide visual polish around the upper half of the scene. They are intentionally few in number and very small. Pulse animation scales them subtly rather than continuously translating them, which gives a twinkling effect without a costly particle implementation.


---
# PAGE 24: Arena Stage

The stage is built as a dark platform, a raised emissive inset, perimeter lights, and an X-shaped center marker. This makes the gameplay surface read as a physical arena floor rather than a flat plane. The geometry is intentionally rectangular so it remains easy to navigate and debug.


---
# PAGE 25: Vertical Landmarks

The four pillars create a recognisable silhouette from the spawn point. Each pillar has an emissive cap and a small base light. Because the vertical elements are placed at corners, they frame the arena without blocking the rope or team bases.


---
# PAGE 26: Centerpiece

The centerpiece is a floating luminous orb with small rays. It acts as a focal point that visually connects the rope, scoreboards, and team sides. Its motion is deliberately slower than the gameplay animation, avoiding visual competition with the rope.


---
# PAGE 27: Signage

Large world-space labels communicate the product name and core social loop. Signage is billboarded so it remains readable from common camera angles. The title board uses a backplate so the typography remains legible against the sky.


---
# PAGE 28: Team Badges

Sun and Moon badges give the left and right sides distinct visual ownership. Rather than relying only on text, the team bases receive physical glowing markers. This supports quick comprehension even when a player is moving through the arena.


---
# PAGE 29: Portal Frames

The portal frames create clear spatial transitions to social or companion surfaces. The frame geometry is intentionally simple: two angled posts, a top beam, and a center field. Pulsing the center field creates a portal-like effect without introducing an external asset dependency.


---
# PAGE 30: Hero Emblem

The floating emblem creates a premium hero moment above the arena. It can become a future hook for seasonal branding. The code keeps the object composition small so a future logo replacement is straightforward.


---
# PAGE 31: Arena Rails

Rails add edge lighting to the gameplay surface. They create a boundary that helps the arena read from a distance and makes the center space feel more intentional. Short segments are used instead of one large mesh so colors can alternate without a custom model.


---
# PAGE 32: Confetti

Confetti is used as ambient celebration dressing rather than as a full particle engine. Each piece is a tiny box with a subtle floating motion. The object count is bounded, and the effect can be disabled later without changing gameplay.


---
# PAGE 33: Decorative Tiles

Floor tiles break up large empty surfaces and introduce rhythm. They alternate between a small palette and intentionally skip the center gameplay zone. This preserves the readability of the arena while making the surrounding space feel authored.


---
# PAGE 34: Animation Systems

The pulse and float systems are intentionally separate. Pulse changes scale; float changes vertical position. Each system stores references rather than recreating animation objects every frame. An initialization guard prevents accidental duplicate systems if the world is composed more than once during development.


---
# PAGE 35: Graphics Composition

`buildAdvancedWorldGraphics()` is idempotent. Its sole job is to compose the graphics modules in a stable order. Stable ordering matters because the world should render consistently and because future contributors can add or remove an entire visual family without editing unrelated code.


---
# PAGE 36: Integration with Existing World

The existing `buildFriendzoneWorld()` calls the new builder after the base platform and before the social and governance content. This keeps the visual layer behind interactive systems conceptually while still allowing graphics to establish the scene's visual identity early in construction.


---
# PAGE 37: Relationship to Mock Data

The new graphics are intentionally independent of the mock 3D dataset. That separation is important: mock data can drive player labels, rooms, missions, and events, while this graphics system defines the environment. Future data-driven props can compose on top of the same primitives.


---
# PAGE 38: Relationship to Gameplay

The graphics layer does not own rope rules, score rules, win conditions, or social state. Existing arena code remains the source of truth. This minimizes regression risk and makes it possible to tune visuals without changing gameplay behavior.


---
# PAGE 39: Graphics Performance Budget

The implementation favors simple boxes and spheres, compact material definitions, and bounded animation lists. The most important optimization is architectural: graphics are created once, not recreated on every tick. High-frequency gameplay remains in the existing arena system.


---
# PAGE 40: Mobile Companion Strategy

The React Native app should not attempt to render the full Decentraland scene. It should project the same social state into 2D surfaces and use a World entry card to bridge players into the immersive environment. This keeps native mobile UI responsive while the World owns 3D presentation.


---
# PAGE 41: Future Asset Hook

If custom GLB assets are added later, they should be introduced behind small asset modules and loaded only where they improve the scene meaningfully. The current primitive-based design creates a stable spatial skeleton that can accept richer assets without changing navigation or game rules.


---
# PAGE 42: QA and Visual Regression

Test from at least spawn, Sun side, Moon side, arena center, and governance plaza. Check readability of all world labels, visibility of the rope, absence of geometry blocking interactive pads, and that animated objects return to their expected bounds. A simple screenshot checklist is more valuable than changing the scene by intuition.


---
# PAGE 43: Hackathon Demo Presentation

For judging, begin at the spawn plaza, show the large Friendzone sign, walk to the arena, demonstrate the rope interaction, then point out the team bases, social board, event area, and governance plaza. The new graphics are most valuable when they make the World visibly spatial within the first 10 seconds.


---
# PAGE 44: Safe Degradation

If an advanced graphic fails to construct, the core arena should remain usable. Avoid making gameplay depend on decorative objects. Keep the graphics builder additive and catch only errors that can be safely handled without hiding genuine SDK configuration problems.


---
# PAGE 45: Final Visual Checklist

Before publishing, verify: the skyline has depth; the arena has a recognizable frame; Sun and Moon sides are visually distinct; the rope remains the primary game focus; labels are readable; portals are discoverable; governance still has its own landmark; motion is subtle; and the scene does not become visually noisy during active gameplay.


---
# Implementation Checklist

- [x] Central graphics color palette
- [x] Shared PBR and emissive helpers
- [x] Primitive creation helpers
- [x] Pulse animation system
- [x] Float animation system
- [x] Sky/cloud backdrop
- [x] Star field
- [x] Raised arena stage
- [x] Vertical arena landmarks
- [x] Arena centerpiece
- [x] Product signage
- [x] Sun/Moon team badges
- [x] Portal frames
- [x] Hero emblem
- [x] Edge rails
- [x] Confetti dressing
- [x] Decorative floor tiles
- [x] Additive integration into `world.ts`
- [x] Static TypeScript parse validation of graphics files

## Local verification

```bash
cd decentraland-world
npm install
npm run lint
npm run build
npm run start
```

Do not claim a full SDK build has passed until these commands have been run with the installed Decentraland SDK dependency tree.
