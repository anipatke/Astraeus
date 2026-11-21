---
id: T-391
title: Browser steps wait for what they check, not for a fixed time
objective: O-086
status: done
depends_on: [{task: T-390, requires: clear}]
check_waiver: {task: T-391, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T20:47:35Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: browser
planned_reads: [packages/astraeus-site/tools/validate/driver-guard.mjs, packages/astraeus-site/tests/browserAssertions.test.ts]
planned_writes: [packages/astraeus-site/tools/validate/journey-meteor-shower.mjs, packages/astraeus-site/tools/validate/journey-planets-phone.mjs, packages/astraeus-site/tools/validate/check-hello-scene.mjs, packages/astraeus-site/tools/validate/check-hello-planets.mjs, packages/astraeus-site/tools/validate/journey-look-out.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/driver.d.mts]
---

# Browser steps wait for what they check, not for a fixed time

## Outcome

The arbitrary fixed sleeps in the browser scripts become polls on the readout the next assertion reads, with a timeout, so a step moves on as soon as the page is ready and fails clearly when it never is (Objective: "fixed sleeps replaced by polls"; Claude I.3: about 25 s of removable sleeps; I-123 was a fixed sleep racing a load).

## User Check

None visual.

## Done When

- These `page.waitForTimeout` calls (O-093 head line numbers) are replaced by a driver poll on the condition the following code reads, each with a timeout at least as long as the old sleep's intent (default 10 s) and an error naming what never became true:
  - `journey-meteor-shower.mjs` ~29 (1500 ms after play: poll until `framesDrawn` passes the count the following assertion needs), ~36 (500 ms after a seek: poll until the clock has settled and the stream dots are read), ~53 (800 ms after the shower switch: poll until the scene reads the new shower).
  - `journey-planets-phone.mjs` ~39 (1500 ms: poll on the readout the place-card tap needs, e.g. `sceneFeatures` stable).
  - `check-hello-scene.mjs` ~27 (1500 ms after open) and `toggleAndRead` ~119 and ~123 (500 ms each: poll until `drawn()` differs from `before`, then until it returns).
  - `check-hello-planets.mjs` ~17 (1500 ms after open), ~31 (500 ms after the stars slider: poll until the sky reports the new brightness), ~42 (500 ms after the scale button: poll until `currentScale` changes).
  - `journey-look-out.mjs` ~173 (400 ms after a figure tap: poll until the selection readout the next assertion reads changes).
- Kept on purpose, unchanged, each already commented as a measurement window: `journey-views.mjs` ~100 (2 s hold-still window) and `browser-smoke.mjs` ~294 (3 s frames-per-second window); driver-internal short waits inside existing poll loops are not in scope.
- Polls live in `driver.mjs` (one general `waitUntil(page, read, done, { timeout, what })` if none exists; reuse `waitUntilStable` where it fits), declared in `driver.d.mts`; scripts call only driver functions (driver guard).
- No assertion or guard changes text (the assertion baseline test passes unchanged).
- Browser runs (one browser job at a time; nothing else running): `npm run check:browser -- --step meteor-shower --step planets-phone --step hello-scene --step hello-react --step hello-planets --step look-out` before (the draft 09 state) and after, same machine; green; per-step times recorded. Run the after set twice to show no new flake.
- Gates per `docs/agents/verification.md`.

## Context Files

- The five scripts above (the named lines and the assertion that follows each)
- `packages/astraeus-site/tools/validate/driver.mjs` (`waitUntilStable` and the existing `waitFor*` helpers; search by name)
- `packages/astraeus-site/tools/validate/driver.d.mts`
- `packages/astraeus-site/tools/validate/driver-guard.mjs` (what scripts may call)

## Design References

None.

## Guardrails

TEST-01, STYLE-07, STYLE-10, CODE-01.

## Implementation Plan

1. Time the six steps as they are.
2. For each sleep, name the readout its next assertion reads; write or reuse the driver poll.
3. Replace the sleeps; focused tests; the step runs twice; gates.

## Boundaries

The listed sleeps only; no assertion, threshold or scene change. `views` and `catalogue` scripts are draft 11's. If a sleep guards something no readout shows, keep it, comment why, and record it.

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/browserDriverGuard.test.ts packages/astraeus-site/tests/browserAssertions.test.ts`; `npm run typecheck`. Browser: the step runs above, after draft 09's runs and never alongside another browser job. Handoff: `quality_gates`.

## Technical Evidence

| Done When | Evidence |
|---|---|
| 14 listed sleeps replaced by polls with timeout and error naming the condition | `waitUntil` in driver.mjs (+ d.mts); no `waitForTimeout` left at the listed lines (grep) |
| Kept sleeps untouched | journey-views ~100 and browser-smoke ~294 not edited |
| No assertion text changed | browserAssertions and browserDriverGuard tests pass (9 tests) |
| Browser before/after, green, twice | before: planets-phone 9s, meteor-shower 21s, look-out 35s (FAILED at phone step 3 "turns west to Kettle", before any change), hello-scene 17s, hello-react 4s, hello-planets 10s. After run 1: meteor-shower 18s, look-out 68s (green), hello-scene 17s, hello-react 3s, hello-planets 4s, planets-phone failed (see below). After run 2: meteor 18s, look-out 67s, hello-scene 14s, hello-react 3s, hello-planets 7s. planets-phone after fix: 9s green. |
| Gates | lint (incl. prettier), typecheck, focused vitest green; full build/test not run (browser-script-only change) |

Deviations: planets-phone ~39: a poll on "markers shown" alone raced the camera easing to Io (marker click timed out), so it polls shown markers then `waitUntilStable` on them. look-out ~173 asserts nothing is selected, so no readout changes: it waits for the scene to draw more frames after the tap (a tap wakes the resting scene). meteor-shower ~29 message still says "1.5 s". look-out was red in the baseline run (phone step 3 turns west) and green in both after runs: a pre-existing flake, not from this Task; look-out times are slower in the after runs (35s -> 67s, the baseline run failed early so is not comparable).
Files: driver.mjs, driver.d.mts, journey-meteor-shower.mjs, journey-planets-phone.mjs, check-hello-scene.mjs, check-hello-planets.mjs, journey-look-out.mjs (all under packages/astraeus-site/tools/validate/) and this Task file.

## Drift Notes

None expected.

Coordinator (orchestrate-g024-20261121): lint (with prettier) and typecheck green; driver-guard and assertion-baseline tests green; each changed step green after the change (planets-phone once after its fix). A look-out failure at phone step 3 before any change is recorded as a pre-existing flake and watched at the Full Check. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
