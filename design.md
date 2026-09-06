# Tug of War Arena — Mobile Interface Design

## Product Direction

Tug of War Arena is a portrait-first, one-handed competitive mini-game for the Decentraland Friendzone Mobile Buildathon. The primary demo should be understandable within five seconds: choose a side, enter the arena, tap rapidly to pull the rope, and celebrate the result.

The visual language is **arcade sport meets neon social plaza**: deep indigo surfaces, electric cyan and coral team colors, warm yellow energy highlights, soft glass cards, and chunky high-contrast typography. The interface should feel native to iOS while still reading clearly on Android.

## Screen List

| Screen | Primary content and functionality |
|---|---|
| Arena Home | Brand mark, short value proposition, player identity chip, large “Play now” CTA, compact match preview, quick stats, and navigation to leaderboard/settings. |
| Team Lobby | Match code or “Quick match” state, two team cards, player slots, team selection buttons, ready state, and a clear “Enter arena” action. |
| Tug of War Arena | Countdown, match timer, team power meters, rope track, center marker, stylized player silhouettes, tap zone, tap streak feedback, and pause/leave action. |
| Match Results | Win/loss state, final score, MVP highlight, tap count, rematch button, and return-home action. |
| Leaderboard | Ranked player rows with wins, win rate, tap power, and a local “you” highlight. |
| Settings | Sound and haptics toggles, display preference, short how-to-play instructions, and app version. |

## Key User Flows

### First launch to match

1. The player lands on Arena Home and sees the “Play now” action above the fold.
2. The player taps “Play now”; a light haptic confirms the action and the Team Lobby opens.
3. The player selects Sun Team or Moon Team, then taps “Ready”.
4. Once ready, the player taps “Enter arena” and sees a three-second countdown.
5. The player taps the center action zone repeatedly. Every tap increases team pull, updates the rope position, increments the streak, and gives tactile feedback.
6. When the timer reaches zero or a team crosses the win threshold, the match ends and Match Results appears.
7. The player can rematch instantly or return to Arena Home.

### Exploring stats

1. The player taps the Leaderboard tab.
2. The app shows ranked local/demo entries and the current player highlighted.
3. The player can return to Home or open Settings without losing the current demo session.

## Interaction Rules

Primary actions use a rounded rectangle with a visible pressed scale of approximately 0.97 and light haptics. The arena tap zone is large enough for one-handed use and is positioned in the lower half of the screen. Secondary actions use subtle opacity feedback. All screens have clear safe-area handling and avoid placing critical actions behind the bottom tab bar.

## Color Choices

| Token | Color | Usage |
|---|---|---|
| Ink | `#11142B` | Main background and deep contrast. |
| Midnight | `#1D2150` | Cards, arena panels, and navigation surfaces. |
| Electric Cyan | `#4DE7F2` | Moon Team, interactive highlights, and progress glow. |
| Coral Punch | `#FF6B6B` | Sun Team, opposing energy, and loss states. |
| Solar Gold | `#FFC857` | Primary CTA, streaks, MVP, and win emphasis. |
| Cloud | `#F5F7FF` | Primary text and high-contrast labels. |
| Fog | `#A8B0D8` | Secondary text and metadata. |
| Success Mint | `#72F2B6` | Ready state and victory confirmation. |

## Accessibility and Demo Constraints

The app uses large text, high-contrast team labels, icon-plus-text states, and a tap target no smaller than 48 points. Color is never the only team identifier: team names, side labels, and score values are always shown. The first match should work offline using deterministic local simulation so the hackathon demo has no dependency on a live multiplayer server.
