---
id: C-015
scope: {kind: task, id: T-042}
result: CLEAR
checked_by: {role: checker, session: o014-orchestrator-check-20261011}
executed_session: o014-t042-sonnet-executor-20261011
checked_at: '2026-10-11T09:45:28Z'
reviewed:
  base_commit: 8fc6fce
  head_commit: 8fc6fce
  files:
    - src/core/body.ts
    - src/core/state.ts
    - src/core/stateResolver.ts
    - src/core/bodies/sun.ts
    - src/core/bodies/earth.ts
    - src/core/bodies/moon.ts
    - src/core/bodies/index.ts
    - src/core/sunCentredSources.ts
    - src/core/twoBodyAdapter.ts
    - src/app/ephemerisProvenance.ts
    - tests/stateResolver.test.ts
    - tests/layerRule.test.ts
    - tests/sampledTrajectory.test.ts
  dependencies: []
issues: [I-020]
supersedes: null
---

# C-015: T-042 Task Check (Quick, mandatory per owner decision)

Independence: this checker session is the orchestrating session; T-042 was built by a separate Sonnet executor sub-session. The checker wrote no implementation.

## Scope Lock

1. Done When 1–7 of T-042; Guardrails ARCH-01..05, PROV-01, TEST-01, TEST-03; STYLE review.
2. Changed files listed in `reviewed.files` (uncommitted working-tree diff over 8fc6fce).
3. Out of scope: scene, assets, experiences (later Tasks); the Moon's Sun branch stays.

## Outcome Coverage

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Definitions SUN/EARTH/MOON with radius, parent, GM, orientation, accuracy (incl. 254 km / 8.4° offset, no-libration); Earth/Moon bound, Sun not; old constants re-exported | Proven | `src/core/bodies/*.ts`; `BUILT_IN_BINDINGS` has earth, moon only; `src/core/body.ts` re-exports; typecheck/build pass with existing imports |
| 2 | Resolver rejections, chain composition, zero self-state, exact negation, memo | Proven | `tests/stateResolver.test.ts` cases at lines 142–221; independent probe below |
| 3 | Self-centre rule only at exact zero; orientation rule from definitions | Proven | `src/core/state.ts` diff; probe: `1e-300` position and `1e-12` velocity rejected, `-0` accepted (exactly zero) |
| 4 | Moon-from-Sun = `MoonTrajectory.stateAt(t,"sun")` ≤1e-9 km at archived dates; Earth/Sun exact; Sun branch kept | Proven | `tests/stateResolver.test.ts:51`, `:64`; `src/core/moonTrajectory.ts` unchanged |
| 5 | Layer-rule test (ARCH-04) | Proven | `tests/layerRule.test.ts:24` plus self-test `:36` that it catches an upward import from a subfolder |
| 6 | Two-body about any centre with GM, rejects without; belt/Perseids unchanged | Proven | `tests/stateResolver.test.ts:221`, `:232`; probe: geostationary orbit about Earth keeps 42164 km radius, foreign centre rejected, GM-less centre rejected |
| 7 | Gates pass; every existing browser script passes in fresh run dir | Proven for T-042's change, with one pre-existing failure recorded as I-020 | Gates re-run by checker (below). Executor browser run: 7 of 8 scripts pass with zero console errors; `browser-synthetic-belt.mjs` fails `desktop/True: Earth's path is drawn (16)` identically at HEAD 8fc6fce. T-042 changes only `src/core/` and the belt's unit outputs are unchanged, so the failure fails the Issue admission test for this Task (not introduced or touched here). It is routed to T-045, which owns path drawing and that script, as I-020. |

## Independent Probes (checker harness, deleted after the run)

A throwaway vitest file (`tests/_probe/t042probe.test.ts`, 5 cases, all passed, then removed):

- Round trip `moon←sun − earth←sun = moon←earth` within 1e-6 km at 2024-08-12T03Z; `earth←moon` is the exact negation of `moon←earth`; Sun self-state zero with null orientation; Moon orientation carried unchanged through composition.
- Fake five-body tree with a sibling branch (r→a→{b→c, s}): `c←s = [-10,2,3]`, `s←c` its negation, `r←c = [-1,-2,-3]`, `offsetKm(c, r) = [1,2,3]` — common-ancestor path not just the linear chain.
- Rejections: duplicate id, missing binding, root binding, two roots, parent cycle, unknown parent, unknown body, unknown centre, NaN time.
- Self-centre boundaries as in criterion 3; `createState` still rejects an oriented body with null orientation.
- Two-body about Earth (geostationary elements), wrong-centre request and GM-less centre.

## Gates (checker, 2026-10-11T09:44Z)

- `npm run typecheck` — exit 0
- `npm run build` — exit 0
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` — 21 files, 401 tests passed
- `git diff --check` — clean

## Guardrails

ARCH-01 (no experience names in core; "Apollo" reworded out of `moon.ts`), ARCH-02 (State independent of presentation; no presentation code touched), ARCH-03 (fake chain tests), ARCH-04 (layer-rule test; `ephemerisProvenance` moved down into core with an app re-export), ARCH-05 (one definition per body), PROV-01 (accuracy records carry provenance and limitations), TEST-01/TEST-03 (named tests) — satisfied.

## Issues

- I-020 — pre-existing belt-script failure, routed to T-045. Not a T-042 blocker (fails the admission test: not introduced or touched by this Task). Materiality for O-014: Medium likelihood/Medium impact; recommendation: fix in T-045, must be green before the Full Objective Check.

No materiality actions are required for T-042 itself.

## Observations (non-blocking)

1. `stateOf` drops velocity: composed States carry position only. No catalogued provider supplies velocity today (Earth–Sun and Moon have none), so nothing is lost now; a future provider with velocity would need composition of velocity too. Worth a note for T-048 (planets) and T-050's Design reconciliation.
2. The Moon's `validUtc` is the sampled 2022–2025 range, so Apollo (1969) is outside it; nothing reads `validUtc` yet. Drift note 5 records this for T-050.
3. Two writes outside `planned_writes` (`src/app/ephemerisProvenance.ts`, `tests/sampledTrajectory.test.ts`) are justified in the Task evidence; manifests are advisory.

## Owner Validation Still Needed

None (User Check: none required).

## Closure

CLEAR. Dependants requiring `clear` (T-043, T-046) may start. The owner authorised the orchestrator on 2026-10-11 (chat instruction: "I authorise you to move tasks to Done once you have checked and are satisfied") to set `status: done` after a satisfactory Check; that is recorded on the Task as an owner-delegated decision.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
