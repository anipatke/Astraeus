---
id: T-351
title: Keep velocity when a state is measured from another body
objective: O-083
status: done
depends_on: []
check_waiver: {task: T-351, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:22:41Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: science
planned_reads: [packages/astraeus/src/core/state.ts, packages/astraeus/src/core/body.ts, packages/astraeus/src/core/astronomyAdapter.ts, packages/astraeus/tests/stateResolver.test.ts]
planned_writes: [packages/astraeus/src/core/stateResolver.ts, packages/astraeus/src/core/referenceCenters.ts, packages/astraeus/tests/composedVelocity.test.ts]
---

# Keep velocity when a state is measured from another body

## Outcome

When the state resolver measures a body from a centre other than its own parent (walking up and down the parent chain), the result carries `velocityKmS` whenever every leg of the chain has one, composed exactly like the position; if any leg lacks velocity the result has none, as today (AH-06; Gemini SCI-01).

## User Check

None visual. `resolver.stateOf("io", t, "jupiter")` (fitted moon data loaded) has a velocity equal to Io's own state source's; a moon measured from the Sun through a planet with no velocity still has none.

## Done When

- `composeCenteredPositions` and `inverseCenteredPosition` (`core/referenceCenters.ts`) carry velocity: summed when both inputs have it, negated on inversion, absent when either input lacks it.
- `stateResolver.stateOf` passes the composed `velocityKmS` (when present) to `createState`; the `body === center` case is unchanged (planner decision: no velocity invented for "at rest about itself").
- New `tests/composedVelocity.test.ts`, on a synthetic catalogue (ARCH-03) with providers that all give velocity and one that does not: body from its parent (velocity = native); body from a grandparent (sum); body from a sibling (difference through the common ancestor); centre from body (negated); any leg without velocity → none. Plus one built-in row: Io about Jupiter equals the fitted source's velocity. Show the sum/sibling rows failing first.
- Existing tests unchanged and green, including `stateResolver`, `sceneTransforms`, `twoViewers` and the Horizons planet tests.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/referenceCenters.ts` (`composeCenteredPositions`, `inverseCenteredPosition`)
- `packages/astraeus/src/core/stateResolver.ts` (around `upTo`, `stateOf`, lines ~105–135)
- `packages/astraeus/src/core/state.ts` (`CenteredPosition`, `createCenteredPosition`, `createState`)
- `packages/astraeus/tests/stateResolver.test.ts` (its synthetic catalogue helper `fake`, to copy the pattern)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`: `Core layers and demos` (state resolver paragraph).

## Guardrails

ARCH-02, ARCH-03, ARCH-04, STYLE-07, TEST-01..04.

## Implementation Plan

1. Write `composedVelocity.test.ts`; show it failing.
2. Carry velocity through the two composition helpers; pass it in `stateOf`.
3. Focused tests, then gates.

## Boundaries

No velocity added to sources that lack it (planets, Earth, the Moon, elements bodies stay position-only; the adapter's discarded analytical velocities are out of scope). No change to positions or orientation. `Scene.stateOf`'s doc comment is updated by the docs Task.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/composedVelocity.test.ts packages/astraeus/tests/stateResolver.test.ts packages/astraeus/tests/sceneTransforms.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

| Done When | Evidence |
|---|---|
| Composition helpers carry velocity (sum, negate, absent if either lacks) | `referenceCenters.ts`: `combineVelocity`, `velocityField`; `composedVelocity.test.ts` sum, sibling, negation and missing-leg cases |
| `stateOf` passes composed velocity; `body === center` unchanged | `stateResolver.ts` createState call; test "none for a body about itself" |
| New synthetic-catalogue test, oracle = central finite difference of the resolver's own positions (quadratic motions, so exact) plus analytic provider derivative; Io about Jupiter row | `tests/composedVelocity.test.ts` (6 tests); Io checked against finite difference of positions and 15-20 km/s speed band; Io from the Sun has none. Shown failing first: all 6 failed before the change (stateOf dropped velocity entirely), all pass after |
| Existing tests unchanged and green | focused run: composedVelocity + stateResolver + sceneTransforms, 54 passed |
| Gates | lint, typecheck, build clean. Full `npm test`: 4937 passed, 3 failed, all in T-343's files (scenePin.test.ts, apiRules.test.ts errors rule, apiSurface.test.ts lock); rerun gave the same 3. Not related to this change. |

Files changed: `src/core/referenceCenters.ts`, `src/core/stateResolver.ts`, `tests/composedVelocity.test.ts`.
Limitations: planets/Earth/Moon/elements bodies stay position-only, so most composed states from the Sun still have no velocity.
No extra reads.

## Drift Notes

Record for Design reconciliation: the resolver composes velocity when every leg has it (implemented; nothing further).

Coordinator (orchestrate-g024-20261121): hand-off gates green for this Task's files (lint, typecheck, build; `npm test` failures only in T-343's in-flight files); `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
