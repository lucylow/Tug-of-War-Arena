# Project TODO

- [x] Arena Home screen with brand identity and primary play CTA
- [x] Team Lobby with team selection and ready state
- [x] Offline deterministic tug-of-war match simulation
- [x] Arena screen with timer, rope position, power bars, and tap streak feedback
- [x] Match Results screen with rematch and return-home actions
- [x] Leaderboard screen with local player highlight
- [x] Settings screen with sound and haptics preferences
- [x] Native-style haptic feedback on key interactions
- [x] Custom app logo and Expo branding configuration
- [x] App theme tokens updated to Tug of War Arena colors
- [x] Add required icon mappings before using tab icons
- [x] TypeScript, lint, and test validation
- [x] Hackathon submission notes and run instructions

- [x] Persist local wins, pulls, and best streak across sessions
- [x] Add a visible special-move power surge mechanic to arena gameplay
- [x] Add a first-match how-to-play overlay for hackathon demos
- [x] Improve dynamic accessibility labels and live match status announcements

- [x] Add a local wallet-ready profile state for hackathon demos
- [x] Add an optional wallet connection surface that never blocks offline play
- [x] Add reward preview and on-chain-ready match receipt copy
- [x] Document the Web3 integration boundary and future contract connection points

- [x] Stabilize wallet-ready reward UI after the interrupted edit
- [x] Validate wallet/reward screen copy and icon usage across platforms

- [x] Persist a lightweight reward and match receipt history
- [x] Add a rewards history surface to Settings for the hackathon demo
- [x] Improve result feedback with explicit team, reward, and receipt status

- [x] Add a local party presence card with sample crew members
- [x] Add quick reaction/emote controls for the social demo
- [x] Add a lightweight activity feed entry after completed matches

- [x] Generate and persist a local party invite code
- [x] Add copy/share-ready invite feedback in the Crew lounge
- [x] Show party code and member count in the social demo flow

- [x] Add a compact live match status banner for Crew and Home surfaces
- [x] Add a demo-ready match recap action from the activity feed

- [x] Add a celebratory victory burst and stronger win/loss visual hierarchy
- [x] Add a compact match recap summary with crew, pulls, streak, and reward state
- [x] Add recap accessibility labels and clear next actions

- [ ] Add a compact match-history timeline for recent results
- [ ] Add an accessible recap sharing affordance without external dependencies
- [ ] Improve empty-state copy for first-time social and reward users

- [x] Improve key action touch targets to a consistent mobile-friendly minimum
- [x] Add responsive sizing for narrow phone widths without changing the visual identity
- [x] Add accessibility roles and hints to the primary game and social actions

- [x] Persist recent match summaries with result, team, pulls, and date
- [x] Add a compact match-history timeline to Settings
- [x] Add an accessible empty state for players with no recorded matches

- [x] Add an accessible local recap-share action without external dependencies
- [x] Add selected-result highlighting to the match-history timeline
- [x] Add a compact history summary for wins, defeats, and total matches

- [x] Add a compact streak trend indicator to Settings history
- [x] Add a current best-streak callout to the Home stats surface
- [x] Improve match-history result metadata for fast scanning

- [x] Announce key match state changes for screen readers where supported
- [x] Add clearer accessibility hints to the tap and Power Surge controls
- [x] Refine first-use empty-state copy for rewards and match history

- [x] Stabilize and finalize the streak trend performance edit
- [x] Add low-cost screen-reader announcements for key match actions
- [x] Memoize derived match-history summary values to reduce repeated work

- [x] Add native share-sheet support for match recaps when available
- [x] Keep a clear local fallback when native sharing is unavailable
- [x] Respect reduced-motion preferences in victory feedback

- [x] Repair reduced-motion subscription lifecycle and cleanup
- [x] Add an offline-safe share fallback status for recap sharing
- [x] Add lightweight local error fallback copy for storage failures

- [x] Add an app-level graceful error fallback for unexpected render failures
- [x] Add a retry action that returns the player to the Arena Home screen
- [x] Keep local gameplay available when persistence operations fail

- [x] Add a local demo diagnostics panel for build and storage status
- [x] Add clearer match-start and match-completion feedback for live demos
- [x] Add a concise demo reset action for repeatable hackathon testing

- [x] Add a judge-facing demo checklist to the submission notes
- [x] Add a concise in-app pitch card for the Web3-ready offline demo
- [x] Add a quick path from diagnostics to the repeatable demo reset flow

- [x] Add a compact share-ready party invite action to the Crew lounge
- [x] Add clear invite status feedback after native sharing or fallback
- [x] Keep invite sharing optional and non-blocking for offline play

- [x] Parse invite codes from supported deep-link URLs
- [x] Show an invite-arrival state and hand off into the lobby
- [x] Keep normal app launch and offline play unchanged when no invite is present

- [x] Add a visible invite-arrival banner with the accepted crew code
- [x] Add lobby context copy for invite-based arrivals
- [x] Add a compact copy-code action for the active invite

- [x] Inspect and repair current TypeScript or runtime errors
- [x] Add safe deep-link parsing fallback for malformed invite URLs
- [x] Add explicit sharing failure status and local persistence recovery handling

- [x] Inspect and repair any remaining development-server or dependency errors
- [x] Add defensive initialization handling for runtime and deep-link setup
- [x] Add visible persistence recovery feedback without blocking offline matches

- [x] Add a visible invite-arrival banner with the accepted crew code
- [x] Add lobby context copy for invite-based arrivals
- [x] Add a compact copy-code action for the active invite

- [x] Add invite-arrival confirmation copy that explains the next lobby step
- [x] Add a compact copy-code action with accessible success and failure feedback
- [x] Add non-blocking recovery copy for invite and sharing failures

- [x] Add a lightweight victory celebration overlay using native Animated APIs
- [x] Respect reduced-motion preferences and clean up animation resources
- [x] Keep the celebration non-blocking and accessible for screen readers

- [x] Inspect and repair any remaining development-server or dependency errors
- [x] Add defensive initialization handling for runtime and deep-link setup
- [x] Add visible persistence recovery feedback without blocking offline matches

- [x] Inspect and repair any remaining build or watcher errors after restoration
- [x] Harden repeated runtime initialization and cleanup paths
- [x] Add visible recovery feedback for malformed or unavailable invite state

- [x] Harden arena timer cleanup across match transitions
- [x] Cancel delayed Power Surge callbacks during unmount and remount
- [x] Revalidate TypeScript, lint, tests, and active preview services

- [x] Remove partially registered preview listeners when runtime initialization fails
- [x] Prevent late storage and accessibility responses from updating unmounted screens
- [x] Revalidate the final hardening pass with TypeScript, lint, tests, and preview logs

- [x] Validate persisted party codes before restoring invite state
- [x] Validate persisted counters and recover safely from malformed statistics
- [x] Revalidate TypeScript, lint, tests, and preview bundling after data hardening

- [x] Catch synchronous and asynchronous storage adapter failures through one recovery wrapper
- [x] Preserve offline gameplay when persistence writes fail
- [x] Revalidate TypeScript, lint, tests, active services, and preview bundling

- [x] Prevent persistence failure callbacks from updating unmounted screens
- [x] Keep storage recovery state scoped to active screen lifecycles
- [x] Revalidate TypeScript, lint, tests, and preview fatal-error signals

- [x] Catch synchronous invite URL-generation and native share failures
- [x] Make haptic capability failures non-blocking across platforms
- [x] Guard tutorial persistence failures without blocking match start
- [x] Revalidate TypeScript, lint, tests, and preview fatal-error signals

- [x] Guard victory animation setup and cleanup against native animation failures
- [x] Harden result persistence against invalid runtime match values
- [x] Revalidate TypeScript, lint, tests, and preview fatal-error signals

- [x] Add a visible invite-arrival banner with the accepted crew code
- [x] Add lobby context copy explaining the Decentraland Friendzone handoff
- [x] Add an accessible compact copy-code action with failure fallback
- [x] Refine wallet-ready reward and social handoff copy for Decentraland integration

- [x] Add Friendzone contacts context to the Crew lounge
- [x] Add Decentraland Plaza location metadata to match results
- [x] Add a wearable airdrop preview to wallet-ready rewards

- [x] Add Decentraland Friendzone Plaza context to the active arena round
- [x] Include Plaza location and party-code context in shared match recaps
- [x] Make nearby Friendzone contact invites activate the local party handoff
- [x] Align submission notes with the expanded Decentraland demo path

- [x] Add Plaza parcel coordinates to match metadata
- [x] Add a wearable preview slot to the player profile surface
- [x] Add a local live-events ticker for plaza tournaments
- [x] Label quick reactions with Decentraland-style emote names

- [x] Add persistent RSVP state for Plaza live events
- [x] Add event RSVP to party handoff behavior
- [x] Add resilient share-ready event context and feedback

- [x] Add persistent Recent Crew entries for local re-invites
- [x] Add one-tap re-invite actions for recent Friendzone contacts
- [x] Add a shareable Decentraland Plaza match card

- [x] Add an accessible event-detail sheet for Plaza live events
- [x] Add stronger onboarding copy for the Decentraland plaza-to-arena flow
- [x] Add a "Share Invite Link" action alongside the party-code copy

- [x] Add a visual Plaza parcel map preview to event details
- [x] Add a wearable equipment toggle to the player profile
- [x] Add a live tournament countdown to the event ticker

- [x] Add event capacity and RSVP waitlist feedback
- [x] Add richer wearable detail context and mint status
- [x] Persist the new event and wearable state safely

- [x] Add RSVP capacity meter to Plaza event cards
- [x] Add waitlist position feedback for full events
- [x] Add richer wearable detail traits and mint status

- [x] Add a live RSVP capacity meter to Plaza event cards
- [x] Show explicit waitlist position for full Decentraland events
- [x] Add a richer wearable detail surface with traits and mint status

- [x] Add a copyable Decentraland Plaza coordinate handoff
- [x] Add a resilient open-in-world action with offline fallback
- [x] Document the Plaza handoff in the submission demo path

- [x] Add mobile-friendly parcel handoff variants
- [x] Add event-specific share copy with reward context
- [x] Add resilient fallback feedback for parcel links

- [x] Add a clear Decentraland bridge status surface
- [x] Label local demo data versus future live integrations
- [x] Add a resilient Plaza map handoff action

- [x] Add transparent Decentraland bridge-health status
- [x] Show explicit readiness states for live services
- [x] Add an actionable retry or offline fallback path

- [x] Add a live-presence reconnect affordance
- [x] Make bridge retry state safe across repeated taps
- [x] Add clearer recovery feedback for unavailable services

- [x] Add a Decentraland wearable asset passport preview
- [x] Add explicit claim-readiness states for wallet and receipt
- [x] Keep NFT metadata and claim fallbacks honest and offline-safe

- [x] Add a Decentraland wearable asset passport preview
- [x] Add explicit claim-readiness states for wallet and receipt
- [x] Keep NFT metadata and claim fallbacks honest and offline-safe

- [x] Add a Decentraland Friendzone Plaza Chronicle narrative card tied to live event context.
- [x] Connect Plaza lore copy to wearable reward and event-to-party handoff states.
- [x] Update submission narrative with the Plaza Chronicle demo step.
- [x] Validate the Chronicle flow and save a final checkpoint.

<!-- Source attachments reviewed: pasted_content_11.txt and pasted_content_12.txt. Monetization systems are intentionally out of scope for this offline hackathon prototype. -->

- [x] Harden arena timer state against stale closure transitions and duplicate result commits.
- [x] Add focused tests for match completion and repeated arena transitions.
- [x] Revalidate the hardening pass and save a checkpoint.

- [x] Remove duplicated wearable asset-passport rendering in Settings.
- [x] Validate the Settings reward surface after the cleanup and save a checkpoint.

- [x] Add a validated local persistence adapter for typed demo state.
- [x] Migrate repeated storage reads and writes in the main screen to the adapter.
- [x] Revalidate persistence recovery behavior and save a checkpoint.

- [x] Add typed hydration helpers with explicit missing, valid, and malformed outcomes.
- [x] Migrate startup persistence reads to the centralized hydration path.
- [x] Validate malformed-state recovery and save a checkpoint.

- [x] Migrate match history, reward receipts, and statistics hydration to typed results.
- [x] Add parser coverage for history, receipts, and stats recovery.
- [x] Revalidate startup hydration and save a checkpoint.

- [x] Make local persistence adapter operations injectable for deterministic tests.
- [x] Add failure-path coverage for storage writes, reads, and cleanup.
- [x] Revalidate the offline recovery contract and save a checkpoint.

- [x] Centralize the complete persisted demo-key reset operation.
- [x] Add deterministic coverage for successful and failed reset cleanup.
- [x] Revalidate reset recovery behavior and save a checkpoint.

- [x] Add explicit reset completion status for repeatable judge demos.
- [x] Surface reset success or failure in Demo Diagnostics.
- [x] Revalidate reset feedback and save a checkpoint.

- [x] Improve one judge-facing demo feedback or accessibility path.
- [x] Add focused validation for the new behavior.
- [x] Revalidate the app and save a checkpoint.

- [x] Add focused accessibility and repeat-tap hardening for the next demo-critical interaction.
- [x] Add deterministic tests for the new guard behavior.
- [x] Revalidate the improvement batch and save a checkpoint.

- [x] Improve judge-facing diagnostics with clearer recovery context.
- [x] Add focused validation for the diagnostics state behavior.
- [x] Revalidate the app and save a checkpoint.

- [x] Add focused active-match interaction hardening for rapid taps or terminal states.
- [x] Add deterministic tests for the new match guard behavior.
- [x] Revalidate the match flow and save a checkpoint.

- [x] Improve Arena state transition clarity with a small testable state helper.
- [x] Add deterministic tests for the Arena transition behavior.
- [x] Revalidate the Arena flow and save a checkpoint.

- [x] Harden one async demo-critical handler against stale lifecycle updates.
- [x] Add deterministic coverage for the new async guard behavior.
- [x] Revalidate the async flow and save a checkpoint.

- [x] Prevent duplicate native share-sheet launches from social invite actions.
- [x] Add deterministic coverage for share-in-progress gating.
- [x] Revalidate social sharing and save a checkpoint.

- [x] Prevent duplicate Plaza event share-sheet launches.
- [x] Add deterministic coverage for event-share gating.
- [x] Revalidate the event-sharing flow and save a checkpoint.

- [x] Harden Plaza link-opening and coordinate-sharing actions against duplicate async operations.
- [x] Add deterministic coverage for Plaza handoff gating.
- [x] Revalidate Plaza handoffs and save a checkpoint.

- [x] Show explicit progress labels for Plaza copy and open actions.
- [x] Preserve accessible status feedback during handoff operations.
- [x] Revalidate the handoff feedback flow and save a checkpoint.

- [x] Add explicit progress feedback to live-presence reconnect.
- [x] Preserve lifecycle-safe bridge recovery announcements.
- [x] Revalidate the reconnect flow and save a checkpoint.

- [x] Add deterministic end-to-end coverage for reconnect, fallback, and Diagnostics navigation.
- [x] Add visible reconnect loading feedback without blocking the offline demo.
- [x] Add a latest bridge-health timestamp and validate the complete flow.

- [x] Persist the latest bridge-health timestamp across launches.
- [x] Hydrate and validate the timestamp without blocking offline gameplay.
- [x] Add deterministic timestamp persistence coverage and save a checkpoint.

- [x] Add a clear bridge-health status label and color treatment.
- [x] Add relative-time diagnostics for the latest bridge check.
- [x] Add deterministic formatting coverage and save a checkpoint.

- [x] Add an accessible reconnect result toast for fallback completion.
- [x] Keep toast visibility lifecycle-safe and non-blocking.
- [x] Add deterministic toast-state coverage and save a checkpoint.

- [x] Add a compact bridge recovery summary for judges.
- [x] Keep the summary aligned with offline mirror and last-check state.
- [x] Add deterministic summary coverage and save a checkpoint.

- [ ] Add a compact bridge-health icon and accessible state label.
- [ ] Keep the icon aligned with checking, fallback, and ready states.
- [ ] Add deterministic state-presentation coverage and save a checkpoint.

- [x] Persist the latest bridge recovery reason with the health timestamp.
- [x] Hydrate and display the reason without blocking offline gameplay.
- [ ] Add deterministic recovery-reason coverage and save a checkpoint.

- [x] Harden bridge recovery reason hydration so malformed reason data cannot imply a healthy bridge.
- [x] Add deterministic coverage for malformed, missing, and valid recovery reason persistence.
- [ ] Revalidate the bridge diagnostics pass and save a checkpoint.

- [x] Add a one-tap Open Diagnostics action to reset failure feedback.
- [x] Make reset feedback accessible and preserve the retry path.
- [ ] Add deterministic validation for reset recovery feedback and save a checkpoint.

- [x] Track the latest persistence failure category across read, write, and reset cleanup paths.
- [x] Surface the category in Demo Diagnostics without blocking offline gameplay.
- [ ] Add deterministic category formatting coverage and save a checkpoint.

- [x] Define a pure RSVP-to-reconnect-to-Diagnostics transition contract.
- [x] Wire the contract into the existing social bridge actions without changing offline behavior.
- [x] Add end-to-end transition coverage and save a checkpoint.

- [x] Add a compact RSVP-to-reconnect handoff step indicator to the Crew lounge.
- [x] Make the active step clear to screen readers and keep offline status explicit.
- [x] Add deterministic state-label coverage and save a checkpoint.

- [x] Add a versioned local persistence metadata key and current schema constant.
- [x] Hydrate and initialize the schema version without deleting existing demo data.
- [x] Add migration-safe schema tests and save a checkpoint.

- [x] Add an explicit migration registry for local storage schema versions.
- [x] Resolve current, legacy, and unsupported versions without deleting demo data.
- [x] Add deterministic migration compatibility tests and save a checkpoint.

- [x] Track whether startup upgraded legacy storage metadata.
- [x] Surface a concise migration note in Demo Diagnostics.
- [x] Add deterministic migration-event coverage and save a checkpoint.

- [x] Build a sanitized local demo-report formatter with no wallet or account identifiers.
- [x] Add a Diagnostics share action with duplicate-share protection and fallback feedback.
- [x] Add deterministic report-content coverage and save a checkpoint.

- [x] Add an export-generated timestamp to sanitized Diagnostics reports.
- [x] Keep timestamp formatting deterministic and timezone-safe for tests.
- [x] Validate the export update and save a checkpoint.

- [x] Add a collapsible preview for the sanitized Diagnostics report.
- [x] Keep preview content redacted and sharing lifecycle-safe.
- [x] Add deterministic preview-state coverage and save a checkpoint.

- [x] Add a guarded copy-to-clipboard action for the sanitized report.
- [x] Show accessible success or fallback feedback after copying.
- [x] Add deterministic copy-feedback coverage and save a checkpoint.

- [x] Add a compact guided walkthrough for RSVP, reconnect, gameplay, and rewards.
- [x] Keep walkthrough steps aligned with the existing Friendzone demo flow and accessible.
- [x] Add deterministic walkthrough-label coverage and save a checkpoint.

- [x] Map each judge walkthrough step to its relevant demo surface.
- [x] Add accessible step actions without changing gameplay state rules.
- [x] Add deterministic walkthrough-action coverage and save a checkpoint.

- [x] Derive the current judge walkthrough step from Friendzone demo state.
- [x] Highlight the current step with accessible status text.
- [x] Add deterministic current-step coverage and save a checkpoint.

- [x] Add a local reset-to-step-one action for the judge walkthrough.
- [x] Provide accessible confirmation without clearing gameplay or persisted demo state.
- [x] Add deterministic reset coverage and save a checkpoint.

- [x] Add explicit completion copy when the walkthrough reaches reward/results.
- [x] Make completion state accessible and visually distinct.
- [x] Add deterministic completion-label coverage and save a checkpoint.

- [x] Derive completed walkthrough stages from the active screen and flow state.
- [x] Show accessible checkmarks for completed stages in the judge walkthrough.
- [x] Add deterministic completion-progress coverage and save a checkpoint.

- [x] Add a shared completed-of-four progress summary for the judge walkthrough.
- [x] Surface the summary with accessible live status text.
- [x] Add deterministic progress-summary coverage and save a checkpoint.

- [x] Add automatic progression feedback after successful RSVP and reconnect actions.
- [x] Preserve manual navigation and keep progress announcements accessible.
- [x] Add deterministic progression-status coverage and save a checkpoint.

- [x] Add an optional auto-advance toggle for the judge walkthrough.
- [x] Guard delayed step transitions against unmounts and manual navigation.
- [x] Add deterministic toggle and progression coverage and save a checkpoint.

- [x] Add a bounded auto-advance delay control for judge walkthrough demos.
- [x] Keep delay changes lifecycle-safe and accessible.
- [x] Add deterministic delay-formatting coverage and save a checkpoint.

- [x] Add Quick, Standard, and Presenter pacing presets for judge walkthrough auto-advance.
- [x] Keep preset changes bounded, accessible, and lifecycle-safe.
- [x] Add deterministic pacing-label coverage and save a checkpoint.

- [ ] Add a dedicated persisted key for the judge pacing preset.
- [ ] Hydrate only valid Quick, Standard, or Presenter values and preserve the safe default otherwise.
- [ ] Add deterministic persistence coverage and save a checkpoint.

- [x] Persist the selected judge walkthrough pacing preset under a dedicated storage key.
- [x] Hydrate only valid pacing presets and fall back to Standard for malformed values.
- [x] Add deterministic persistence coverage and save a checkpoint.

- [x] Persist the judge walkthrough auto-advance preference under a dedicated storage key.
- [x] Hydrate only valid boolean values and preserve the safe default for malformed or unavailable data.
- [x] Add deterministic reset-contract and hydration coverage, validate, and save a checkpoint.

- [x] Add a one-tap Presenter Mode control to the judge walkthrough.
- [x] Persist Presenter Mode's auto-advance and pacing selections using existing guarded writes.
- [x] Add deterministic coverage, validate, and save a checkpoint.

- [x] Add a non-destructive reset for Presenter settings.
- [x] Restore manual defaults and persist them without clearing gameplay or demo data.
- [x] Add deterministic reset coverage, validate, and save a checkpoint.

- [x] Surface restored Presenter settings in Demo Diagnostics.
- [x] Show whether the current settings are local demo defaults or persisted preferences.
- [x] Add deterministic formatter coverage, validate, and save a checkpoint.

- [x] Add a copyable Presenter settings summary to Demo Diagnostics.
- [x] Provide accessible copied and fallback feedback without exposing private identifiers.
- [x] Add deterministic formatter coverage, validate, and save a checkpoint.

- [x] Add deterministic coverage for Presenter settings copy outcomes.
- [x] Cover duplicate-action protection and clipboard fallback behavior.
- [x] Validate and save a checkpoint.

- [x] Add a compact transient toast for Presenter settings copy feedback.
- [x] Keep toast timeout cleanup lifecycle-safe and preserve clipboard fallback feedback.
- [x] Add deterministic timeout coverage, validate, and save a checkpoint.

- [x] Add a redacted share-sheet fallback for Presenter settings when clipboard access is unavailable.
- [x] Preserve duplicate-action, lifecycle, and privacy safeguards with accessible feedback.
- [x] Add deterministic fallback coverage, validate, and save a checkpoint.

- [x] Add a one-tap Run Full Walkthrough action for judges.
- [x] Sequence existing RSVP, reconnect, gameplay, and reward actions with lifecycle-safe timing.
- [x] Add deterministic sequence coverage, validate, and save a checkpoint.

- [x] Add a visible four-stage judge walkthrough progress indicator.
- [x] Keep progress updates accessible and synchronized with manual and automated stages.
- [x] Add deterministic progress formatting coverage, validate, and save a checkpoint.

- [x] Add Pause/Resume control for the automated judge walkthrough.
- [x] Preserve the current stage and keep timer cleanup lifecycle-safe while paused.
- [x] Add deterministic pause/resume coverage, validate, and save a checkpoint.

- [x] Add a distinct Cancel Walkthrough action beside Pause/Resume.
- [x] Stop pending timers, restore idle state, and announce cancellation without clearing gameplay data.
- [x] Add deterministic cancellation coverage, validate, and save a checkpoint.

- [x] Add a transient cancellation toast to the judge walkthrough.
- [x] Reuse lifecycle-safe toast cleanup and preserve the existing accessibility status.
- [x] Add deterministic cancellation-toast coverage, validate, and save a checkpoint.

- [x] Add a compact restart action to cancellation feedback.
- [x] Restart from a clean idle state without duplicating timers or clearing demo data.
- [x] Add deterministic restart coverage, validate, and save a checkpoint.

- [x] Add a pure lifecycle contract for cancel, restart, and completion.
- [x] Use the contract to keep automated walkthrough transitions deterministic and guarded.
- [x] Add lifecycle coverage, validate, and save a checkpoint.

- [x] Inspect current development-server and runtime failure signals.
- [x] Add focused error handling that preserves offline gameplay and judge flows.
- [x] Add regression coverage, validate services, and save a checkpoint.

- [x] Remove the remaining ESLint module-type warning without changing app runtime behavior.
- [x] Revalidate TypeScript, lint, tests, and preview health after the configuration cleanup.
- [x] Save a reviewable checkpoint for the warning-free build tooling state.

- [x] Add a shared privacy-safe error-status formatter for native handoff actions.
- [x] Migrate recap, invite, coordinate, and diagnostics failures to consistent fallback copy.
- [x] Add formatter regression coverage, validate, and save a checkpoint.

- [x] Inspect fresh runtime, preview, and unguarded async failure signals.
- [x] Add targeted recovery that preserves offline gameplay and judge flows.
- [x] Add regression coverage, validate services, and save a checkpoint.

- [x] Inspect fresh diagnostics, logs, and remaining unguarded async paths.
- [x] Add targeted recovery guards that preserve offline gameplay and judge flows.
- [x] Add regression coverage, validate services, and save a checkpoint.

- [x] Add a visible restarting state or animation when the judge walkthrough is relaunched.
- [x] Keep restart feedback lifecycle-safe and prevent duplicate walkthrough launches.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a clear completion toast when all judge walkthrough stages finish.
- [x] Make completion feedback accessible and safe across repeated walkthrough runs.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a Run Again action to the completed judge walkthrough toast.
- [x] Keep repeat runs lifecycle-safe and preserve demo data between runs.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Respect reduced-motion settings in the judge walkthrough restarting indicator.
- [x] Keep static feedback accessible while preserving animated feedback for other players.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Strengthen accessibility semantics for judge walkthrough toast feedback.
- [x] Expose busy state during restart feedback without changing the offline flow.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Strengthen accessibility semantics for live bridge reconnect feedback.
- [x] Expose the reconnecting busy state and fallback status without changing offline behavior.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a compact live bridge summary to the judge walkthrough card.
- [x] Make the summary accessible and clearly distinguish live status from offline readiness.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a compact wallet-ready reward summary to the judge walkthrough card.
- [x] Clearly distinguish connection state from local receipt readiness without implying an on-chain claim.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a one-tap demo-wallet connect affordance beside the judge walkthrough wallet summary.
- [x] Keep wallet connection local, repeat-tap safe, and non-blocking for offline gameplay.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add explicit accessible feedback when the local demo wallet connects or disconnects.
- [x] Keep wallet status messaging honest, repeat-tap safe, and non-blocking for offline play.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a compact receipt-detail preview to the final judge walkthrough stage.
- [x] Keep receipt metadata local, honest, and accessible without implying an on-chain mint.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a subtle live-status pulse to make shared screens feel more dynamic.
- [x] Respect reduced-motion preferences and stop animation loops during unmount or inactive screens.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Improve first-match onboarding with a clear three-step progress cue.
- [x] Add accessible next-step copy and keep tutorial persistence failure non-blocking.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Expand the first-match tutorial into three actionable onboarding steps.
- [x] Add next, skip, and finish controls with accessible progress announcements.
- [x] Preserve tutorial persistence and offline gameplay when onboarding is skipped or completed.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a Replay Tutorial action to Settings for returning players.
- [x] Reset the tutorial step cursor and keep replay behavior local and non-blocking.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a subtle onboarding card entrance animation when the tutorial opens or replays.
- [x] Respect reduced-motion settings and clean up animation resources on close or unmount.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a subtle transition when moving between onboarding steps.
- [x] Keep step transitions reduced-motion-aware and safe during rapid taps or dismissal.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Guard onboarding Next Tip against rapid taps while the step transition animates.
- [x] Keep Skip and Start Match responsive and preserve reduced-motion behavior.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a brief visible completion toast when the first-match onboarding finishes.
- [x] Keep completion feedback accessible, transient, and safe across replay or dismissal.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a one-tap Replay Tutorial action to the onboarding completion toast.
- [x] Keep replay feedback lifecycle-safe and preserve saved demo progress.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a subtle entrance animation to onboarding completion feedback.
- [x] Respect reduced-motion settings and clean up toast animation resources safely.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Guard the wallet-ready receipt save action against duplicate taps.
- [x] Expose clear busy and saved states accessibly without implying an on-chain mint.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a brief saved-receipt confirmation animation on the match results surface.
- [x] Respect reduced-motion settings and keep the reward claim boundary honest and non-blocking.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a single accessible summary label to the wallet-ready reward card.
- [x] Keep local receipt, wallet, and future minting states distinguishable for assistive technology.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a compact local receipt-details toggle to the match-results reward surface.
- [x] Show honest traits and mint-boundary copy without implying an on-chain transaction.
- [x] Add accessible controls, validate the app, and save a checkpoint.

- [x] Add a subtle transition when receipt details expand or collapse.
- [x] Respect reduced-motion settings and reset animation safely when leaving results.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add explicit accessible labels and selected states to the primary tab navigation.
- [x] Keep tab navigation semantics consistent across Home, Crew, Ranks, and Settings.
- [x] Revalidate the app and save a checkpoint.

- [x] Repair full judge walkthrough resume detection after pausing.
- [x] Preserve the current walkthrough stage and scheduled-action position across resume.
- [x] Revalidate walkthrough lifecycle behavior and save a checkpoint.

- [x] Add a pure judge walkthrough resume predicate for deterministic lifecycle coverage.
- [x] Add regression assertions for paused versus active walkthrough states.
- [x] Revalidate the regression coverage and save a checkpoint.

- [x] Add table-driven coverage for full judge walkthrough cancel, restart, and completion transitions.
- [x] Verify lifecycle outputs preserve deterministic stage and action-reset semantics.
- [x] Revalidate the lifecycle suite and save a checkpoint.

- [x] Document that the pointerEvents warning originates in Expo Router or React Native Web dependencies, not app-owned code.
- [x] Add direct regression coverage for the complete pause-to-resume lifecycle sequence.
- [x] Revalidate the codebase and save a checkpoint.

- [x] Make the primary judge walkthrough action reflect Resume when the walkthrough is paused.
- [x] Keep button labels, accessibility labels, and hints aligned across running, paused, and idle states.
- [x] Revalidate the judge walkthrough surface and save a checkpoint.

- [x] Add a single accessible walkthrough progress label that includes completion count and current step.
- [x] Use the progress label consistently in the judge walkthrough surface.
- [x] Add deterministic coverage, revalidate, and save a checkpoint.

- [x] Add a shared presenter timing-status formatter for judge walkthrough pacing.
- [x] Use the timing status consistently in visible and accessible judge controls.
- [x] Add deterministic coverage, revalidate, and save a checkpoint.

- [x] Add regression assertions for manual and presenter timing-status strings.
- [x] Confirm timing feedback remains deterministic across pacing presets.
- [x] Revalidate the presenter timing pass and save a checkpoint.

- [x] Cancel active judge walkthrough timers when Demo Reset is triggered.
- [x] Reset transient arena, reward, and result-commit refs for a clean repeatable demo.
- [x] Add regression coverage, revalidate, and save a checkpoint.

- [x] Centralize the transient Demo Reset baseline in a pure helper.
- [x] Use the baseline helper in reset logic and cover every transient field deterministically.
- [x] Revalidate reset behavior and save a checkpoint.

- [x] Reset walkthrough stage and open-state context when Demo Reset returns to Home.
- [x] Clear stale Friendzone event-flow context from the next judge run.
- [x] Add regression coverage, revalidate, and save a checkpoint.

- [x] Clear stale judge walkthrough feedback and restart toast during Demo Reset.
- [x] Restore a neutral walkthrough-ready status after reset success or recovery.
- [x] Add regression coverage, revalidate, and save a checkpoint.

- [x] Guard Demo Reset persistence callbacks against an unmounted screen.
- [x] Preserve reset outcome messaging only when the screen lifecycle is active.
- [x] Revalidate reset recovery behavior and save a checkpoint.

- [x] Add a ref-based in-flight guard for repeated Demo Reset taps.
- [x] Keep reset controls disabled while cleanup is pending without relying only on rendered status.
- [x] Add deterministic guard coverage, revalidate, and save a checkpoint.

- [x] Add a named regression test for duplicate Demo Reset attempts.
- [x] Verify the shared async guard rejects a second cleanup while the first is active.
- [x] Revalidate the guard coverage and save a checkpoint.

- [x] Expose the Demo Reset button’s disabled state to assistive technology.
- [x] Keep its accessible hint aligned with idle and cleanup-in-progress states.
- [x] Add deterministic coverage, revalidate, and save a checkpoint.

- [x] Centralize Demo Reset accessibility metadata for idle and cleanup states.
- [x] Use the tested metadata contract in the Settings control.
- [x] Revalidate accessibility coverage and save a checkpoint.

- [x] Remove duplicated persistence and Friendzone-flow rows from Demo Diagnostics.
- [x] Preserve one authoritative row for each recovery signal.
- [x] Revalidate the Diagnostics surface and save a checkpoint.

- [x] Expose Demo Reset outcome as a dedicated accessible status in Diagnostics.
- [x] Keep reset status announcements concise and aligned with the visible recovery state.
- [x] Revalidate Diagnostics accessibility and save a checkpoint.

- [x] Expose Demo Diagnostics disclosure expanded state to assistive technology.
- [x] Keep the disclosure label and hint aligned with open and closed states.
- [x] Revalidate Diagnostics accessibility and save a checkpoint.

- [x] Expose the wallet-ready Settings control as an explicit accessible button.
- [x] Add a contextual hint and state metadata for connected versus disconnected wallet demo states.
- [x] Revalidate wallet-control accessibility and save a checkpoint.

- [x] Expose the Quick Party join/leave control as an explicit accessible button.
- [x] Add selected-state metadata for the active party state.
- [x] Revalidate the party-control accessibility and save a checkpoint.

- [x] Expose the judge walkthrough disclosure expanded state to assistive technology.
- [x] Keep its label and hint aligned with open and closed walkthrough states.
- [x] Revalidate the judge walkthrough control and save a checkpoint.

- [x] Expose the sanitized Diagnostics report action’s busy and disabled states.
- [x] Keep its accessible label aligned with sharing progress and idle state.
- [x] Revalidate the report action and save a checkpoint.

- [x] Expose sanitized report preview expanded state to assistive technology.
- [x] Keep preview label and hint aligned with open and closed states.
- [x] Revalidate the report-preview control and save a checkpoint.

- [x] Expose wearable-details disclosure expanded state to assistive technology.
- [x] Keep wearable-details label and hint aligned with open and closed states.
- [x] Revalidate the wearable-details control and save a checkpoint.

- [x] Add a contextual accessibility hint to the Friendzone Plaza Band equip switch.
- [x] Explain the equipped and preview-only states without implying an on-chain claim.
- [x] Revalidate the wearable control and save a checkpoint.

- [x] Expose each Quick Reaction control as an explicit accessible button.
- [x] Add selected-state metadata for the active reaction.
- [x] Revalidate the social controls and save a checkpoint.

- [x] Expose busy and disabled state on party-invite share controls.
- [x] Keep invite-share labels aligned with native handoff progress.
- [x] Revalidate the invite controls and save a checkpoint.

- [x] Align party-code copy with the shared native-handoff state machine.
- [x] Expose copying progress and restore idle state on success, failure, or unmount.
- [x] Add deterministic regression coverage and save a checkpoint.

- [x] Add a distinct visible reset-complete confirmation to Demo Diagnostics.
- [x] Keep the confirmation accessible and limited to successful local cleanup.
- [x] Revalidate reset feedback and save a checkpoint.

- [x] Expose copying busy and disabled metadata on the party-code copy control.
- [x] Align its label and hint with the shared handoff progress state.
- [x] Confirm the pointer-events warning is upstream React Native Web behavior and revalidate.

- [x] Add direct deterministic coverage for party-code copy busy gating.
- [x] Cover mounted and unmounted copy-result handling.
- [x] Revalidate the async guards and save a checkpoint.

- [x] Expose busy and disabled state on Plaza coordinate, event-share, and world-open handoffs.
- [x] Align handoff labels and hints with copying, sharing, and opening progress.
- [x] Revalidate existing handoff guard coverage and save a checkpoint.

- [x] Expand the judge-facing checklist into a repeatable 60-second presenter sequence.
- [x] Add reset, fallback, wallet-ready boundary, and recovery callouts.
- [x] Revalidate documentation consistency and save a checkpoint.

- [x] Add a pure accessibility-state formatter for Plaza handoff actions.
- [x] Use the formatter in the Plaza modal and cover idle, copying, sharing, and opening states.
- [x] Revalidate the contract and save a checkpoint.

- [x] Add deterministic UI-contract coverage for Plaza handoff control props.
- [x] Verify each target exposes the expected label, hint, busy, and disabled state.
- [x] Revalidate the UI contract and save a checkpoint.

- [x] Add a pure guard for delayed judge walkthrough callbacks.
- [x] Reject stale, paused, unmounted, and already-consumed callback updates.
- [x] Wire the guard into scheduling, add regression coverage, and checkpoint.

- [x] Add a submission-assets verification checklist to the hackathon notes.
- [x] Verify icon, splash, favicon, adaptive assets, app branding, and required validation commands.
- [x] Revalidate the checklist against the repository and save a checkpoint.

- [x] Document the final pointer-events warning audit.
- [x] Confirm no app-owned deprecated pointer-events props remain.
- [x] Revalidate the unchanged app surface and save a checkpoint.

- [x] Add a semantic status icon to judge Diagnostics toast feedback.
- [x] Distinguish restart, completion, and cancellation states visually without changing behavior.
- [x] Revalidate the judge surface and save a checkpoint.

- [x] Expose busy state on the Demo Reset control while cleanup is active.
- [x] Keep its label, hint, disabled state, and visible progress text synchronized.
- [x] Revalidate reset accessibility behavior and save a checkpoint.

- [x] Release the Demo Reset in-flight guard when async cleanup resolves after unmount.
- [x] Keep reset lifecycle cleanup consistent across success, failure, and unmount paths.
- [x] Add deterministic coverage and save a checkpoint.

- [x] Add a pure party-code recovery contract for malformed persisted invites.
- [x] Restore a valid local fallback and persist it only when storage is readable.
- [x] Add deterministic coverage and save a checkpoint.

- [x] Harden malformed persisted recovery beyond party invites.
- [x] Surface a safe fallback for invalid bridge timestamps without committing bad state.
- [x] Add deterministic coverage and save a checkpoint.

- [x] Add a pure recovery contract for persisted bridge-recovery reasons.
- [x] Keep invalid reasons unset while preserving diagnostic read warnings.
- [x] Add deterministic coverage and save a checkpoint.

- [x] Add a pure recovery contract for persisted RSVP and waitlist state.
- [x] Route invalid event values to safe defaults without committing malformed state.
- [x] Add deterministic coverage and save a checkpoint.

- [x] Add a pure recovery contract for persisted recent-crew entries.
- [x] Normalize valid entries, cap the list, and keep malformed storage out of active UI state.
- [x] Add deterministic coverage and save a checkpoint.

- [x] Add a shared recovery contract for persisted boolean preferences.
- [x] Apply safe defaults to wearable and waitlist hydration while preserving warnings.
- [x] Add deterministic coverage and save a checkpoint.

- [x] Gate preference write-back until initial hydration settles.
- [x] Prevent startup defaults from overwriting persisted waitlist, wearable, crew, RSVP, and history state.
- [x] Add deterministic coverage and save a checkpoint.

- [x] Extract the startup persistence write-back gate into a pure helper.
- [x] Cover first-write suppression and subsequent-write allowance deterministically.
- [x] Revalidate persistence behavior and save a checkpoint.

- [x] Add lifecycle-oriented persistence-gate regression cases.
- [x] Verify hydration suppression, user-change persistence, and per-key isolation.
- [x] Revalidate the gate suite and save a checkpoint.

- [x] Reject blank persistence-gate keys without mutating gate state.
- [x] Preserve normal first-write and subsequent-write semantics for valid keys.
- [x] Add deterministic coverage and save a checkpoint.

- [x] Introduce a typed allow-list for persistence keys.
- [x] Apply the key type to local read and write helpers without weakening test drivers.
- [x] Add deterministic coverage and save a checkpoint.
- [x] Apply the typed LocalStorageKey allow-list to readHydratedValue and add regression coverage.
- [x] Run the full validation suite and save a checkpoint.
- [x] Apply LocalStorageKey typing to removeLocalValues and preserve cleanup failure coverage.
- [x] Revalidate the full app and save a checkpoint.
- [x] Add compile-time regression coverage proving unknown persistence keys are rejected by read, write, hydrate, and cleanup APIs.
- [x] Revalidate the full app and save a checkpoint.
- [x] Add a unified validate script that runs tests, TypeScript, and lint in sequence.
- [x] Document the single validation command in HACKATHON_SUBMISSION.md and revalidate the app.
- [x] Add a lightweight GitHub Actions workflow that installs with the frozen pnpm lockfile and runs pnpm validate.
- [x] Document the CI gate and revalidate the repository locally.
- [x] Enable noUncheckedIndexedAccess in TypeScript and resolve the resulting unsafe indexed-access findings.
- [x] Add or preserve regression coverage, run pnpm validate, and save a checkpoint.
- [x] Expose pure LLM normalization helpers for deterministic edge-case tests.
- [x] Add regression coverage for text-part normalization and required tool selection.
- [x] Revalidate the full app and save a checkpoint.
- [x] Extract the OAuth fallback query parser into a pure helper.
- [x] Add regression coverage for valid, incomplete, and malformed callback parameters.
- [x] Revalidate the full app and save a checkpoint.
- [x] Extract a pure OAuth callback outcome decision helper.
- [x] Add regression coverage for error, direct-session, exchange, and missing-parameter outcomes.
- [x] Revalidate the full app and save a checkpoint.
- [x] Extract a pure error-boundary recovery state transition contract.
- [x] Add deterministic tests for error capture and reset transitions.
- [x] Revalidate the full app and save a checkpoint.
- [x] Add component-level assertions for the AppErrorBoundary recovery copy and accessibility action.
- [x] Verify the reset handler restores children and revalidate the full app.
- [x] Save a checkpoint for the recovery-screen coverage.
- [x] Add a safe OAuth error-parameter reader for malformed callback URLs.
- [x] Add regression coverage for valid, relative, and invalid URL error parameters.
- [x] Revalidate the full app and save a checkpoint.
- [x] Add a typed event-selection resolver that rejects stale or unknown event titles.
- [x] Guard event modal RSVP and sharing actions against missing selections.
- [x] Revalidate the full app and save a checkpoint.
- [x] Apply FriendzoneEventTitle union typing to RSVP and selected-event state.
- [x] Preserve safe hydration and reset conversions with regression coverage.
- [x] Revalidate the full app and save a checkpoint.
- [x] Add a pure RSVP transition contract that distinguishes join, cancel, and waitlist states.
- [x] Keep party-ready UI synchronized on event cancellation with deterministic tests.
- [x] Revalidate the full app and save a checkpoint.
- [x] Require exact next-action ordering for automated walkthrough callbacks.
- [x] Add regression coverage for duplicate and out-of-order callback rejection.
- [x] Revalidate the full app and save a checkpoint.
- [x] Harden the resume guard against inconsistent paused-and-running state.
- [x] Add deterministic regression coverage for lifecycle guard combinations.
- [x] Revalidate the full app and save a checkpoint.
- [x] Extend FriendzoneEventTitle typing to sanitized diagnostics report inputs.
- [x] Preserve report formatting and add compile-time regression coverage.
- [x] Revalidate the full app and save a checkpoint.
- [x] Add a pure Diagnostics report input normalizer for nullable and malformed runtime values.
- [x] Preserve privacy-safe formatting with deterministic regression coverage.
- [x] Revalidate the full app and save a checkpoint.
- [x] Align formatSanitizedDemoReport input typing with its partial-input normalizer.
- [x] Add regression coverage for minimal and null report inputs.
- [x] Revalidate the full app and save a checkpoint.
- [x] Sanitize control characters in Diagnostics report text fields.
- [x] Add deterministic coverage for control-character and whitespace normalization.
- [x] Revalidate the full app and save a checkpoint.
- [x] Treat undefined parser results as malformed hydration values.
- [x] Add deterministic coverage for null and undefined parser outcomes.
- [x] Revalidate the full app and save a checkpoint.
- [x] Widen hydration parser return typing to include undefined recovery results.
- [x] Remove the test-only cast and preserve malformed-value coverage.
- [x] Revalidate the full app and save a checkpoint.
- [x] Reuse the shared Friendzone event-title resolver during RSVP hydration.
- [x] Add regression coverage for persisted RSVP normalization through the shared parser.
- [x] Revalidate the full app and save a checkpoint.
- [x] Restore the preview service and inspect event-modal RSVP/share action guards.
- [x] Add deterministic coverage for event-modal action feedback and stale selections.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure event-modal action resolver for RSVP and share eligibility.
- [ ] Cover stale selections, unsupported values, and in-flight share blocking deterministically.
- [x] Add a pure share-in-flight transition contract for repeat-tap blocking and completion reset.
- [x] Add deterministic coverage for share start, duplicate start rejection, and reset behavior.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a safe event-modal selection normalizer for nullable or unsupported runtime values.
- [x] Cover stale modal selection recovery without invoking RSVP or share actions.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure stale event-modal selection recovery contract.
- [x] Cover recovery to a closed modal without dispatching RSVP or share actions.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure judge walkthrough reset-state contract for paused, running, and completed states.
- [x] Cover reset idempotence and stale timer callback rejection deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure walkthrough callback-generation contract for reset and restart invalidation.
- [x] Cover stale callbacks from prior walkthrough generations deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure active walkthrough reset transition contract.
- [x] Cover active reset, paused reset, and repeated idle reset deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure active-reset outcome contract for running walkthroughs.
- [x] Cover active reset as a terminal transition that invalidates pending callbacks.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add direct coverage for active reset invalidating a pending walkthrough callback.
- [x] Cover reset outcome and callback-generation behavior together deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure judge walkthrough terminal-state contract for completed reward receipts.
- [x] Cover completion idempotence and late callback rejection deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure walkthrough action eligibility contract for manual step controls.
- [x] Cover blocked out-of-order and allowed current-step actions deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add direct coverage for manual step taps while walkthrough automation is running.
- [x] Verify paused and contradictory automation states remain blocked deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure Friendzone handoff action eligibility contract for busy and unavailable states.
- [x] Cover duplicate handoff attempts and offline fallback eligibility deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add direct coverage for duplicate Plaza handoff attempts during an active operation.
- [x] Verify copy, share, and open actions all reject repeat starts consistently.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure judge action feedback contract for blocked manual and handoff actions.
- [x] Cover stable user-facing feedback for running, paused, and busy states deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure blocked-action announcement contract for screen-reader and judge feedback parity.
- [x] Cover running, paused, and busy handoff announcements deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure judge flow completion announcement contract for reward handoff readiness.
- [x] Cover completion, already-completed, and interrupted-flow feedback deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure reward-handoff recovery contract for interrupted versus completed states.
- [x] Cover reset, resume, and late completion feedback deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Integrate reward-handoff recovery decisions into the judge walkthrough controls.
- [x] Cover interrupted reset, paused resume, and completed no-op behavior deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure judge walkthrough callback outcome contract for mounted, stale, and completed states.
- [x] Cover late callbacks after reward completion without changing the receipt state deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure async action feedback outcome contract for success, fallback, and unmounted completion.
- [x] Cover native handoff success, fallback, and unmounted completion deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure native handoff outcome contract for shared, dismissed, and fallback states.
- [x] Cover dismissed share sheets and unavailable native handoff feedback deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.
- [x] Add a pure native handoff feedback contract for shared, dismissed, and fallback outcomes.
- [x] Cover consistent visible and announcement copy for dismissed share sheets and fallback paths.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge-settings delivery feedback contract for copied, shared, fallback, and ignored outcomes.
- [x] Cover visible status and announcement parity for judge-settings delivery outcomes deterministically.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.

- [x] Wire centralized judge-settings delivery feedback into copy and share handlers.
- [x] Verify copied, shared, fallback, and ignored outcomes keep visible and announcement copy aligned in the live screen.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge walkthrough demo-readiness summary contract for current stage, progress, and next action.
- [x] Cover idle, active, paused, completed, and reset states deterministically for judge-facing summary copy.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.

- [x] Wire the judge walkthrough demo summary into the live judge panel.
- [x] Keep visible status, progress, and next-action copy synchronized during walkthrough transitions.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge current-step navigation contract for the active walkthrough step.
- [x] Wire a tappable next-action control into the judge walkthrough panel with safe guards for running and completed states.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge current-step navigation feedback contract for allowed, running, paused, and completed states.
- [x] Wire explanatory helper text and accessibility hints into the live OPEN NEXT ACTION control.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure live walkthrough status announcement contract for running, paused, ready, and completed states.
- [x] Wire the centralized announcement into the judge panel status and accessibility surfaces.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge walkthrough primary-control feedback contract for idle, running, paused, and completed states.
- [x] Wire centralized label, hint, disabled, and busy semantics into the live walkthrough control.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge walkthrough lifecycle badge contract for ready, running, paused, and complete states.
- [x] Wire a compact visible and accessible status badge into the live walkthrough panel.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge walkthrough lifecycle badge presentation contract with state-specific tone and icon semantics.
- [x] Wire the lifecycle badge tone and icon into the live judge panel without adding motion or dependency overhead.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge walkthrough lifecycle badge accessibility-state contract for selected and live status semantics.
- [x] Wire the badge accessibility state into the live judge panel without changing the visual layout.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge walkthrough primary-control icon contract for ready, running, paused, and completed states.
- [x] Wire dynamic control icons into the live walkthrough button for clearer action semantics.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure combined judge walkthrough primary-control presentation contract.
- [x] Wire the live control from one presentation object so label, hint, icon, busy, and disabled semantics cannot drift.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a live-region presentation contract for judge walkthrough lifecycle updates.
- [x] Wire the lifecycle badge as a polite live region while preventing duplicate status announcements.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge walkthrough reset-control presentation contract with explicit label and recovery hint.
- [x] Wire the reset-control presentation into the live judge panel for consistent accessible feedback.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge walkthrough reset-feedback live-region contract.
- [x] Wire reset status announcements to one polite accessibility surface without changing the reset flow.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge walkthrough panel accessibility contract for expanded and collapsed states.
- [x] Wire the panel contract into the live judge guide container without changing the visual layout.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge walkthrough panel live-region contract for expanded-state changes.
- [x] Wire open and close transitions to a polite, non-duplicative accessibility announcement.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge walkthrough proof-summary contract for bridge, wallet, and receipt readiness.
- [x] Wire the shared proof summary into the live judge guide accessibility surfaces.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a compact visible proof-summary row for bridge, wallet, and receipt readiness.
- [x] Keep visible proof copy synchronized with the shared accessibility proof contract.
- [x] Revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge proof-summary presentation contract with state-aware tone and icon semantics.
- [x] Wire state-aware proof-summary presentation into the visible judge row and accessibility label.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge proof-summary live-region contract for readiness changes.
- [x] Wire proof-summary updates to a polite accessibility surface without duplicating walkthrough status.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure judge proof-summary freshness contract for current readiness copy.
- [x] Wire a concise last-updated label into the proof-summary row without introducing nondeterministic test behavior.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a pure bridge-health freshness contract for a deterministic last-checked label.
- [x] Wire the latest bridge-health timestamp into the judge proof summary when diagnostics refresh.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Persist the latest bridge-health checked label through the existing local storage gate.
- [x] Restore the persisted bridge-health checked label during hydration with a safe fallback.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a diagnostics-panel freshness presentation contract for checked, pending, and invalid timestamp states.
- [x] Wire the shared freshness presentation into the live bridge-health diagnostics card.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a shared bridge-health diagnostics summary contract for concise status, freshness, and recovery messaging.
- [x] Wire the diagnostics summary into the live bridge-health card with synchronized accessibility copy.
- [x] Add deterministic coverage, revalidate the full app, portrait preview, and save a checkpoint.

- [x] Add a state-aware bridge-health status row inside the expanded demo diagnostics panel.
- [x] Keep the diagnostics icon, tone, label, and accessibility state synchronized during checking, fallback, and ready states.
- [x] Add deterministic coverage, revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Improve the first-time reward-history empty state with clearer next-action guidance.
- [x] Add an accessible visual cue that connects the empty state to the arena and wallet-ready receipt flow.
- [x] Add deterministic coverage where applicable, revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Improve the first-time Recent Crew state with an invite-focused social prompt.
- [x] Reuse the existing party-share flow with accessible copy and a clear action.
- [x] Revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Make the selected match-history row expose an explicit recap-share action and status.
- [x] Keep recap sharing accessible and guarded while preserving the existing native handoff behavior.
- [x] Revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Add a shared match-history recap presentation contract for idle, selected, and in-flight rows.
- [x] Centralize recap-row accessibility labels, hints, busy state, and icon semantics.
- [x] Add deterministic coverage, revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Improve the compact match-history timeline with per-result accessibility labels.
- [x] Add clear oldest-to-recent orientation and empty-slot semantics without changing the visual rhythm.
- [x] Revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Add explicit accessibility labels, hints, and state semantics to the onboarding READY UP control.
- [x] Add disabled-state guidance to ENTER THE ARENA so the first action is clear before readiness.
- [x] Revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Add a shared matchmaking-readiness presentation contract for ready and not-ready states.
- [x] Centralize onboarding status copy, control labels, hints, and arena-entry guidance.
- [x] Add deterministic coverage, revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Memoize the matchmaking readiness presentation once per render to avoid repeated contract construction.
- [x] Revalidate the app and verify the portrait preview after the memoization refinement.

- [x] Add a subtle readiness transition to the matchmaking status card.
- [x] Respect the existing reduced-motion preference and preserve accessible state announcements.
- [x] Revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Add a shared wallet-ready reward presentation contract for win, wallet, and receipt states.
- [x] Centralize reward preview title, metadata, icon tone, and accessibility summary.
- [x] Add deterministic coverage, revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Add a shared reward-receipt action presentation for ready-to-save and already-saved states.
- [x] Centralize receipt action labels, hints, disabled state, and accessible busy feedback.
- [x] Add deterministic coverage, revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Add a shared receipt-details disclosure presentation for expanded and collapsed states.
- [x] Centralize receipt-details labels, hints, and expanded accessibility state.
- [x] Add deterministic coverage, revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Add a reduced-motion-aware reveal transition for local receipt details.
- [x] Preserve accessible expanded-state announcements while animating only visual presentation.
- [x] Revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Add a direct ENTER THE ARENA action to the first-time reward-history empty state.
- [x] Keep the action accessible and route users through the existing guarded matchmaking flow.
- [x] Revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Add a compact first-match progress cue to the team lobby.
- [x] Connect the cue to the existing side-selection, readiness, and Plaza Band reward flow without adding new state.
- [x] Revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Add a shared first-match progress presentation for ready and not-ready lobby states.
- [x] Centralize the progress cue label and accessibility summary without adding new state.
- [x] Add deterministic coverage, revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Add a dismissible first-match tutorial marker for the initial pull interaction.
- [x] Keep the marker accessible, non-blocking, and compatible with the existing tutorial controls.
- [x] Revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Add a dynamic first-pull coaching cue that changes after the first successful pull.
- [x] Centralize the cue’s copy and accessibility summary without changing gameplay timing.
- [x] Add deterministic coverage, revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Announce the first-pull coaching cue update politely after the first successful pull.
- [x] Keep the live cue concise and synchronized with the existing pull counter.
- [x] Revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Announce the lobby progress cue when readiness changes.
- [x] Keep the update polite and synchronized with the shared first-match progress presentation.
- [x] Revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Announce the live pull counter and streak progress politely during arena play.
- [x] Keep the counter summary concise and synchronized with the first-pull coaching cue.
- [x] Revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Expose the live rope power balance as an accessible progress value.
- [x] Keep the accessible value synchronized with the visible team and opponent scores.
- [x] Revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Refine the rope power accessibility summary to announce both crew percentages and the opposing balance.
- [x] Complete validation and portrait preview verification for the rope power summary refinement.

- [x] Extract a shared power-track accessibility presentation contract.
- [x] Centralize crew label, hint, and bounded percentage semantics for the live rope balance.
- [x] Add deterministic coverage, revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Extract a shared arena score accessibility presentation contract.
- [x] Centralize crew and opponent score labels with bounded numeric values.
- [x] Add deterministic coverage, revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Extract a shared arena timer accessibility presentation contract.
- [x] Keep remaining seconds, visible timer copy, and accessibility announcement synchronized.
- [x] Add deterministic coverage, revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Extend the shared arena timer presentation with warning and timeout semantics.
- [x] Keep timer accessibility copy synchronized with the visible countdown and urgency state.
- [x] Add deterministic coverage, revalidate the app, verify portrait rendering, and save a checkpoint.

- [x] Add deterministic contracts for arena score and timer states across start, midpoint, surge, and timeout.
- [x] Ensure terminal arena state cannot accept additional pull or surge actions.
- [x] Run full validation, verify portrait rendering, and save a checkpoint.

- [x] Reflect arena interaction availability in pull and Power Surge control accessibility state.
- [x] Keep disabled control styling synchronized with timeout and tutorial locks.
- [x] Validate the polish and save a checkpoint.

- [x] Add a shared match-result accessibility presentation for victory and defeat states.
- [x] Keep result hero semantics synchronized with the visible outcome and next-action guidance.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Centralize victory and defeat announcements at the results-screen transition.
- [x] Ensure timeout defeats receive the same accessible completion feedback as line-crossing wins.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a visible MATCH COMPLETE cue to the results hero.
- [x] Keep the cue synchronized with victory and defeat result semantics.
- [x] Validate the presentation and save a checkpoint.

- [x] Reject malformed or non-finite delayed walkthrough callback indexes safely.
- [x] Preserve valid callback ordering and stale-generation protections.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Treat an inconsistent paused-idle reward handoff state as resettable instead of resumable.
- [x] Preserve resume behavior for valid paused active stages and ignore completed reward stages.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Make the manual judge walkthrough reward step seed a deterministic winning result.
- [x] Ensure direct step-four navigation opens the same reward-ready state as the automated walkthrough.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add deterministic end-to-end assertions for automated RSVP → reconnect bridge → gameplay → reward.
- [x] Verify ordered lifecycle, stage, action-index, and completion outputs for the full walkthrough.
- [x] Run full validation, verify portrait rendering, and save a checkpoint.

- [x] Add an explicit pure contract for the automated walkthrough stage sequence.
- [x] Assert ordered RSVP, reconnect, gameplay, and reward stages with stable action indexes.
- [x] Run full validation, verify portrait rendering, and save a checkpoint.

- [x] Add a deterministic pause → resume → complete recovery assertion for the judge walkthrough.
- [x] Add reset and restart assertions that invalidate the prior callback generation safely.
- [x] Run full validation, verify portrait rendering, and save a checkpoint.

- [x] Ensure paused and completed judge walkthrough states expose consistent primary-control semantics.
- [x] Keep visible lifecycle badge and primary action aligned for pause, resume, and completed states.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a shared actionable feedback contract for ignored stale walkthrough callbacks.
- [x] Surface the recovery guidance without changing safe callback rejection behavior.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add a compact deterministic judge walkthrough transition summary for accepted and ignored callbacks.
- [x] Keep the summary safe for accessibility announcements and repeatable demo recovery.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add exhaustive deterministic coverage for ignored judge walkthrough callback feedback outcomes.
- [x] Verify stale, out-of-order, paused, stopped, and unmounted messages remain actionable and distinct.
- [x] Validate the app, verify portrait rendering, and save a checkpoint.

- [x] Keep reset and restart status visible in the same deterministic transition summary.
- [x] Ensure recovery feedback is not overwritten by generic walkthrough-ready copy.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Clear stale reset-only status when restart or active walkthrough execution begins.
- [x] Keep the visible transition summary and reset-status line synchronized with the latest lifecycle event.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Ensure the completed reward transition summary uses completion status instead of step-action copy.
- [x] Keep reward lifecycle, transition card, and completion announcement semantically aligned.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Keep reward receipt saved status reflected in the shared judge transition summary.
- [x] Ensure claim completion updates visible and accessible judge feedback without changing minting boundaries.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Clear saved reward feedback when a new manual match begins.
- [x] Keep the judge transition summary aligned with the active match rather than the prior receipt.
- [x] Add deterministic coverage, validate the app, and save a checkpoint.

- [x] Add one focused, high-value reliability improvement within the 190-credit budget.
- [x] Preserve the stable fallback arena and add deterministic regression coverage.
- [x] Run focused validation, verify portrait rendering, and save one checkpoint.

- [x] Expand deterministic synthetic social mock data for crew, presence, contacts, and leaderboard surfaces.
- [x] Keep the expanded mock data local-only and compatible with existing Friendzone interactions.
- [x] Run focused validation, verify portrait rendering, and save one checkpoint.
