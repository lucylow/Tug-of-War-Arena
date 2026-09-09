# Mobile App Compatibility Checklist

This is the Friendzone Buildathon gate for Tug of War Arena on phones — both the Expo companion and a future Decentraland explorer scene.

## Before Submission

- [ ] **Platform Detection**: Branch UI and logic with `isMobile()` / `setupMobileCompatibility()`
- [ ] **Safe Area**: Critical UI inside the safe zone (companion portrait, or DCL `x: 30%–75%`, `y: 8%–92%`)
- [ ] **UI Sizing**: Touch targets at least 44×44pt (`ICON_BUTTON_SIZE`, `PULL_BUTTON_SIZE`)
- [ ] **Input Mapping**: Key actions use `IA_POINTER` / `IA_PRIMARY` / `IA_SECONDARY` / `IA_JUMP` — never `IA_ACTION_3`–`IA_ACTION_6`
- [ ] **Performance**: Scene / companion loads on a mid-spec device (Samsung Galaxy A54)
- [ ] **Performance Score**: Above 90% on the High graphics profile (DCL explorer)
- [ ] **Preview**: Tested on a real device (not just simulator)
- [ ] **Touch Controls**: Pull, surge, and ready work with one thumb
- [ ] **No Overlap**: UI does not sit under notches, the tab bar, or DCL joystick / chat / profile chrome

## Mobile Scene Limits (Soft / Hard)

| Metric | Soft Limit | Hard Limit | Status |
|--------|------------|------------|--------|
| Triangles | 1,000,000 | 1,200,000 | [ ] |
| Entities | 4,800 | 6,000 | [ ] |
| Meshes | 2,400 | 3,000 | [ ] |
| Materials | 400 | 500 | [ ] |
| Textures | 400 | 500 | [ ] |
| Draw calls | 1,000 | 2,000 | [ ] |
| Performance | 90% | 85% | [ ] |

## Preview Commands

```bash
# Expo companion (QR / tunnel)
pnpm start:mobile

# Native targets
pnpm ios
pnpm android

# Decentraland scene preview
pnpm scene:start
pnpm scene:start:mobile

# Save a QR image
pnpm qr "exps://..."
```

## Discover Featuring Requirements

- [ ] Engaging mobile mechanic (one-thumb tug-of-war)
- [ ] Designed with touch in mind
- [ ] Performance score above 90%
- [ ] All critical UI in the safe area
- [ ] Touch-friendly sizing
- [ ] Tested on a real device
- [ ] Submitted for iOS review if featuring on iOS Discover

Run `evaluateDiscoverReadiness()` from `lib/mobile` to audit the code-level checks.

## Reference Links

- [Mobile Safe Area](https://docs.decentraland.org/creator/build-for-mobile/develop/safe-area)
- [UI Best Practices](https://docs.decentraland.org/creator/build-for-mobile/develop/ui-best-practices)
- [Input on Mobile](https://docs.decentraland.org/creator/build-for-mobile/develop/input-on-mobile)
- [Preview on Mobile](https://docs.decentraland.org/creator/build-for-mobile/develop/preview-on-mobile)
- [Performance Optimization](https://docs.decentraland.org/creator/build-for-mobile/develop/optimize-performance)
- [Get Featured](https://docs.decentraland.org/creator/build-for-mobile/develop/get-featured)
- [iOS Curation](https://docs.decentraland.org/creator/build-for-mobile/develop/ios-curation)
