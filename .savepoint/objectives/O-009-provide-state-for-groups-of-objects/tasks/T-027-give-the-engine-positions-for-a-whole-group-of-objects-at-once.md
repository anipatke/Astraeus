---
id: T-027
title: Give the engine positions for a whole group of objects at once
objective: O-009
status: done
depends_on: []
owner_validation:
    required: false
    accepted_check: ""
planned_by: {role: planner, session: o009-plan-2026-10-11}
check_waiver:
    task: T-027
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-10T21:17:25Z"
---

# Give the engine positions for a whole group of objects at once

## Outcome

The scientific core can describe a group of many objects and fill all their positions for a moment in one pass. A reusable orbit-based group (base orbit, seeded spread, Earth- or Sun-centred) produces repeatable positions, and the fill cost is measured against the audit's figures.

## Astraeus Hypothesis

- **Capability tested:** scientific State for a population, not one body at a time.
- **Contract reused:** `State` semantics and `createState` (centre, EQJ frame, km, UTC ms), `TimeBounds`, `Provenance`, `CenterId`, the `AstronomyAdapter` boundary to `@lizard-isana/orb`.
- **Gap or hypothesis:** GAP-1. One `Trajectory` per member costs about 9 ms per frame at 10⁴ (audit §3). The hypothesis is that a batch fill into one caller-owned `Float64Array` removes per-member allocation and validation without changing any existing contract.
- **Generic change:** an additive group contract and a generic orbit-based group in `src/core/`, plus adapter functions for two-body propagation and ecliptic-J2000→EQJ element conversion.
- **Perseids-independent evidence:** contract tests with made-up Earth-centred and Sun-centred groups; no meteor naming anywhere.

## User Check

Read the Technical Evidence: same time and seed give identical positions, a different seed differs, and the table shows fill cost at 10³, 10⁴ and 10⁵ next to the audit's numbers.

## Done When

1. Objective SC1: the group contract exists in `src/core/` with member count, centre, frame, optional bounds, provenance, a batch fill into a caller-owned `Float64Array` (length 3 × count, EQJ km), and a single-member read returning a `State` built by `createState`. The single-member State equals the batch values for the same member and time.
2. Objective SC2: the orbit-based group is deterministic. Same time and seed give bit-identical arrays, a different seed gives different arrays, and the seeded random source is local to the group, not `Math.random`. Earth- and Sun-centred variants work, and elements in ecliptic J2000 and in EQJ both give EQJ output.
3. Propagation agrees with the library: member positions with zero spread match the base orbit propagated by the library directly (the test names its tolerance). Out-of-bounds time, wrong array length, non-finite elements and a zero or negative count each fail with a named error.
4. Objective SC3: fill cost measured at 10³, 10⁴ and 10⁵ (Node, the same kind of run as audit §3), recorded with build time and heap. Passes when 10⁴ takes ≤ 8 ms per fill; otherwise the miss and its measured cause are recorded as a finding.
5. `State`, `Trajectory`, `Provenance`, `TimelineEvent`, `ScalePolicy` and `SampledTrajectory` are unchanged, and the existing tests pass unmodified. The public core exposes no library types. The name check covers the new files.

## Context Files

`docs/ASTRAEUS_SPIKE_04_GAP_AUDIT.md`, `.savepoint/objectives/O-009-provide-state-for-groups-of-objects/Objective.md`, `src/core/state.ts`, `src/core/trajectory.ts`, `src/core/provenance.ts`, `src/core/body.ts`, `src/core/astronomyAdapter.ts`, `src/core/referenceCenters.ts`, `src/core/sampledTrajectory.ts`, `tests/core.test.ts`, `tests/sampledTrajectory.test.ts`, `tests/experienceDefinition.test.ts`, `node_modules/@lizard-isana/orb/usage.en.md`, `node_modules/@lizard-isana/orb/package.json`.

## Design References

Design: Architecture, Components/Codebase Map (`src/core/`), Interfaces and Data Flow.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-01, STYLE-02, STYLE-04, STYLE-05, STYLE-06, STYLE-07.

## Implementation Plan

1. Confirm the library's `kepler` module exports (`propagateKepler`, `elementsToState`) and its frame helpers for ecliptic→EQJ. If two-body propagation or the plane conversion is not available, return REPLAN REQUIRED.
2. Define the group contract type and its single-member read in a new core file.
3. Add the adapter functions (propagate a state by Δt about a centre's GM, convert an element plane), keeping library types out of the public core.
4. Build the orbit-based group: base elements, a spread description (for example per-element ranges or standard deviations), seed, count, centre, bounds and provenance. Precompute member initial states once and fill positions per call.
5. Write contract tests with made-up groups (Earth-centred ring, Sun-centred belt) for every Done When case, and extend the name check to the new files.
6. Measure fill cost with a throwaway script in the scratchpad and record the table. Do not commit the script unless it becomes a named test.
7. Run the configured gates.

## Boundaries

No scene, shell or app changes (next Task). No meteor or shower concepts, no perturbations beyond two-body, no changes to existing core contracts, no new dependency.

## Technical Verification

Focused tests while iterating. Handoff runs `npm run typecheck`, `npm run build` and `npm test`. Not scene-affecting, so browser scripts are not required here. Optional Task Check per `agent-skills/references/check-method.md`.

## Technical Evidence

Executor session 2026-10-11 (Sonnet 5.5). This is a claim set for a fresh Check to verify, not clearance.

### Per-criterion outcomes (`tests/orbitGroup.test.ts`, 18 cases, all passing)

1. **SC1, contract.** `src/core/pointGroup.ts` defines `PointGroup`: `id`, `count`, `center`, `frame`, optional `bounds`, `provenance`, `fillPositionsKm(timeUtcMs, out)` (caller-owned `Float64Array`, length 3 x count, EQJ km) and `stateAt(index, timeUtcMs)` returning a `State` built by `createState`. Cases: "declares its identity, centre, frame, bounds and provenance, and reads one member as an ordinary State"; "returns a single member whose position equals the batch values for the same time" (indexes 0, 1, 99, 199, exact equality); "rejects out-of-range member indexes".
2. **SC2, determinism.** Cases: "gives bit-identical arrays for the same time and seed, and across fills of one group" (`Object.is` on every value); "gives different arrays for a different seed"; "does not use Math.random" (spy never called; the random source is a local seeded closure); "works Earth-centred and Sun-centred, with finite EQJ output at the right distance"; "outputs EQJ whether elements are given in the ecliptic or in EQJ" (EQJ-plane flat orbit has z ~ 0; ecliptic-plane flat orbit is perpendicular to the ecliptic pole rotated into EQJ).
3. **Library agreement and errors.** Zero-spread members match `elementsToState` + `propagateKepler` called directly by the test, Earth- and Sun-centred, tolerance 1e-6 km (a nanometre; results are in practice exact because the code path is shared). The ecliptic case matches the library's own `transform` to EQJ, same tolerance. Named errors: `GroupBoundsError` (outside bounds, fill and single read), `GroupBufferError` (length 599 and 603 for count 200), `GroupCountError` (0, -5, 2.5, NaN), `GroupElementsError` (non-finite base, infinite semi-major axis, negative or NaN spread, bad seed, a spread that leaves a bound orbit). Invalid epoch and fill time raise `RangeError` from the existing `assertUtcUnixMs`.
4. **SC3, fill cost: 10^4 BAR MISSED, recorded as a finding.** Throwaway script in the scratchpad (not committed), Node v24.16.0, this machine, median of 50 fills (10 at 10^5) after warm-up, bundled with rolldown:

| Members | Centre | Build | Memory held | Fill median | Audit: N Trajectories (build / heap / per frame) |
|---|---|---|---|---|---|
| 10^3 | Earth | 10 ms | 0.2 MB | 1.2 ms | 9 ms / 3 MB / 1.4 ms |
| 10^4 | Earth | 28 ms | 0.4 MB | 11.2 ms | 46 ms / 29 MB / 9.0 ms |
| 10^5 | Earth | 280 ms | 6.8 MB | 110 ms | 277 ms / 288 MB / 59 ms |
| 10^3 | Sun | 3 ms | 0.3 MB | 0.8 ms | |
| 10^4 | Sun | 20 ms | 2.0 MB | 8.2 ms | |
| 10^5 | Sun | 209 ms | 7.0 MB | 82 ms | |

   **Finding (not hidden):** 10^4 takes 8.2 ms (Sun) to 11.2 ms (Earth) against the 8 ms bar, so the bar is missed for Earth-centred groups and borderline for Sun-centred. Measured cause: calling the library's `propagateKepler` directly on 10^4 pre-built states, with no Astraeus code at all, takes 10.5 ms median. The cost is the library's per-call universal-variable solve and its internal allocation. The group's own overhead is negligible. Also, the audit hypothesis is only half confirmed: memory and build cost fall sharply (0.4 MB vs 29 MB at 10^4; 6.8 MB vs 288 MB at 10^5), but frame cost at 10^5 is higher than the audit's interpolated trajectories (110 vs 59 ms), because propagating an orbit costs more than interpolating four samples. Closing the gap would need either a cheaper propagation (own solver, which the Idea rules out, or a library change) or propagating members less often than every frame. This is an owner/planner decision for O-009 and is not decided here.
5. **Unchanged contracts.** `git status` shows no edits to `state.ts`, `trajectory.ts`, `provenance.ts`, `events.ts`, `scalePolicy.ts`, `sampledTrajectory.ts` or `astronomyAdapter.ts`; the only changed existing source file is `src/types/orb.d.ts` (added declarations for `@lizard-isana/orb/kepler`). Existing tests unmodified. No library types in the new public core (case "returns only plain typed arrays and core values"). Name check: case "covers all three new files and finds no experience, mission or shower naming" (also covers extra words shower, swift, tuttle, radiant); the existing `experiencePlugIn.test.ts` "generic code boundary" case already scans all of `src/core/` and still passes.

### Commands run
- `npm run typecheck`: clean.
- `npm run build`: succeeded (chunk-size warning only, existing).
- `npm test -- --reporter=default`: 13 files, 206 tests passed (including the 18 new).
- Focused: `npx vitest run tests/orbitGroup.test.ts`: 18 passed.
- Measurement: rolldown-bundled throwaway script under `--expose-gc` plus a raw-library timing script; both in the session scratchpad, not committed. Browser scripts not run (not scene-affecting, per Task).

### Files
- **Created:** `src/core/pointGroup.ts`, `src/core/orbitGroup.ts`, `src/core/twoBodyAdapter.ts`, `tests/orbitGroup.test.ts`.
- **Changed:** `src/types/orb.d.ts` (kepler declarations).
- **Read (Context Files):** the audit, Objective, `src/core/state.ts`, `astronomyAdapter.ts`, `referenceCenters.ts`, `provenance.ts`, `body.ts`, `trajectory.ts`, `tests/core.test.ts` (head), `node_modules/@lizard-isana/orb/package.json` and `usage.en.md` (kepler section).
- **Extra reads (not in Context Files), with reason:**
  - `node_modules/@lizard-isana/orb/src/kepler/index.js`: to confirm `propagateKepler`, `elementsToState` signatures and input validation (Plan step 1).
  - `node_modules/@lizard-isana/orb/src/frames/` (grep only): to find the ecliptic-J2000 to EQJ transform (Plan step 1).
  - `src/types/orb.d.ts`: existing type declarations needed to add the kepler module.
  - `tests/experiencePlugIn.test.ts` (top and the name-check case): to see how the existing name check is built.
  - `.savepoint/Guardrails.md` rule lines: to read the named guardrail IDs.
  - `tsconfig.json`: to understand why the library import failed typecheck.

### Limitations
- Bound (elliptic) orbits only; hyperbolic or parabolic members are rejected as `GroupElementsError`.
- Two-body only, stated in the group's provenance notes; no perturbations.
- Spread is a uniform half-width per element; no correlations between elements, no Gaussian option.
- Batch returns positions only (no velocities).
- Performance numbers are from one machine and one Node version, single run set; heap is the measured retained size of the group, not peak.
- Sun-centred placement through centre composition is not part of this Task (next Task).
- 10^4 bar missed (above).

## Drift Notes

Record contract-shape deviations from the Objective here; Design.md is reconciled by T-029.
- Adapter shape: the two-body functions live in a new `TwoBodyAdapter` (`src/core/twoBodyAdapter.ts`) rather than as new methods on `AstronomyAdapter`, so existing adapter implementations and tests are untouched.
- Single-member State uses body id `<group id>:<index>`; `createState` requires a non-empty id and orientation null.
- Spread is a uniform half-width per element, and the group rejects non-bound orbits; both go beyond the Objective wording and should be reflected in Design.md by T-029.
- Fill-cost miss at 10^4 (see Technical Evidence) affects the O-009 Success Condition 3 and needs an owner or planner decision.
