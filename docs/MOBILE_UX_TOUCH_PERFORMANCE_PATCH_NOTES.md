# Mobile UX + touch + performance patch notes

## Summary

Added a dedicated companion layer for one-thumb play: 136pt PULL, haptic and pull/reaction budgets, Reanimated press, reduced-motion, windowed lists, visibility-aware FPS, and an `EnhancedMobileArena` mounted at the existing `MobileArena` import.

Friendzone scoring is unchanged. `lib/mobile-ux/arena.ts` wraps `lib/game-rules.ts`.

## Added

* `lib/mobile-ux/*` — touch geometry, gates, haptic budget, motion, device class, render budgets, visibility FPS, diagnostics, notices, focus, throttled match steps
* `components/mobile/PullControl.tsx` and supporting HUD widgets (player card, lists, skeleton, error/retry, notices, quick actions, modal, room preview, hero/section, performance HUD, PressScale)
* `components/mobile/EnhancedMobileArena.tsx`
* `components/MobileArena.tsx` re-export
* `hooks/use-reduce-motion.ts`, `use-mobile-interaction.ts`, `use-visibility-performance.ts`
* `app/dev/mobile-ux-lab.tsx`
* `tests/mobile-ux-touch.test.ts`, `tests/mobile-ux-throttle.test.ts`, `tests/mobile-ux-performance.test.ts`
* `docs/MOBILE_UX_TOUCH_PERFORMANCE_25_PLUS_PAGES.md`

## Changed

* `app/(tabs)/index.tsx` — arena PULL uses `PullControl`; pulls are rate-limited; light haptics move into the control
* `lib/mobile/optimize.ts` — `setVisible` pauses FPS sampling so backgrounded views do not report false low FPS
* `components/mobile/index.ts` — barrel exports for the new widgets
* `README.md` — Mobile UX loop, important files, tests

## Integration

```tsx
import { MobileArena } from "@/components/MobileArena";
```

Development lab: `app/dev/mobile-ux-lab.tsx`.

## Verification

```bash
pnpm test
pnpm check
```

Full lint still needs a local `pnpm lint` after dependencies are installed.
