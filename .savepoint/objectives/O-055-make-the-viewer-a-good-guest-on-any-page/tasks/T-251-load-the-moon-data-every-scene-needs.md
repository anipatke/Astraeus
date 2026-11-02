---
id: T-251
title: Load the moon data every scene needs
objective: O-055
status: planned
depends_on: [{task: T-250, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o055-planning-20261102}
---

# Load the moon data every scene needs

## Outcome

A planet's moon system loads, for every request, the chunks that request needs and does not yet hold, so a second scene, a rebuild or a remount on the same page never misses moons because an earlier scene loaded first (O-055 Success Condition 2; review F1; API-03).

## User Check

Not owner-facing: nothing on screen changes for a single viewer; the fix shows only when a second scene loads. The owner sees the result at the end of the Objective.

## Done When

- `createMoonSystem(...).load(request)` in `packages/astraeus/src/core/bodies/moonSystem.ts` no longer returns early because a set is installed or a load is in flight: it reads the index once (shared), then works out the chunks this request needs (window, history look-back, the year after the window) and fetches and decodes only those not already added or already being fetched (per-chunk in-flight dedupe), into the one shared set; it resolves when this request's chunks are in. `assertWithinSpan` still runs for every request. `install(set)` keeps its meaning for tests.
- Entry paths, each a row of one table-driven test in new `packages/astraeus/tests/moonLoadTwice.test.ts` with a counting `fetchBytes` (each row asserts which chunk paths were fetched, that none was fetched twice, and that `stateOf` answers for the second request's bodies and times): (1) same bodies, a later window; (2) a new moon, same window; (3) a second load started while the first is still in flight, needing other chunks; (4) a second load whose history look-back needs older chunks; (5) a second load whose year-after-window chunk is new; (6) an identical second load fetches nothing; (7) an out-of-span second load rejects with `MoonOutOfSpanError` and leaves the set usable for the first.
- Through the public path: `installData` (`src/api/data.ts`) with two scenes of the same planet at different years both get their moons (a test there or in the table file), and the moon placeholder of `packages/astraeus/tests/twoViewers.test.ts` becomes a real case per pairing (real `prepareScene` for these two scenes with a stubbed fetch, or the smallest real seam that reaches `installData`; say which), including an `AstraeusScene` rebuild with a new `scene` and a `mount` unmount-and-mount with a new scene.
- `outOfSpan` still names the package in its `out-of-span` `SceneError`; the existing moon tests (`historicalMoons`, `dataSpans`, `planetMoonSystems`, `jupiterMoonsEphemeris`) pass unchanged or with a recorded reason for each edit.
- CHANGELOG Unreleased gains one line (a fix: moon data loads for every scene on a page). No public type changes: `git diff --exit-code -- packages/astraeus/api-surface.lock.json` is empty and `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/core/bodies/moonSystem.ts`, `packages/astraeus/src/api/data.ts`, `packages/astraeus/tests/historicalMoons.test.ts`, `packages/astraeus/tests/dataSpans.test.ts`, `packages/astraeus/tests/moonData.ts`, `packages/astraeus/tests/twoViewers.test.ts`, `packages/astraeus/CHANGELOG.md` under `Unreleased`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (the "Journeys across years (O-047)" paragraph); the O-055 Objective under `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F1).

## Guardrails

ARCH-02, API-03, DATA-01, TEST-01, TEST-03, STYLE-02, STYLE-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Split `load` into: index once; chunks needed for a request; fetch-and-add the missing ones with a per-path in-flight map.
3. Write the table test with a counting `fetchBytes`; then the public-path case and the two-viewer case.
4. Run the existing moon tests; CHANGELOG line; gates.

## Boundaries

Moon chunk loading only. The planet series and the star file stay page-wide (each loads whole). No public `load` call (that is O-056). Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; T-258 reconciles them into Design.md.
