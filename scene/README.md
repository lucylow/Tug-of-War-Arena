# Tug of War Arena — Decentraland Scene (SDK 7)

Immersive 3D plaza for the Friendzone Buildathon. The Expo app remains the mobile control surface; this scene is the in-world arena: neon floor, spline rope, Sun/Moon avatars, lighting, particles, weather, advanced props (torches, banners, skybox, vegetation), and a HUD that tracks the same pull range as `lib/game-rules.ts` (`-44` … `44`).

## Preview

```bash
cd scene
npm install
npm start
```

Then open the printed local preview URL. From the repo root you can also run `pnpm scene:start` after the scene dependencies are installed.

## Preview on the Decentraland mobile app

The phone and this machine must be on the same Wi-Fi. Install the [Decentraland mobile app](https://decentraland.org/download) and open it once, then:

```bash
cd scene
npm install
npm run start:mobile
```

Or from the repo root: `pnpm scene:start:mobile`. Scan the terminal QR code. The `--mobile` flag prints a LAN URL the explorer can load and does not also launch the desktop client.

Mobile-specific behavior (see `src/logic/mobileRuntime.ts`):

- HUD uses `screenInset: 'interactable'` so it stays clear of the joystick / chat column
- Only **PULL** and **RESET / REMATCH** (weather cycling is desktop-only)
- No `LightSource` (unsupported until explorer v1.13.0); the plaza is emissive-only
- Pointer `maxDistance` is 32 so the pull pad is reachable from the spawn
- Audio stays off until MP3s are dropped into `sounds/`

## What is in the scene

Walk the plaza in this order: **Friendzone sign → gateway frames → entrance → crew pads → arena stage → pull/rematch → hybrid scoreboard / missions → DAO Governance Plaza → room discovery / event boards → portals**.

| System | Location | Notes |
|---|---|---|
| World graphics layer | `src/graphics/` | Pastel sky, stars, stage, rails, pillars, centerpiece, badges, signage — additive, not gameplay |
| Hybrid demo universe | `src/hybrid/` | Seeded avatars, event pedestals, quest markers, scoreboard, room/event boards (same seed as the mobile companion) |
| Entrance gate and crew pads | `src/entities/entrance.ts` | South gate; Sun/Moon join pads |
| Arena floor, rails, pylons | `src/entities/arena.ts` | Gate openings on the north/south rails |
| Sun/Moon bases | `src/entities/crewBase.ts` | Raised platforms under the flags |
| Spline rope | `src/entities/rope.ts` | 14 segments driven by pull |
| Pull and rematch pads | `src/entities/pads.ts` | `IA_POINTER`, 32m range |
| DAO Governance Plaza | `src/governance/` | In-world proposal pedestals, workflow board, DAO/Forum terminals |
| Friendzone crew board | `src/entities/crewBoard.ts` | Synthetic names and streaks |
| Crew / mobile portals | `src/entities/portals.ts` | Physical handoff markers |
| Avatars | `src/entities/avatar.ts` | Idle / tap / celebrate / defeat |
| Lighting | `src/systems/lighting.ts` | Night skybox; 4 `LightSource`s on desktop only (skipped on mobile until v1.13) |
| Particles | `src/systems/particles.ts` | Sparkles, torch fire, power-surge bursts |
| Ambient motion | `src/systems/ambient.ts` | One system for clouds and sparkles |
| Weather | `src/systems/weather.ts` | Rain, snow, fog via `ParticleSystem` |
| Fireworks | `src/systems/fireworks.ts` | Win celebration |
| 3D HUD | `src/entities/hud3d.ts` | Title, status, timer, score, power bars |
| 2D overlay | `src/ui.tsx` | Pull / rematch (weather on desktop); interactable inset on mobile |
| MessageBus | `src/systems/messageBus.ts` | Demo-safe pull/join/reaction/rematch |
| Mobile bridge | `src/logic/worldBridge.ts` | Event contract for the Expo companion |
| Game state | `src/systems/session.ts` | Lobby → active → finished demo loop |
| Advanced visuals | `src/visuals.ts` | Skybox, torches, banners, vegetation, dummy, audio, VFX |

Primitive meshes are the default so the scene runs without Blender. Drop GLBs into `models/` and set `USE_GLB_ASSETS` in `src/config.ts` to `true`.

## DAO Governance Plaza

North of the rope is a physical governance destination, not a 2D overlay. Players inspect proposal pedestals (POLL / DRAFT / GOVERNANCE), read world-space YES/NO/VP labels, and click **DAO** or **FORUM** terminals. Those clicks call `openExternalUrl()` and open the official Decentraland governance dApp or forum. The World never stores keys or casts binding votes.

Demo proposals are labeled **DEMO**. Switch `scene/src/governance/config.ts` to `live` and set `apiUrl` when a JSON overview endpoint exists. See `docs/DAO_GOVERNANCE_INTEGRATION_RUNBOOK.md` and `docs/25_PLUS_PAGES_DAO_GOVERNANCE_CODE.md`.

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

Toggle with `ENABLE_ADVANCED_VISUALS` / `ENABLE_WORLD_GRAPHICS` / `ENABLE_SCENE_AUDIO` in `src/config.ts`. The graphics layer is documented in `docs/25_PLUS_PAGES_3D_GRAPHICS_CODE.md`.

## Controls

- Tap the **PULL** pad (south of the rope), the on-screen **PULL** button, or the explorer **E / primary** control to start the round and tug as Sun Crew.
- **SPARKLE / RAIN / SNOW / FOG / CLEAR** cycles environmental effects on desktop. Hidden on the mobile explorer HUD.
- **RESET / REMATCH** (the gold pad, on-screen button, or **F / secondary**) returns the plaza to lobby.
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

Use a 2×2 parcel group. On desktop, lights are capped at one per parcel; do not add a fifth `LightSource`. The mobile explorer skips dynamic lights.

## Asset pipeline

See `models/README.md` for Blender → GLB export settings and the Lushy merge workflow.
