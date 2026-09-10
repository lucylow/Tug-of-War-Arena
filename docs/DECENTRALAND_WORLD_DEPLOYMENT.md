# Decentraland World deployment

The 3D World lives in `decentraland-world/`. It is a **Decentraland SDK7** scene. The React Native / Expo app is the mobile companion only — it is not the World renderer.

Replace `worldConfiguration.name` in `decentraland-world/scene.json` before production publishing. The placeholder is `YOUR-NAME.dcl.eth`. Do not invent a production name in source.

## Commands

```bash
cd decentraland-world
npm install
npm run lint
npm run build
npm run start
npm run deploy
```

Root shortcuts:

```bash
pnpm world:start
pnpm world:build
pnpm test:world
```

## World NAME

Set `WORLD_NAME_FROM_ENV` or edit `scene.json` `worldConfiguration.name`. Keep the placeholder until a real `.dcl.eth` name is assigned.

## Deployment wallet

`npm run deploy` uses the Decentraland SDK deployer. Use a dedicated deployment wallet. **Never commit private keys, mnemonics, or seed phrases.**

## Preview

`npm run start` opens the local SDK7 preview. Confirm spawn, Sun/Moon bases, arena, rope, and pull pad before publishing.

## Production publishing

1. Replace the World name placeholder.
2. Confirm `runtimeVersion` is `7`.
3. Run `npm run build`.
4. Run `npm run deploy` from a machine that can sign with the deployment wallet.
5. Point `EXPO_PUBLIC_DECENTRALAND_WORLD_URL` at the published World.
