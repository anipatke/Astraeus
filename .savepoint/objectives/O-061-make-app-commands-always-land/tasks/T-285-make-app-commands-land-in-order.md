---
id: T-285
title: Make app commands land in order
objective: O-061
status: done
depends_on: [{task: T-284, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: voyagers-review-20261110}
check_waiver: {task: T-285, reason: 'Owner said "orchestrate O-061" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o061-run-20261110}, recorded_at: '2026-11-09T20:44:20Z'}
---

# Make app commands land in order

## Outcome

The camera, time and view cases from T-284 pass: every host call after `ready` takes effect or throws in call order, before the first frame and inside `onChange` view-switch reports, and a view's follow rule works on a planet other views also show. The README states the order rule.

## User Check

None on screen beyond the end-of-Objective owner look.

## Done When

Owner decision for I-153 (see the Objective): the follow-rule case is met by a new opt-in on a view's `camera` rule that applies it on every switch to that view (suggested `{ follow: id, always: true }` / `{ focus: id, always: true }`; confirm no clash in the API lock and match API-04); views without it behave as today and keep their existing tests; update T-284's I-153 test to use the opt-in and add a test that without it the camera stays. API lock, README `setViews` row and CHANGELOG updated.

T-284's camera, time, view and follow-rule tests pass unmarked on both paths; one fix in the host seam, not one per call (STYLE-07); README host section states the order rule; CHANGELOG entry; no existing test changed.

## Context Files

T-284's Technical Evidence and test files; `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/viewerCamera.ts`, `packages/astraeus/src/api/viewerClock.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/app/views.ts`, `packages/astraeus/README.md` (host handle section), `packages/astraeus/CHANGELOG.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (host control seam).

## Guardrails

API-02, API-05, ARCH-02, TEST-01, TEST-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Apply the cause found for each case at the host seam.
2. Unmark the tests; run them on both paths.
3. Write the order rule into the README and the CHANGELOG.
4. Run the gates.

## Boundaries

No new public call; no change to existing call shapes or error codes. Story panels are the next step.

## Technical Verification

`npm run check:gates` (lint, typecheck, build, `npm run test:full`, engine-alone, pack, node and react consumer checks); browser scripts only at the Full Objective Check (`npm run check:browser`). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Seam: the host's last `setCamera` is kept in one extra control slot, `controls.hostCameraRequest` (set by `App.tsx` `setCamera` beside `cameraRequest`, reset by `chooseView` at each switch). Two readers yield to it: `sceneCamera.ts` `openFirstFrame` re-issues it after the start view instead of clearing it (the opening still clears any other request, so "consumes any request" is unchanged); `AstraeusShell.tsx` `applyViewRule` skips its own hold/framing request when `hostCameraSet()` is true. `setTime`/`setView` already landed (T-284), so they needed no change.
I-153: `{ follow: id, always?: true }` / `{ focus: id, always?: true }` on a view's `camera` (`ViewCameraInput`, `ResolvedView` framing); `always` other than `true` throws `bad-view`. `AstraeusShell` effect applies the rule on every switch to that view when the framing has `always`; without it the old condition (followed object removed) is unchanged.

| Done When | Test |
|---|---|
| I-150 setCamera before the first frame applies after the opening view, both paths | hostCallOrder.test.ts "setCamera in a scene that opens on a start view still takes effect after the first frame (I-150)" (now plain `it`) |
| I-150 setCamera inside onChange of a view switch is not replaced by the view's rule, both paths | "setCamera lands and is not replaced by the view's own camera rule (I-150)" (plain `it`) |
| I-153 opt-in applies on every switch | "switching to a view whose rule is opted in with always makes the camera follow what it names (I-153)" |
| Without the opt-in the camera stays on a shared planet | "without always the camera stays on a planet both views show (I-153)" |
| Rule is a default a later host call replaces | "a host setCamera after the switch still wins over an opted-in rule" |
| Views without opt-in behave as today, existing tests unchanged | "still applies when the followed object is not in the new view", sceneCamera.test.ts, sceneViews.test.ts, syntheticViews.test.ts all pass unedited |
| README order rule and `setViews` opt-in | README.md host section ("Order rule") and `setViews` row |
| CHANGELOG, API lock | CHANGELOG "Unreleased (0.8.1)"; `npm run api:lock` regenerated `api-surface.lock.json`; migrationTable.test.ts WIDENED gained `ViewCameraInput` (additive widening entry, the test's own mechanism) |
| I-151 not in this step | its `it.fails` left as is (T-286) |

Files changed: packages/astraeus/src/app/sceneCamera.ts, src/app/App.tsx, src/app/AstraeusScene.tsx, src/app/views.ts, src/api/views.ts, src/shell/AstraeusShell.tsx, tests/hostCallOrder.test.ts (two `it.fails` unmarked, three tests added, replaced the one I-153 `it.fails`), packages/astraeus-site/tests/migrationTable.test.ts (WIDENED entry), README.md, CHANGELOG.md, api-surface.lock.json.
Commands: `npx vitest run tests/hostCallOrder.test.ts` 24 passed, 2 expected fail (I-151, both paths); `npm run check:gates` all 9 gates passed (lint, typecheck, build, test, test:full, engine-alone, pack, node-consumer, react-consumer), 178 s. First gate runs failed twice and were repaired: scenePin snapshot pinned the `bad-view` camera message (message left unchanged), and migrationTable needed the WIDENED entry.
Limits: the 3D scene is a stand-in; the first-frame case runs the real `stepCameraTarget`, so order in a real browser is not checked (`check:browser` not run). A visitor click made between a host `setCamera` and the next frame is overtaken by the host call (frame-scale window). A host `setCamera` suppresses only the view rule's request, not its selection change.

## Drift Notes

Reconcile the host seam's order rule (one extra slot `controls.hostCameraRequest`, read by the opening view and the view rule; reset at each view switch) into Design.md (Interfaces and Data Flow) before the Full Objective Check.
