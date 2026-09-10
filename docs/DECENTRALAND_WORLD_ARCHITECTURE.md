# Decentraland World Architecture

The 3D destination lives in `decentraland-world/`. It is an SDK7 scene (`@dcl/sdk`), not a React Native screen.

```text
SPAWN PLAZA
    ↓
FRIENDZONE SIGN
    ↓
ARENA
↙       ↘
SUN BASE   MOON BASE
↓          ↓
SOCIAL     SOCIAL
↘          ↙
EVENT / GOVERNANCE
    ↓
REMATCH
```

## Runtime

- Entities, transforms, colliders, pointer events, and systems run inside the Decentraland Explorer.
- The scene does not import `react`, `react-native`, `expo`, or browser `window` APIs.
- Demo data is generated in `src/mock3d` and tagged `origin: "demo"`.
- Boards, avatars, and the rope are created from that dataset.

## Publishing

Replace `YOUR_WORLD_NAME.dcl.eth` in `scene.json` before `npm run deploy`.

The older plaza in `/scene` remains as a compatibility World. Use `decentraland-world` for the hybrid hackathon World.
