---
id: T-365
title: Give the empty checks something to check
objective: O-085
status: planned
depends_on: []
check_waiver: {task: T-365, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:50:31Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: assertions
planned_reads: [packages/astraeus-site/src/bootCover.ts, packages/astraeus-site/tests/bootCover.test.ts, packages/astraeus-site/src/main.tsx]
planned_writes: [packages/astraeus-site/tests/loadingCoverChain.test.ts, packages/astraeus-demo-planets/tests/planetViews.test.ts, packages/astraeus/tests/pacingViews.test.ts, packages/astraeus/tests/sceneFrame.test.ts, packages/astraeus/tests/sceneViews.test.ts, packages/astraeus/tests/storyPanelClose.test.ts]
---

# Give the empty checks something to check

## Outcome

The Vitest cases the audits found asserting nothing, or less than their titles claim, each check an outcome, or their title is cut down to what they prove (AH-34: Gemini's "Confirmed Tautological / Broken / Weak Tests" list).

## User Check

None visual.

## Done When

- `packages/astraeus-site/tests/loadingCoverChain.test.ts`, case "back and forward open the address now in the location without pushing a new one, and an address that fails shows the failure cover" (~140–150): it never opens a failing address. Either it gains a final leg that pops to an address whose scene fails (the file already stubs `fetch` to reject, line ~50; the cover's failed state is set at `src/bootCover.ts:47`) and asserts `boot()!.dataset.state === "failed"`, or, if no failing address is reachable in this harness, the title drops "and an address that fails shows the failure cover" and Technical Evidence names the test that does prove it (`tests/bootCover.test.ts` case name). Prefer the first. The existing steps of the case are unchanged.
- Each lone `not.toThrow()` below keeps its "does not throw" and gains one assertion on the result, so a wrong but quiet result fails:
  - `packages/astraeus-demo-planets/tests/planetViews.test.ts` ~31 "builds without a viewer, given the planet's data": also asserts what `scene.check(...)` returns (for example that it reports nothing missing; use its real return shape).
  - `packages/astraeus/tests/pacingViews.test.ts` ~88 "a near rule whose events belong to different views still loads": also asserts the loaded definition carries the near rule (its pacing zone or rule is present).
  - `packages/astraeus/tests/sceneFrame.test.ts` ~256 "updates the sky only when the scene has a sky view, and reads it back only in developer mode": the first `publishCanvasReadouts(ctx)` (no sky view) also asserts no sky readout is written. Read the rest of the case first; if it already asserts that, record it and change nothing.
  - `packages/astraeus/tests/sceneViews.test.ts` ~108 "takes a body and a path in the one list …": also asserts view `A` in the built definition lists `"moon"` among its objects.
  - `packages/astraeus/tests/storyPanelClose.test.ts` ~69 "accepts a good span on a panel and on the playback": also asserts the built scene's panel carries `closeAfterSeconds: 30` and the playback 45 (through `definitionOf` or the scene's own read, whichever the file already uses).
- Each added assertion is shown to fail on a planted wrong value (one temporary edit per case, reverted; one line each in Technical Evidence).
- Only the named lines change; no other case in these files changes.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-site/tests/loadingCoverChain.test.ts` (setup lines ~33–64; the case ~140–150)
- `packages/astraeus-site/src/bootCover.ts` (read only)
- `packages/astraeus-site/tests/bootCover.test.ts` (case names only)
- `packages/astraeus-demo-planets/tests/planetViews.test.ts` (~25–35)
- `packages/astraeus/tests/pacingViews.test.ts` (~84–92)
- `packages/astraeus/tests/sceneFrame.test.ts` (~250–270)
- `packages/astraeus/tests/sceneViews.test.ts` (~100–112)
- `packages/astraeus/tests/storyPanelClose.test.ts` (~55–72)

## Design References

None.

## Guardrails

TEST-01, TEST-03, STYLE-10.

## Implementation Plan

1. For each case, read what the call returns and add one assertion.
2. Plant a wrong value per case; record; revert.
3. Focused tests, then gates.

## Boundaries

Test files only. Browser-script steps with no assertion (`browser-smoke.mjs` frame-rate sampling, `check-hello-planets.mjs` glow sliders) are O-086's step trimming, not this Task (PLAN.md decision 4). Disposal "does not throw" cases are O-092.

## Technical Verification

Focused: `npx vitest run packages/astraeus-site/tests/loadingCoverChain.test.ts packages/astraeus-demo-planets/tests/planetViews.test.ts packages/astraeus/tests/pacingViews.test.ts packages/astraeus/tests/sceneFrame.test.ts packages/astraeus/tests/sceneViews.test.ts packages/astraeus/tests/storyPanelClose.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
