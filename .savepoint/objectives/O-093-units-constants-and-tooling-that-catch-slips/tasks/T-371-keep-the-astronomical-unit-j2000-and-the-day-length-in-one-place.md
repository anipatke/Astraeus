---
id: T-371
title: Keep the astronomical unit, J2000 and the day length in one place
objective: O-093
status: planned
depends_on: []
check_waiver: {task: T-371, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T19:19:52Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: units
planned_reads: [packages/astraeus/tests/planetAccuracyFlybys.test.ts, packages/astraeus/tests/fixtures/scenePin.json]
planned_writes: [packages/astraeus/src/core/constants.ts, packages/astraeus/src/core/planetModels.ts, packages/astraeus/src/core/astronomyAdapter.ts, packages/astraeus/src/core/elementsBody.ts, packages/astraeus/src/core/timeScale.ts, packages/astraeus/src/core/chebyshevEphemeris.ts, packages/astraeus/src/core/satelliteMeanElements.ts, packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus/src/core/bodies/io.ts, packages/astraeus/src/api/planTimeline.ts, packages/astraeus/src/api/sunOrbit.ts, packages/astraeus/src/api/planBodies.ts, packages/astraeus/src/assets/compositions.ts, eslint.config.js, packages/astraeus/tests/constants.test.ts]
---

# Keep the astronomical unit, J2000 and the day length in one place

## Outcome

The engine defines each physical and calendar constant once, in `packages/astraeus/src/core/constants.ts`, every engine source module imports it from there, the values are proved identical to today's, and lint refuses a new copy of those literals in engine source (AH-21 part b: Claude CQ-9 `audits/2026-11-21_anthropic_claude-fable-5-2_auditfindings.md:167`; STYLE-07).

## User Check

None visual. `grep -rnE "149_?597_?870|946_?728_?000_?000|2_?451_?545|2_?440_?587|86_?400_?000" packages/astraeus/src` prints only `core/constants.ts` (plus comments, if any, which say where the value comes from).

## Done When

- New `core/constants.ts` exports, each with a one-line source comment: `AU_KM = 149_597_870.7` (IAU 2012 B2, exact), `JD_J2000 = 2_451_545` (JD of 2000-01-01T12:00), `J2000_NOON_UNIX_MS = 946_728_000_000`, `JD_UNIX_EPOCH = 2_440_587.5`, `DAY_S = 86_400`, `DAY_MS = 86_400_000`. Nothing else (no GM, no radii: those are per-body data with their own sources).
- Today's copies are replaced by imports: `AU_KM` in `core/planetModels.ts:8`, `core/astronomyAdapter.ts:10`, `core/elementsBody.ts:12`; J2000 in `core/planetModels.ts:9` (`Date.UTC(2000, 0, 1, 12)`), `core/timeScale.ts:29`, `core/chebyshevEphemeris.ts:163`, `core/astronomyAdapter.ts:11` (`J2000_TT_JD`), `core/elementsBody.ts:16`; Unix-epoch JD in `core/elementsBody.ts:14`, `core/satelliteMeanElements.ts:10`; `DAY_MS` in `core/timeScale.ts:30`, `core/satelliteMeanElements.ts:9`, `core/elementsBody.ts:15`, `api/planTimeline.ts:10`, `api/sunOrbit.ts:14`, and the bare `86_400_000` in `assets/compositions.ts:8,85,96`, `api/planBodies.ts:36`, `core/bodies/moonSystem.ts:96`; the day-in-seconds `86_400` used as physics in `core/elementsBody.ts:216,251`, `core/satelliteMeanElements.ts:71`, `core/bodies/io.ts:60`, `core/timeScale.ts:31`. Timeline rate-unit tables in `shell/timelineModel.ts` (display units) stay as they are.
- Arithmetic is unchanged apart from the name: no reordering of operations (floating-point results must be bit-identical).
- New `tests/constants.test.ts`: one table that checks each export against an independent statement of it (`AU_KM === 149597870.7`; `J2000_NOON_UNIX_MS === Date.UTC(2000, 0, 1, 12)`; `(JD_J2000 - JD_UNIX_EPOCH) * DAY_MS === J2000_NOON_UNIX_MS`; `DAY_MS === DAY_S * 1000`).
- `eslint.config.js` gains, for `packages/astraeus/src/**` except `core/constants.ts`, a `no-restricted-syntax` rule whose selectors match the numeric literals 149597870.7, 946728000000, 2451545, 2440587.5 and 86400000, with a message naming `core/constants.ts`. Evidence: a planted `const AU = 149_597_870.7;` in a scratch copy of one engine module fails `npm run lint`, then is removed. Record lint wall time before and after (limit 15 s, `tools/gate-limits.json`).
- Values unchanged, shown by: `tests/fixtures/scenePin.json` byte-identical, `planetAccuracyFlybys.test.ts` (Horizons within 1 km) and `elementsEpoch.test.ts` green, unedited.
- Existing tests unchanged (tests keep their own literal copies, which act as independent checks; see the plan's decision).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/planetModels.ts` (constants block, `planetModel`)
- `packages/astraeus/src/core/astronomyAdapter.ts` (constants block, `daysSinceJ2000Tt` around line 97)
- `packages/astraeus/src/core/elementsBody.ts` (constants block; lines ~210-255)
- `packages/astraeus/src/core/timeScale.ts` (constants block, `utcMsToTdbSeconds`)
- `packages/astraeus/src/core/chebyshevEphemeris.ts` (around `utcMsForTdb`, line ~163)
- `packages/astraeus/src/core/satelliteMeanElements.ts` (constants block, line ~42, ~71)
- `packages/astraeus/src/core/bodies/io.ts` (around line 60), `packages/astraeus/src/core/bodies/moonSystem.ts` (line ~96)
- `packages/astraeus/src/api/planTimeline.ts`, `packages/astraeus/src/api/sunOrbit.ts`, `packages/astraeus/src/api/planBodies.ts` (line ~36), `packages/astraeus/src/assets/compositions.ts` (lines 8, 85, 96): constant lines only
- `eslint.config.js`

## Design References

`.savepoint/Design.md` under `Core layers and demos` and under `Orbit maths (O-082)`.

## Guardrails

STYLE-07, ARCH-04 (assets and api import core; core imports nothing above it), DATA-01 (no data value changes), TEST-01, TEST-03.

## Implementation Plan

1. Capture the scene pin hash and run the focused science tests on the base commit.
2. Write `core/constants.ts` and `tests/constants.test.ts`.
3. Replace each copy listed above with an import; keep each expression's operation order.
4. Add the lint rule; plant and remove a slip; time `npm run lint`.
5. Focused tests, then gates.

## Boundaries

Engine `src/` only. Demos, tools and tests keep their own literals (the Apollo tool `tools/apollo11/frames.ts` cannot import engine internals by the deep-import rule). No change to the three TT−UTC models, to orbital-element schemas, or to any stored data. No public export of the constants.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/constants.test.ts packages/astraeus/tests/planetAccuracyFlybys.test.ts packages/astraeus/tests/elementsEpoch.test.ts packages/astraeus/tests/chebyshevEphemeris.test.ts packages/astraeus/tests/core.test.ts packages/astraeus/tests/scenePin.test.ts`. Handoff: `quality_gates` in `.savepoint/config.yml`, with lint time recorded. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

For Design reconciliation (`Core layers and demos`): `core/constants.ts` is the one home of AU, J2000, the Unix-epoch JD and the day length; lint enforces it in engine source.
