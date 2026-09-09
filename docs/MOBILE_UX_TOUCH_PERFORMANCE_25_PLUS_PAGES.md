# Mobile UX, Touch Control, and Performance Implementation

Tug of War Arena — Friendzone companion  
Document version: 1.0  
Audience: implementers, reviewers, and hackathon judges

This guide describes the mobile UX, one-thumb touch, and performance layer added on top of the existing Tug of War Arena / Friendzone codebase. Source of truth is the TypeScript modules listed here. Game scoring still lives in `lib/game-rules.ts`; this layer only budgets input, haptics, motion, lists, and diagnostics.

---

## Page 1 — Purpose

The companion is portrait-first. The core loop is still **join → pull → react → rematch**, but high-frequency taps were able to:

* fire uncapped haptic impacts
* re-render the whole HUD on every tap
* keep an FPS sampler running while the arena was off-screen
* grow leaderboard and activity lists without a window

This implementation moves those concerns into `lib/mobile-ux` (pure, testable) and `components/mobile` (Reanimated UI), then routes `MobileArena` at the existing import path.

---

## Page 2 — What shipped

* 136px one-thumb PULL control
* Haptic feedback throttling (min interval + per-second cap)
* Pull / reaction / surge rate limiting
* Reanimated press scale and existing Reanimated rope
* Reduced-motion accessibility support
* Larger mobile touch targets and hit slop
* Responsive device sizing helpers
* Compact mobile player cards
* Windowed leaderboard and activity lists
* Bounded render / memory budgets
* Visibility-aware performance monitoring
* FPS / performance diagnostics
* Loading skeletons
* Error and retry states
* Mobile notices / toasts
* Quick-action controls
* Mobile modal and focus helpers
* Room preview / discovery surfaces
* Responsive mobile hero / section components
* Development-only Mobile UX Lab
* Unit tests for touch geometry and interaction throttling
* `MobileArena` re-export of `EnhancedMobileArena`
* This implementation document and patch notes

---

## Page 3 — Non-goals

* Replacing Friendzone pull math (`applyOpponentPressure`, `resolveArenaOutcome`, surge-at-7)
* Replacing the Decentraland `scene/` renderer
* Adding a new native navigation stack
* Shipping a production multiplayer protocol
* Changing wallet or contract ABIs

`EnhancedMobileArena` calls `lib/mobile-ux/arena.ts`, which calls `lib/game-rules.ts`. Visual chrome can change; a tap still moves the rope by the same swing.

---

## Page 4 — Architecture

```text
Touch
  → PullControl (136pt, Reanimated press)
  → haptic budget (optional impact)
  → pull rate gate (70ms)
  → applyThrottledPull → game-rules
  → React state (taps / streak / pull)
  → AnimatedRope (Reanimated spring, skipped if reduce-motion)
```

Off the hot path:

```text
AppState / view visibility
  → VisibilityAwareMonitor
  → DiagnosticSnapshot
  → PerformanceHud (__DEV__)
```

Lists and toasts never receive unbounded arrays. `windowSlice` and `boundedQueue` keep them inside `COMPANION_RENDER_BUDGET`.

---

## Page 5 — File map (domain)

| File | Role |
| --- | --- |
| `lib/mobile-ux/touch.ts` | 136pt geometry, hit slop, thumb-reach band |
| `lib/mobile-ux/throttle.ts` | Pull / reaction / surge / notice gates |
| `lib/mobile-ux/haptics.ts` | Sliding-window haptic budget |
| `lib/mobile-ux/motion.ts` | Reduced-motion durations and press scale |
| `lib/mobile-ux/device.ts` | compact / regular / large breakpoints |
| `lib/mobile-ux/budget.ts` | List windows, toast cap, particle cap, memory bands |
| `lib/mobile-ux/performance.ts` | Visibility-aware FPS sampler |
| `lib/mobile-ux/diagnostics.ts` | FPS copy and grades |
| `lib/mobile-ux/notices.ts` | Bounded toast queue |
| `lib/mobile-ux/focus.ts` | Modal focus capture / restore |
| `lib/mobile-ux/arena.ts` | Throttled steps on Friendzone rules |
| `lib/mobile-ux/index.ts` | Public barrel |

---

## Page 6 — File map (UI, hooks, routes)

| File | Role |
| --- | --- |
| `components/MobileArena.tsx` | `export { EnhancedMobileArena as MobileArena }` |
| `components/mobile/EnhancedMobileArena.tsx` | Full enhanced arena surface |
| `components/mobile/PullControl.tsx` | One-thumb PULL |
| `components/mobile/PressScale.tsx` | Reanimated press wrapper |
| `components/mobile/PlayerCard.tsx` | Compact crew row |
| `components/mobile/LeaderboardList.tsx` | Windowed FlatList |
| `components/mobile/ActivityList.tsx` | Windowed activity |
| `components/mobile/LoadingSkeleton.tsx` | Bounded shimmers |
| `components/mobile/ErrorRetry.tsx` | Error + retry |
| `components/mobile/MobileNotice.tsx` | Toast row |
| `components/mobile/QuickActions.tsx` | 52pt action chips |
| `components/mobile/MobileModal.tsx` | Sheet + modal a11y |
| `components/mobile/RoomPreview.tsx` | Discovery cards |
| `components/mobile/MobileHero.tsx` | Responsive hero |
| `components/mobile/MobileSection.tsx` | Responsive section |
| `components/mobile/PerformanceHud.tsx` | FPS overlay |
| `hooks/use-reduce-motion.ts` | OS reduce-motion |
| `hooks/use-mobile-interaction.ts` | Gates + haptic budget |
| `hooks/use-visibility-performance.ts` | AppState-aware FPS |
| `app/dev/mobile-ux-lab.tsx` | Dev playground |

---

## Page 7 — Existing import path

Keep:

```tsx
import { MobileArena } from "@/components/MobileArena";
```

`components/MobileArena.tsx` is:

```tsx
export { EnhancedMobileArena as MobileArena } from "./mobile/EnhancedMobileArena";
```

The home arena in `app/(tabs)/index.tsx` now uses `PullControl` for the same 136pt target and a `createPullGate()` so rapid taps cannot stampede the Friendzone reducer. Scoring is unchanged.

---

## Page 8 — Touch geometry

Constants:

* `MIN_TOUCH_TARGET_PT = 44` (Apple HIG / Material floor)
* `ONE_THUMB_PULL_SIZE = 136` (matches `PULL_BUTTON_SIZE` in `lib/mobile/sizing.ts`)
* `ICON_CHROME_SIZE = 44`
* `QUICK_ACTION_SIZE = 52`
* `DEFAULT_HIT_SLOP = 8`

`hitSlopForRect(32, 32)` expands by 6pt on each edge so the **effective** target is 44×44 without drawing a 44pt visual on dense chrome.

`isInThumbReach(x, y)` is the lower portrait band (`x` 0.14–0.86, `y` 0.58–0.96). The PULL control belongs there; settings icons stay in the top corners with a 44pt hit area.

---

## Page 9 — One-thumb PULL control

`PullControl` always renders at 136×136 with a circular hit target, 8pt extra slop, and a Reanimated press scale (disabled when reduce-motion is on).

Accessibility:

* role: button
* label: “Pull the rope”
* hint changes when the match is not interactive
* `accessibilityState.disabled` follows the match gate

Long-press maps to Power Surge when the parent passes `onLongPress`, matching the existing home-arena gesture.

Haptics are owned by the control’s `createHapticBudget`, wired to `HapticService.play`. The parent should not also fire a light impact on the same tap.

---

## Page 10 — Reanimated press and rope

`PressScale` uses `withSpring(SPRING_SNAP)` on press in/out. `pressScaleForMotion(true)` returns `1`, so reduce-motion users get no scale animation.

Rope motion is the existing `AnimatedRope` (`components/game/AnimatedRope.tsx`): a Reanimated shared value with `withSpring(SPRING_SOFT)`, snapped immediately when `reduceMotion` is true. `EnhancedMobileArena` passes the OS preference through. High-frequency **state** updates are still React; the path interpolation is the part that stays on the UI thread.

Do not add a second rope physics loop in the companion. Scene-side rope mapping remains in `scene/`.

---

## Page 11 — Pull / reaction / surge gates

| Gate | Interval | Why |
| --- | --- | --- |
| Pull | 70ms | Allows fast tapping (~14 Hz) without event storms |
| Reaction | 280ms | Crew emoji is social, not a DPS check |
| Surge | 400ms | Prevents double-spend on a sticky long-press |
| Notice | 600ms | Stops toast flicker |

`createRateGate(minIntervalMs, clock)` is injectable so tests do not depend on `Date.now()`.

`peek()` asks whether a consume would succeed without mutating. The PULL button stays enabled during cooldown; extra taps no-op. Disabling the control for 70ms would feel like dropped frames.

---

## Page 12 — Friendzone rules stay authoritative

`lib/mobile-ux/arena.ts` is the only place this layer is allowed to change match numbers, and it only wraps:

* `canInteractWithArena`
* swing 2.3 (sun) / 2.1 (moon)
* +3 on every 7th streak tap
* `resolveArenaOutcome` at pull ≥ 44
* surge +8
* `applyOpponentPressure` on tick
* `resolveTimeoutWinner` when time hits 0

If a pull is rejected by the rate gate, `taps`, `pull`, and `streak` are unchanged. Tests in `tests/mobile-ux-throttle.test.ts` lock that in.

---

## Page 13 — Haptic budget

Phones will coalesce or drop Taptic events if every pull fires an impact. The budget:

* minimum 48ms between plays
* maximum 10 plays per 1000ms sliding window
* `enabled: false` when `shouldPlayHaptic(os, reduceMotion)` is false

`shouldPlayHaptic`:

* web → false (existing `canPlayHaptics` policy)
* reduce-motion → false
* iOS / Android → true

The domain module does **not** import `expo-haptics`. UI hooks pass `play: (kind) => HapticService.play(kind)`. Unit tests inject a recorder.

---

## Page 14 — Reduced motion

`useReduceMotion` subscribes to `AccessibilityInfo`. Helpers:

* `durationForMotion(true, 280) === 0`
* `shouldRunLoopingFx(false)` only
* `shouldCelebrate(reduceMotion, won)`
* `pressScaleForMotion`

Looping FX (confetti, live pulse, particle cap) should call `particleBudget(reduceMotion)` which returns `0` when reduced. The loading skeleton still renders but `ShimmerLoading` holds a static opacity.

The home screen already tracked reduce-motion; the enhanced arena and lab reuse the hook so the preference is not forked.

---

## Page 15 — Device sizing

`classifyDevice(width)`:

* `< 380` → compact (tighter padding, 168pt hero, 32pt avatars)
* `≥ 768` → large
* else → regular (current 390–430pt phones)

`sectionPadding`, `heroMinHeight`, `listRowHeight`, and `playerCardAvatarSize` read the class. Never scale the PULL control below 136pt on compact phones — shrink padding and secondary chrome instead.

---

## Page 16 — Compact player cards

`MobilePlayerCard` is a 56pt-min row: avatar, name, meta, online dot. It is not a dashboard. Crew presence on a phone is a scan, not a profile.

Online/offline is text in `accessibilityLabel` as well as a mint/fog dot so color is not the only channel.

---

## Page 17 — Windowed lists

`COMPANION_RENDER_BUDGET.leaderboardWindow = 12`  
`activityWindow = 8`  
`roomPreviewWindow = 6`

`windowSlice(items, start, size)` is a pure slice. `MobileLeaderboardList` and `MobileActivityList` use `FlatList` with `initialNumToRender` and `maxToRenderPerBatch` clamped to that window. This is not a virtualizer for 10k rows; it is a hard cap for demo and live HUD lists so a noisy social feed cannot mount 200 cells on a mid-range Android.

---

## Page 18 — Render and memory budgets

```ts
COMPANION_RENDER_BUDGET = {
  leaderboardWindow: 12,
  activityWindow: 8,
  roomPreviewWindow: 6,
  toastQueue: 3,
  skeletonCount: 5,
  particleCap: 24,
  particleCapReduced: 0,
  listOverscan: 2,
  memoryMbSoft: 96,
  memoryMbHard: 160,
}
```

`memoryBand(usedMb)` returns `ok | soft | hard`. Diagnostics treat a hard memory band as `critical` even if FPS looks fine.

`particleBudget(reduceMotion, requested)` never exceeds 24 and is 0 when reduced.

---

## Page 19 — Visibility-aware FPS

A backgrounded rAF loop reporting “1 FPS” would falsely drop quality. `VisibilityAwareMonitor` and `MobileOptimizer.enablePerformanceMonitoring` now:

1. Keep sampling only while `visible === true`
2. Reset the frame counter when hidden (no 0 FPS blip)
3. Expose `setVisible(boolean)` on the handle

`shouldSampleFps(visible, appState)` requires `visible && appState === "active"`.

`useVisibilityPerformance` wires `AppState` in the enhanced arena. The HUD is `__DEV__`-only by default.

---

## Page 20 — Diagnostics copy

`gradeFromFps`:

* ≥ 50 good
* ≥ 30 ok
* ≥ 20 low
* else critical

`formatFpsLine(fps, memoryMb, visible)` returns `FPS paused · view hidden` when not visible.

`PerformanceHud` is a tiny overlay, not a settings screen. Judges can open the Mobile UX Lab to see it without playing a match.

---

## Page 21 — Loading skeletons

`MobileLoadingSkeleton` renders one title bar plus up to `skeletonCount` rows of `ShimmerLoading`. It is a placeholder for room lists and leaderboards, not a branded splash. Reduce-motion disables the shimmer loop.

---

## Page 22 — Error and retry

`MobileErrorRetry` is a 44pt retry button with an `alert` role. Copy assumes offline play still exists (“Offline play stays available.”). Do not use this for match-rule failures; those stay in the HUD.

`EnhancedMobileArena` takes `error` + `onRetry` so a parent can recover a failed room fetch without unmounting the tab.

---

## Page 23 — Notices / toasts

`enqueueNotice` refuses a push inside `NOTICE_MIN_INTERVAL_MS` and keeps the last 3 items (`toastQueue`). `MobileNotice` is a left-accent row with a 44pt dismiss target.

Do not route match-critical state only through toasts. Win/loss still belongs on the results screen.

---

## Page 24 — Quick actions

Chips are `QUICK_ACTION_SIZE` (52pt) with 44pt-safe padding. Typical set on the enhanced arena: SURGE, REACT, and a TICK control in the lab for opponent pressure.

Disabled chips keep their label so the player can see that Surge is charging, not missing.

---

## Page 25 — Modal and focus helpers

`modalA11yProps(open, title)` sets `accessibilityViewIsModal` and an alert role while open.

`captureFocus` / `restoreFocusId` are pure snapshots. React Native does not give a DOM focus trap; the helpers exist so tests and future web focus restoration share one shape. `MobileModal` is a bottom sheet with fade, 44pt CLOSE, and `onRequestClose`.

`shouldLockBackground(open)` is the flag parents can use to ignore pulls while a sheet is up.

---

## Page 26 — Room preview / discovery

`RoomPreviewList` windows to 6 rooms. Each row is a join target (≥ 64pt) with name, occupancy, and status in the accessibility label.

This is a discovery surface, not a lobby protocol. `onJoin(id)` is a callback; wiring to party codes stays in the existing Friendzone flow.

---

## Page 27 — Hero and section

`MobileHero` and `MobileSection` take `width` from `useWindowDimensions()` and apply `heroMinHeight` / `sectionPadding`. Compact phones lose vertical air, not type hierarchy.

The lab puts the 136pt PULL inside the hero so reviewers can tap it without entering a match.

---

## Page 28 — EnhancedMobileArena surface

Layout, top to bottom:

1. Match HUD (leave, timer)
2. Performance HUD (dev)
3. Pull / streak / team
4. `AnimatedRope`
5. `PullControl`
6. Quick actions
7. Notices
8. Compact crew cards
9. Room previews
10. Windowed leaderboard + activity

Loading and error short-circuit to skeleton / retry inside `SafeGameScreen` so a graphics fault still has a fallback boundary.

Demo crew, rooms, and board data are local constants. Replace them with live selectors when the party API is connected; do not fetch from this component.

---

## Page 29 — Home screen integration

`app/(tabs)/index.tsx`:

* Imports `PullControl` and `createPullGate`
* Holds `pullGateRef` for the lifetime of the screen
* `tapRope` returns early when the gate rejects
* Light haptic on pull moved into `PullControl` (win/surge still use `fireHaptic("success")`)

The giant Home orchestrator is otherwise unchanged: tutorial, judge walkthrough, wallet, persistence. That is intentional. The enhanced arena is the extractable surface; the demo script stays on Home.

---

## Page 30 — Mobile UX Lab

Route: `app/dev/mobile-ux-lab.tsx` (Expo Router, development).

Tabs: **Lab** (controls, skeleton, error, modal, toasts) and **Arena** (`<MobileArena onLeave={...} />`).

This is not linked from production tabs. Open it with a dev URL / deep link the same way as `app/dev/animation-lab.tsx`.

---

## Page 31 — Compatibility with `lib/mobile`

The older companion kit remains:

* `setupMobileCompatibility(Platform.OS)` in `app/_layout.tsx`
* 44pt / 136pt sizing
* DCL safe-area math
* Discover audit
* `MobileOptimizer` (now visibility-aware)

`lib/mobile-ux` does not replace that kit. It adds interaction budgets and phone HUD widgets. `ONE_THUMB_PULL_SIZE` is asserted equal to `PULL_BUTTON_SIZE` in tests so the two modules cannot drift.

---

## Page 32 — Testing

```bash
pnpm test
```

New files:

* `tests/mobile-ux-touch.test.ts` — 136pt, hit slop, thumb-reach
* `tests/mobile-ux-throttle.test.ts` — gates, Friendzone-wrapped pull/surge, haptic cap
* `tests/mobile-ux-performance.test.ts` — hidden FPS, budgets, motion, device class

Existing `tests/mobile-compatibility.test.ts` still covers platform, safe area, and input mapping. `MobileOptimizer` tests should keep passing: the default handle is visible.

---

## Page 33 — QA checklist (device)

1. PULL is 136pt and reachable with one thumb in portrait.
2. Rapid tapping moves the rope but does not stutter haptics into silence-then-burst.
3. Reduce Motion: no press scale, no rope spring, no shimmer loop, no haptic.
4. Background the app: FPS HUD pauses; returning does not show a fake 1 FPS warning.
5. Leaderboard does not mount more than 12 rows from a long fixture.
6. Error retry restores the surface.
7. Modal CLOSE and Android back dismiss the sheet.
8. Home arena and Mobile UX Lab arena both pull with the same swing numbers.

---

## Page 34 — Performance notes

* Prefer Reanimated for press/rope; do not animate layout with the JS `Animated` API on the PULL control.
* Do not start `VisibilityAwareMonitor` in production HUDs unless you need it; the hook defaults to `__DEV__`.
* `FlatList` windowing here is a cap, not a substitute for a social feed virtualizer.
* Companion memory bands (96 / 160 MB) are for the Expo HUD, not DCL triangle limits. Scene limits stay in `lib/mobile/limits.ts` and `scene/src/performance`.

---

## Page 35 — Integration snippets

### Drop-in arena

```tsx
import { MobileArena } from "@/components/MobileArena";

export function CrewPlay() {
  return <MobileArena onLeave={() => {}} />;
}
```

### Pull-only on an existing screen

```tsx
import { PullControl } from "@/components/mobile";

<PullControl
  onPull={tapRope}
  onLongPress={surgeReady ? activateSurge : undefined}
  disabled={!arenaActionsEnabled}
  color={teamColor}
  reduceMotion={reduceMotion}
/>
```

### Rate-limited reducer

```ts
import { applyThrottledPull, createMobileMatchState } from "@/lib/mobile-ux";

let state = createMobileMatchState("sun");
state = applyThrottledPull(state, Date.now()).state;
```

### Haptic budget in tests

```ts
const played: string[] = [];
const budget = createHapticBudget({ play: (kind) => played.push(kind) });
budget.tryPlay("light", 0);
```

---

## Appendix A — Constants cheat sheet

| Name | Value |
| --- | --- |
| One-thumb PULL | 136pt |
| Min touch | 44pt |
| Pull interval | 70ms |
| Reaction interval | 280ms |
| Surge interval | 400ms |
| Haptic min interval | 48ms |
| Haptic cap | 10 / second |
| Leaderboard window | 12 |
| Activity window | 8 |
| Toast queue | 3 |
| Particle cap | 24 (0 if reduced) |

---

## Appendix B — Related documents

* `docs/MOBILE_UX_TOUCH_PERFORMANCE_PATCH_NOTES.md`
* `CHECKLIST.md` — Discover / device gate
* `docs/runtime-notes.md` — Expo Router `pointerEvents` note
* `README.md` — Mobile UX and accessibility product copy
