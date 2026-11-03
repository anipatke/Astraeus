---
id: T-262
title: Change looks, scale and switches on a running viewer
objective: O-056
status: done
depends_on: [{task: T-261, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-262, reason: 'Owner said "Orchestrate o56" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o056-run-20261103}, recorded_at: '2026-11-03T10:32:39Z'}
planned_by: {role: planner, session: o056-planning-20261103}
---

# Change looks, scale and switches on a running viewer

## Outcome

A host changes the look, the scale and the display switches of a running viewer and reads them back, the same way from `mount` and React, and a planet can carry info-card readouts (O-056 Success Conditions 4, live half, and 5; review F10 rest, F11; owner decision 1).

## User Check

Not owner-facing yet; the owner tries it in the example at the last step.

## Done When

- `ViewerHandle` gains `look` (the current look, defaults filled) and `setLook(look: LookInput)` (replaces the whole look; checked as `Scene.setLook`), `scale` and `setScale(id)` (one of `scene.scales`; unknown throws the code `Scene.setScale` uses), and `switches` and `setSwitch(id, on)` (a display switch of the scene; unknown throws `bad-switch` or the existing switches code). Each change is presentation only (ARCH-02) and is reported through `onChange` with cause `host` (the Developer drawer and the visitor's own controls report `visitor`), the reads compared in `ViewerLink.publish` like `view`. Exact member names recorded in Technical Evidence and kept to the verb grammar.
- The Developer drawer's look sliders and the visitor's scale and switch controls go through the same seam, so a visitor change is read back by `handle.look` / `scale` / `switches`.
- `AddBodyOptions.readouts` takes the `ReadoutInput` list paths take, drawn on the body's info card by the same code (no copy); a named body not in the scene throws as on `addTrajectory`.
- `lifecycle.test.ts` (both paths) and `twoViewers.test.ts` (setter table) cover every new handle member: before ready / after unmount `not-mounted`, set then read, A does not change B.
- **Surface:** `npm run api:lock` regenerated and the lock diff limited to the members this step adds; CHANGELOG (Unreleased) and the README API tables updated in the same change; `apiSurface`, `apiRules` and `allowlistGrowth` tests pass (no allowlist group grows).
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/api/scene.ts` (`ReadoutInput`, `AddBodyOptions`), `packages/astraeus/src/api/planBodies.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/tests/twoViewers.test.ts`, `.savepoint/Design.md` under `Interfaces and Data Flow` ("One handle, one lifecycle (O-054").

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)` ("The engine signals, the host decides", "Lifecycle").

## Guardrails

API-01, API-02, API-04, API-05, API-06, ARCH-02, ARCH-03, ARCH-06, TEST-01, TEST-03, STYLE-02, STYLE-07, STYLE-10, CODE-01, API-03.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Extend the viewer seam (`viewerPort.ts`) with look, scale and switches; route the visitor's controls through it.
3. Add the handle members in `viewerHandleOf` only (one builder, both paths).
4. Add body readouts reusing the path readout code.
5. Lifecycle and two-viewer table rows; lock, README, CHANGELOG; gates.

## Boundaries

Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files. No renames of existing members and no removal of `toDefinition` (O-057). No new React props for these (the handle covers React through `ref` / `onReady`).

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus the named `check:*` scripts. No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Done When item -> evidence.

1. Handle members (kept to the verb grammar: reads are nouns, calls are `set*`): `look` / `setLook(look: LookInput)`, `scale` / `setScale(id)`, `switches` / `setSwitch(id, on)`; types `LookRead` (new, exported) and `ViewerChange` now carries `scale`, `look`, `switches?`. One builder (`viewerHandleOf`), one part (`src/api/viewerLooks.ts`, checks: `checkedLook` -> `bad-look`; id not in `control.scales` -> `bad-scale`; unknown id or non-boolean -> `bad-switch`). Reads are compared in `ViewerClock.publish` like `view` (`sameLooks`). Host calls report `host` through `ViewerLink.#afterHost`. Tests: `viewerLinkPin.test.ts` (not-mounted, checks, control hears only valid calls), `lifecycle.test.ts` (both paths: set then read, cause host, bad codes, not-mounted before ready/after unmount; the member table lists the new reads and calls).
2. Visitor seam: `App.tsx` reads scale, looks and switches from the scene's live controls (`stateNow`: `controls.policy.id`, `lookReadOf(controls)`, `live.current.switches()`), so the shell's scale button, the shell's switches and every Developer-drawer slider/button are read back by the handle. One effect tells the host `visitor` once the screen has the change (`shownKey`); a host call has already been told, so it finds nothing new. The drawer's loading-fade slider now also writes `controls.loadFadeSeconds`. Test: `viewerHostDom.test.ts` "a visitor's scale choice ... visitor".
3. `AddBodyOptions.readouts`: `readoutsOf` (shared with paths, now takes the call name) validates; `checkNamedReadouts` (shared with paths) checks named bodies at build; `createReadoutMetrics` gained a `bodies` argument and one inner `barsOf` used for paths and bodies (no copy). Replaces the catalogue's own distance rows (recorded decision, avoids duplicate metric ids). Tests: `publicApiPaths.test.ts` "body readouts".
4. `lifecycle.test.ts` (both paths) and `twoViewers.test.ts` SETTERS table (typed; `makeScene` now places the `labels` switch) cover every new member: not-mounted, set then read, A does not change B.
5. Surface: `npm run api:lock` regenerated (diff: the three reads and three setters on the two handle shapes, `readouts` on AddBodyOptions, `scale`/`look`/`switches` on ViewerChange, `LookRead`); `npm run api:errors` run; CHANGELOG Unreleased and README API tables (handle rows, `onChange` row, `addBody` row) updated. `apiSurface`, `apiRules`, `allowlistGrowth` pass.
6. Decisions: a live `setLook` goes through the one resolver `resolveLook(input, "")` and wins over the page address (the address only starts the viewer); it replaces the whole look. `skyVisible` is live: `SceneControls.skyVisible` hides the sky view's group; the sky is built when `runtime.sky.live` (App always sets it) so a sky that starts hidden can be shown. `switches` lists every placed switch with something to act on, including those placed `developer` (`hostReachable`).
7. Gates: `npm run lint` pass, `npm run typecheck` pass, `npm run build` pass, `npm test` pass (207 files, 2593 passed, 2 skipped). One earlier full run showed an "Unhandled Errors" block (not reproduced; two reruns clean); no `loadingCoverChain` failure seen in the reruns. No browser run. `npm run look:lock` not run; defaults unchanged.

## Drift Notes

- Design.md (T-264 to reconcile): the viewer seam (`ViewerState`, `ViewerControl`) now carries scale, look and switches; the live look is held in the scene's controls and read back from them (`liveLook.ts`), not in a second store. A live `setLook` wins over the address. `ViewerChange` gained `scale`, `look`, `switches?` (existing exact-match tests in `viewerLinkPin.test.ts` now use `toMatchObject`).
- `ViewerLink.publish` sets the internal "mover" cause to whatever last changed the reading, so a look/scale/switch change now counts as a mover for a later selection drop's cause; selection drops by time or view still follow the clock or view the same way, but a drop after a paused look change would name that change's cause. Not asserted by any test; flagged for the Check.
- Sky is now built for every viewer (not only when visible) only when `runtime.sky.live`; the App sets it, so a viewer opened with the sky hidden now loads the star catalogue (hidden, not drawn).
