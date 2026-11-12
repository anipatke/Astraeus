---
id: T-312
title: Make camera moves jump for reduced motion and fill the guide's gaps
objective: O-072
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-312, reason: 'Owner said "orchestrate next" to orchestrate O-072 under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o072-run-20261112}, recorded_at: '2026-11-12T12:15:03Z'}
planned_by: {role: planner, session: plan-o072-20261112}
---

# Make camera moves jump for reduced motion and fill the guide's gaps

## Outcome

With `prefers-reduced-motion: reduce`, every eased camera move (host `setCamera`, a view's camera rule, the timeline's Go to framing, the visitor's own picks) arrives on the next frame; without it, nothing changes. The README states the contracts the Closest Calls review found missing or wrong, and the 0.9.1 changelog and release notes are ready for the owner.

## User Check

Optional, on `localhost:5490`: turn on reduced motion (system setting, or DevTools Rendering → Emulate `prefers-reduced-motion: reduce`), pick an object from the menu or switch view: the camera is there at once. Turn it off: it glides as before.

## Done When

- Reduced motion: a node test drives the shared glide rule (`resolveCamera`) one frame with a pending focus tween, distance, azimuth and elevation change, reduced on and off: on, every value equals its target after one frame; off, values match today's decay. Regression test fails on the unfixed source (TEST-02).
- README (`packages/astraeus/README.md`) states, each against the source (API-07):
  - `handle.setCamera` row (and wherever "eases there" is said): with `prefers-reduced-motion: reduce` it arrives at once, as does every camera move in the viewer.
  - Bodies and paths: `plane: "ecliptic-j2000"` is rotated by the engine's obliquity 84381.406" (IAU 2006); JPL Horizons uses 84381.448" (IAU 1976), about 0.2 microradian, so JPL ecliptic data lands about 30 km off at 1 au (read the actual value from the engine's ecliptic-to-equator matrix; do not add a constant, STYLE-07).
  - Times are whole Unix milliseconds; a fractional or out-of-range value throws a `RangeError` today (I-176 tracks making it a `SceneError`).
  - `provider: { stateAt(timeUtcMs, center?) }`: when the engine passes `center` and what the returned State must hold (`center`, frame, `Float64Array` positions, `velocityKmS` optional or required, `orientation: null`). Establish each fact from `src/api/` and `src/core/` source and an existing or new test; do not copy the review's guess.
  - The orbit camera's vertical field of view is 45° (`CAMERA_FOV_DEG`), next to `fitOrbit`'s "narrower half field of view".
  - An elements body's colours: with a `color` option, the orbit line and label take it and the dot takes `marker.color`; without one, all take `marker.color` (confirm in source before writing).
  - Path `anchors`: their labels are off by default and show with the `labels` display switch.
- `packages/astraeus/CHANGELOG.md` `## Unreleased`: the reduced-motion camera fix and the README additions. `docs/release-notes-0.9.1.md`: G-019's changes (O-069..O-072) in the shape of `docs/release-notes-0.9.0.md`, additions only, data peers unchanged. No version bump, tag or publish.
- Gates per `docs/agents/verification.md`: lint, typecheck, build, `npm test`.

## Context Files

- `packages/astraeus/src/app/CameraController.tsx` (`resolveCamera`, `cancelCameraTransition`)
- `packages/astraeus/src/app/sceneFrame.ts` (the `resolveCamera` call and the existing `prefersReducedMotion()` use near line 257)
- `packages/astraeus/src/app/skyFigures.ts` (`prefersReducedMotion`)
- `packages/astraeus/tests/sceneCamera.test.ts`
- `packages/astraeus/src/core/state.ts` (`assertUtcUnixMs`, `State`)
- `packages/astraeus/src/app/sceneFraming.ts` (`CAMERA_FOV_DEG`)
- `packages/astraeus/README.md` under `Bodies and paths`, `The camera`, `Camera from the host`, `Looks, picker, scale and switches`
- `packages/astraeus/CHANGELOG.md` (top section only, AGENTS.md read-by-section rule)
- `docs/release-notes-0.9.0.md`
- `.savepoint/releases/G-019-story-timing-and-flyby-fixes-for-0-9-1/Release.md`
- `.savepoint/issues/I-176-a-fractional-time-throws-a-plain-error-not-a-scene-error.md`
- `~/code/neo/docs/astraeus-findings.md` rows F-02, F-03, F-04, F-12, F-13, F-14, F-17 (the review; facts to verify, not to copy)

Provider `stateAt` call sites, the elements-body colour code and the anchor-label code are found by targeted grep; log each extra read.

## Design References

`.savepoint/Design.md` under `Host-page behaviour`, `Sky figures` (item 11, the existing reduced-motion fade rule) and `Paths across the solar system`.

## Guardrails

API-04, API-05, API-07, ARCH-02, CODE-02, TEST-01, TEST-02, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Give `resolveCamera` a reduced-motion input (a parameter, so the node test controls it; ARCH-02, no `matchMedia` inside the pure step). When reduced, the blend is 1: distance, azimuth, elevation equal their targets and `transition` is 0 this frame. `sceneFrame.ts` passes `prefersReducedMotion()` (STYLE-07: the one read).
2. Add the table test in `tests/sceneCamera.test.ts` (or the file that already tests `resolveCamera`): reduced on/off × {focus tween, distance, angles}.
3. Verify each README fact in source, then write the README sentences in their sections; keep each to the section it belongs in.
4. Write the CHANGELOG entry and `docs/release-notes-0.9.1.md`.
5. Run the gates; record evidence.

## Boundaries

No new camera option or API; no change to the error type (I-176); no browser-run step (owner, 2026-11-12); no version bump, tag or publish; do not stage `docs/prds/` or `docs/research/`.

## Technical Verification

Focused `tests/sceneCamera.test.ts` during iteration; handoff runs lint, typecheck, build and `npm test` (`docs/agents/build.md`). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

If `Design.md` `Host-page behaviour` should name the camera's reduced-motion rule, note it here for reconciliation before the Full Objective Check.
