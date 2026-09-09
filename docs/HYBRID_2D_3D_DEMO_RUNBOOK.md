# Hybrid 2D + 3D Demo Runbook

All generated records are **synthetic demonstration state**. Do not describe them as live platform users, active production matches, or real-time Decentraland platform statistics.

## Mobile

1. Install dependencies (`pnpm install`).
2. Set `EXPO_PUBLIC_DECENTRALAND_WORLD_URL` to the deployed World URL when available.
3. Open the Friendzone Crew tab.
4. Show the World Companion Card.
5. Show the 2D mini-map.
6. Enter the mobile arena.
7. Use the Open 3D World action.

```bash
pnpm install
pnpm start:mobile
```

## Decentraland World

The World lives in `scene/` (SDK 7). There is no separate `decentraland-world` package.

1. `cd scene`
2. `npm install`
3. `npm run lint`
4. `npm run build`
5. `npm run start`
5. Walk from Main Entrance to Arena.
6. Show Sun/Moon bases.
7. Show the Room Discovery board.
8. Show Event pedestals.
9. Show Missions.
10. Pull the rope.
11. Show score movement.
12. Visit Governance Plaza.

From the repo root:

```bash
pnpm scene:build
pnpm scene:start
```

## Shared demo universe

Both surfaces use seed `20260909` (`lib/hybrid-world` and `scene/src/hybrid`). Expect the same featured room (**Friday Night Pull / 731XZ**) and the same highlighted names (**NovaWisp**, **PixelRally**, **RopeWizard**).
