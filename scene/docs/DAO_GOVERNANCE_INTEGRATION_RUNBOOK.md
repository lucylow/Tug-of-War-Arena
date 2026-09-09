# DAO Governance Plaza — integration runbook

The Friendzone World treats Decentraland DAO participation as a **3D destination**, not a mobile dashboard. Binding votes stay on the official governance dApp.

## Player path

```text
ENTRANCE
  → CREW PADS
  → ARENA / PULL
  → GOVERNANCE PLAZA
  → PROPOSAL PEDESTAL
  → DISCUSS / SNAPSHOT / DAO
  → governance.decentraland.org
```

## What is in the World

| Object | Role |
|---|---|
| Governance pavilion | Platform, columns, plaza title |
| Three proposal pedestals | POLL, DRAFT, GOVERNANCE demo records |
| Workflow board | POLL → DRAFT → GOVERNANCE plus VP thresholds |
| Vote guide | Explains that this World does not cast binding votes |
| DAO / Forum terminals | `openExternalUrl()` after an explicit click |
| Status / metrics labels | YES %, NO %, participating VP, threshold, stage |

Synthetic records are labeled **DEMO**.

## Security boundary

- No private keys, seed phrases, or custodial credentials in the scene
- No local binding-vote transaction
- External links only from pointer clicks (`IA_POINTER`)
- Live fetch failures fall back to demo content so the plaza still renders

## Configuration

Edit `scene/src/governance/config.ts`:

```ts
export const governanceConfig = {
  mode: 'demo', // or 'live'
  apiUrl: undefined, // JSON overview endpoint when live
  officialGovernanceUrl: 'https://governance.decentraland.org/',
  officialForumUrl: 'https://forum.decentraland.org/',
}
```

A live endpoint should match `LiveGovernanceApiResponse` in `scene/src/governance/services/contracts.ts`. Verify current VP thresholds on the official DAO before treating the in-world numbers as policy.

## Preview and publish

```bash
cd scene
npm install
npm run build
npm run start
```

`scene.json` does not need a special permission for `openExternalUrl()` in the current SDK7 schema; the explorer still prompts the player after an explicit click. Replace `YOUR-NAME.dcl.eth` before a Worlds deploy. Click every DAO / Forum / Snapshot control in the explorer and confirm the official site opens.

## Tests

```bash
pnpm test tests/scene-governance.test.ts tests/scene-world.test.ts
```

These cover stage order, percent clamping, VP formatting, demo fallback, canonical URLs, and plaza layout inside the 2×2 parcel. They do not boot the SDK explorer.

## Judge walkthrough

1. Enter at the south gate and pick a crew.
2. Pull the rope.
3. Walk north to the DAO Governance Plaza.
4. Read POLL → DRAFT → GOVERNANCE on the workflow board.
5. Inspect a pedestal marked DEMO.
6. Click **DAO** or **FORUM** and show the official site.
7. Return to the arena and rematch.

React Native remains the portrait companion. The SDK7 World is the in-world arena plus this governance bridge.
