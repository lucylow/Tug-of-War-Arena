# Final Demo Runbook

Deterministic seed: `20260909`

Featured state (all `origin: "demo"`):

- Players include NovaWisp, PixelRally, MoonRunner, SunSpark, RopeWizard, ArenaFox, TorqueKid, CloudPull, NeonTug, OrbitAce, FluxFighter, StarGrip
- Room: Friday Night Pull / `731XZ` / ACTIVE
- Score: Sun 428 · Moon 381 · `00:42`
- Mission: Pull Together 84 / 100
- Event: Sun vs Moon Cup
- Governance: 1 DEMO proposal + official DAO/forum links
- Wallet: disconnected / demo identity

## Mobile companion

```bash
pnpm install
pnpm check
pnpm lint
pnpm test
pnpm dev
```

Play, crew, missions, and World preview work without MetaMask.

## Decentraland World

```bash
cd decentraland-world
npm install
npm run start
npm run build
```

Do not claim a successful World build unless `npm run build` actually succeeds in this environment.

Replace `YOUR_WORLD_NAME.dcl.eth` before `npm run deploy`.
