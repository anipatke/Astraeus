---
id: T-391
title: Browser steps wait for what they check, not for a fixed time
objective: O-086
status: planned
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

Pending execution.

## Drift Notes

None expected.
