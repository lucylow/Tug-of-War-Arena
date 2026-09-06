# Tug of War Arena — Hackathon Submission Notes

## One-line pitch

**Tug of War Arena** is a fast, portrait-first social mini-game where players choose a crew, build a tap streak, and pull a shared rope across the line before the clock expires.

## What is implemented

The current Expo React Native prototype includes a branded Arena Home screen, team selection lobby, offline match simulation, timed arena gameplay, opponent pressure, rope movement, power meters, streak feedback, haptic interaction feedback, match results with rematch, local leaderboard, and settings controls for sound, haptics, and contrast preferences. Its Decentraland Friendzone handoff accepts a party invite deep link, confirms the crew code in the lobby, supports copy/share fallback actions, and keeps the wallet-ready reward receipt local until an approved Web3 contract is connected. The app is intentionally offline-first for reliable hackathon demos and does not require a live multiplayer server to demonstrate the core experience.

## Recommended demo path

Launch the app, tap **Crew**, and show the party code plus the copy/share controls. For the Decentraland Friendzone story, open a supported invite link or explain that an arriving player sees **Friendzone Invite Accepted** with the code and next-step lobby context. Then tap **Play now**, select Sun Crew or Moon Crew, tap **Ready up**, and choose **Enter the arena**. Tap the large **Pull!** button rapidly to build momentum. A seven-tap streak earns a small boost, while the simulated opponent applies steady counter-pressure. After the result screen, demonstrate the wallet-ready reward preview and **Run it back**, then open **Ranks** and **Settings** from the bottom navigation.

## Technical notes

The project uses Expo SDK 54, React Native, Expo Router, TypeScript, NativeWind theme tokens, and Expo Haptics. The primary prototype flow is contained in `app/(tabs)/index.tsx`, with shared palette tokens in `theme.config.js`. Run `pnpm validate` from the repository root to execute the deterministic test suite, TypeScript validation, and lint checks in one reproducible gate. The web preview may emit React Native Web's upstream `props.pointerEvents is deprecated` warning; an app-source audit confirms no deprecated `pointerEvents` prop remains in the project.

The Web3 layer is intentionally wallet-ready rather than chain-dependent: the demo shows an optional wallet profile, Friendzone Plaza location context, a Wearable Airdrop preview, a structured wearable asset passport, and explicit claim-readiness states that distinguish a saved local receipt from a future approved mint. The playable loop remains fully offline. The social layer models nearby Friendzone contacts and party handoff without pretending to be a live multiplayer service. The Crew lounge now labels this boundary as a Decentraland Bridge local demo, offers a resilient Plaza world handoff, and keeps event, parcel, party, and reward context visible even when external services are unavailable. This makes the prototype reliable for judging and leaves a clear boundary for connecting approved wallet, presence, and contract services later.

## Judge-facing demo checklist

Use this sequence when presenting to a judge. It is designed to fit in approximately 60 seconds and can be repeated without network access.

| Time | Presenter action | Judge-facing point |
|---|---|---|
| 0–10s | Start on **Home** and point out the live-match banner, **Best Streak**, and optional wallet profile. | The core loop is portrait-first, social, and playable without a wallet or server. |
| 10–20s | Open **Crew**. Show the Friendzone party code, copy/share controls, reactions, nearby contacts, Plaza Chronicle, and activity feed. | The Decentraland layer is a social handoff surface, not a fabricated live multiplayer claim. |
| 20–28s | Invite a nearby contact, or open the Plaza Chronicle and show the parcel **0,0** event sheet. | Party, event, parcel, and reward context flow into one local demo path. |
| 28–42s | Tap **Play now**, choose Sun Crew or Moon Crew, tap **Ready up**, then **Enter the arena**. Pull rapidly and demonstrate the seven-tap **Power Surge**. | Gameplay has immediate feedback, streak skill expression, opponent pressure, and deterministic timing. |
| 42–52s | On Results, show the **Decentraland Friendzone Plaza** location, wallet-ready **Wearable Airdrop**, and local receipt. Open **Settings** to show the asset passport. | The reward layer is credible and explicit: receipt and metadata are local previews until an approved contract is connected. |
| 52–60s | Open **Settings → Demo Diagnostics**. Point out offline readiness, bridge fallback, and the green reset confirmation. | Judges can verify recovery behavior and reset the exact local state before the next run. |

### Presenter recovery notes

If a native share sheet or Plaza link is unavailable, use the visible **ready to copy** or **offline mirror active** status instead of retrying repeatedly. The app keeps the playable loop available and guards duplicate handoffs while copy, share, or open actions are in flight. If a demo reset succeeds, confirm **Reset complete · ready for a fresh walkthrough** before restarting. If cleanup needs a retry, open the recovery Diagnostics action and show that the failure is surfaced without blocking offline play.

### Wallet-ready boundary

Describe the reward flow as a **wallet-ready local demo**. Connecting the demo wallet, equipping the Friendzone Plaza Band, and saving a winning receipt do not mint or claim an on-chain asset. The intended production boundary is an approved wallet and contract integration after the hackathon prototype; no live transaction is required for this submission.


## Submission-assets verification checklist

Before handing the project to a judge or publishing a build, verify the following from the repository root. Every push and pull request also runs the same `pnpm validate` gate through `.github/workflows/validate.yml`.

- [ ] Run `pnpm validate` and confirm the full deterministic suite, TypeScript validation, and lint checks pass; the auth logout test may remain intentionally skipped when no authenticated session is configured.
- [ ] Confirm `app.config.ts` names the build **Tug of War Arena**, preserves the stable slug, and points `logoUrl` to the generated app icon asset.
- [ ] Confirm `assets/images/icon.png`, `splash-icon.png`, and `favicon.png` exist, along with Android foreground, background, and monochrome assets.
- [ ] Open the app once in portrait orientation and verify Home, Crew, arena gameplay, Results, Ranks, Settings, and Demo Diagnostics are reachable from the bottom navigation.
- [ ] Run the presenter sequence once, then use **Demo Diagnostics → Reset Demo** and confirm **Reset complete · ready for a fresh walkthrough** before the next run.
- [ ] If an external Plaza link or native share sheet is unavailable, demonstrate the offline mirror and copy fallback rather than treating the environment limitation as a gameplay failure.

## Suggested next buildathon iteration

The strongest follow-up would be replacing the deterministic local opponent with a Colyseus or WebSocket room, persisting player stats, and adding a shareable match invite. Those changes are intentionally separated from the demo-critical local loop so a network issue does not block judging.
