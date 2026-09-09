# Tug of War Arena — Decentraland Scene (SDK 7)

Immersive 3D plaza for the Friendzone Buildathon. The Expo app remains the mobile control surface; this scene is the in-world arena: neon floor, spline rope, Sun/Moon avatars, lighting, particles, weather, advanced props (torches, banners, skybox, vegetation), and a HUD that tracks the same pull range as `lib/game-rules.ts` (`-44` … `44`).

## Preview

```bash
cd scene
npm install
npm start
```

Then open the printed local preview URL. From the repo root you can also run `pnpm scene:start` after the scene dependencies are installed.

## What is in the scene

| System | Location | Notes |
|---|---|---|
| Arena floor, rails, pylons | `src/entities/arena.ts` | Procedural neon plaza; swap to `models/arena.glb` via `USE_GLB_ASSETS` |
| Spline rope | `src/entities/rope.ts` | 14 segments driven by pull |
| Avatars | `src/entities/avatar.ts` | Idle / tap / celebrate / defeat |
| Lighting | `src/systems/lighting.ts` | Night skybox + 1 shadowed spot + 3 point fills (2×2 parcel cap) |
| Particles | `src/systems/particles.ts` | Sparkles, torch fire, power-surge bursts |
| Weather | `src/systems/weather.ts` | Rain, snow, fog via `ParticleSystem` |
| Fireworks | `src/systems/fireworks.ts` | Win celebration |
| 3D HUD | `src/entities/hud3d.ts` | Timer, score, power bars |
| 2D overlay | `src/ui.tsx` | Pull / weather / rematch |
| Game state | `src/systems/session.ts` | Local demo loop with a Colyseus-shaped adapter |
| Advanced visuals | `src/visuals.ts` | Skybox, torches, banners, vegetation, dummy, audio, VFX |

Primitive meshes are the default so the scene runs without Blender. Drop GLBs into `models/` and set `USE_GLB_ASSETS` in `src/config.ts` to `true`.

## Advanced visuals (Part 2)

Quality-gated in `setupAdvancedVisuals()` after platform detection:

| Feature | Location | Notes |
|---|---|---|
| Glow / UV proxy | `src/materials/glowMaterial.ts`, `src/systems/animatedTexture.ts` | Emissive pulse; SDK7 has no UV offset |
| Skybox + sun | `src/entities/skybox.ts` | Inward planes on desktop high; sun only on mobile |
| Torches | `src/entities/torch.ts` | Flicker + GPU fire (`src/effects/fire.ts`) |
| Banners | `src/entities/banner.ts` | Procedural sway, or GLB `sway` clip |
| Vegetation | `src/entities/vegetation.ts` | Seeded scatter, stays off the arena floor |
| Practice dummy | `src/entities/interactive.ts` | Tap to swap Sun/Moon glow |
| God rays | `src/effects/volumetricLight.ts` | Emissive cylinders — no extra lights (parcel cap is 4) |
| Power surge / combo | `src/effects/powerSurge.ts` | Expanding ring + gold combo when both crews ≥ 60 |
| Audio | `src/systems/audio.ts` | Ambient + pull/surge/combo SFX (`sounds/`) |
| LOD | `src/systems/lod.ts`, `src/materials/LODSystem.ts` | Distance scale + mesh swap |

Toggle with `ENABLE_ADVANCED_VISUALS` / `ENABLE_SCENE_AUDIO` in `src/config.ts`.

## Controls

- Click the floor pad or the **PULL** UI button to tug as Sun Crew.
- **SPARKLE / RAIN / SNOW / FOG / CLEAR** cycles environmental effects.
- **RESET / REMATCH** restarts the 30-second demo match.
- With no clicks, the rope plays a gentle sine so the plaza never looks frozen.

## Mapping to the mobile game

Pull, win threshold (`44`), and match duration (`30s`) live in `src/logic/mapping.ts` and are covered by `tests/scene-visuals.test.ts`. Sun maps to the spec’s “red” side; Moon maps to “blue”. `red` / `blue` aliases are accepted on avatar helpers.

## Deploy

```bash
cd scene
npm run build
npm start
# or: npm run deploy
```

Scene Inspector: Ctrl+Shift+I in the explorer preview. Stay inside the mobile soft limits in `src/performance/mobileLimits.ts` (entities 4,800, materials 400, draw calls 1,000).

Use a 2×2 parcel group. Lights are capped at one per parcel; do not add a fifth `LightSource`.

## Asset pipeline

See `models/README.md` for Blender → GLB export settings and the Lushy merge workflow.
