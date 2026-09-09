# Arena GLB assets

The scene boots with procedural meshes. Replace them with Blender exports by placing files here and setting `USE_GLB_ASSETS` to `true` in `src/config.ts`.

## Files

| File | Description |
|---|---|
| `arena.glb` | Ground, walls, win lanes |
| `rope.glb` | Segmented rope with armature |
| `flag_sun.glb` / `flag_moon.glb` | Team flags |
| `avatar_sun.glb` / `avatar_moon.glb` | Idle, tap, swipe, celebrate, defeat clips |
| `win_zone_sun.glb` / `win_zone_moon.glb` | Pulsing win pads |
| `torch.glb` | Pole + emissive flame, optional `flicker` clip |
| `banner_sun.glb` / `banner_moon.glb` | Cloth with looping `sway` clip |
| `dummy.glb` | Practice dummy (click target) |
| `grass_clump.glb` / `rock_small.glb` / `tree.glb` | Vegetation around the plaza |

## Blender export

- Format: glTF 2.0 (`.glb`)
- Compression: Draco
- Textures: embedded PNG or JPEG
- Units: meters
- Y-up
- Include NLA animation tracks
- Keep each model under ~10k triangles for mobile clients

### Stylized torch

1. Cylinder pole, box base, a few flame planes with an emissive material.
2. Scale/rotate the flame on a 1-second loop named `flicker`.
3. Export selected with animation + embedded textures.

### Rope with bones

1. Add a chain of bones along the rope, bind with automatic weights.
2. Pose a slack, taut, and win-line shape.
3. Export the armature. Until the GLB lands, the scene drives 14 primitive cylinders from `ropeControlPoints()`.

### Banners

1. Plane cloth parented to a pole.
2. Simple rotate-Y `sway` clip (0.6 speed in the scene Animator).
3. Separate Sun (warm) and Moon (cool) albedo.

## Lushy

1. Download stylized grass, rocks, or trees from [Lushy](https://lushy.io).
2. Import into Blender, decimate, merge clumps into one patch per GLB.
3. Export as `grass_clump.glb`, `rock_small.glb`, `tree.glb` (or bake into `arena.glb`).
4. The scene still scatters primitive stand-ins until `USE_GLB_ASSETS` is on.

SDK7 does not expose UV offset on PBR materials. Bake scrolling energy into a GLB clip, or let `systems/animatedTexture.ts` pulse emissive on the plaza strip.
