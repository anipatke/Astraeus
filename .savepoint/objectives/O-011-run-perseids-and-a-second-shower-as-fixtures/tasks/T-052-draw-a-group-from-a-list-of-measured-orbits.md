---
id: T-052
title: Draw a group from a list of measured orbits
objective: O-011
status: done
depends_on: [{task: T-051, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o011-replan-i025-2026-10-13}
lane: stream-data
planned_reads: [src/core/pointGroup.ts, src/core/orbitGroup.ts, src/core/twoBodyAdapter.ts, src/core/provenance.ts, src/app/PointsView.ts, src/app/experienceDefinition.ts, tests/orbitGroup.test.ts, tests/pointsLayer.test.ts, docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md]
planned_writes: [src/core/listedOrbitGroup.ts, tests/listedOrbitGroup.test.ts, src/synthetic/syntheticListedDefinition.ts, tools/validate/browser-synthetic-listed.mjs]
---

# Draw a group from a list of measured orbits

## Outcome

A generic `PointGroup` built from a list of per-member orbits, each with its own elements, epoch and source record id, instead of one base orbit with a random spread. Each member's orbit is measured, but its position along that orbit is not (owner decision 2026-10-13, Objective.md "placing measured members"): the group places each member at a deterministic, evenly spread mean anomaly at a stated reference time, marked `illustrative` in provenance, and propagates it by two-body motion about its centre to the requested time, in one batch fill, as fast as the existing orbit group. Each member's `State` carries the record it came from. It is proven on a made-up list and drawn by the existing points layer, with no shower naming.

## Astraeus Hypothesis

- **Capability tested:** that measured populations (meteoroids, asteroids, debris) enter through the existing group contract, so a measured stream needs no shower-specific code.
- **Contract reused:** `PointGroup` (`fillPositionsKm`, `stateAt`), `TwoBodyAdapter.propagateMemberInto`, `Provenance`, `PointsView`.
- **Gap:** `createOrbitGroup` only invents members around one base orbit (`src/core/orbitGroup.ts`, uniform spread).
- **Generic change:** `createListedOrbitGroup({ id, center, plane, members: [{ recordId, epochUtcMs, elements }], phase: { referenceUtcMs, seed?, concentration?: { around: <a Trajectory, e.g. a parent body>, fraction, widthDeg } }, bounds?, provenance })`. Members are validated (finite, bound, `e < 1`), with the rejection rule from the research record. A per-member `recordId` is readable from `stateAt`.

## User Check

None required. The owner may open the made-up listed group and see dots following their own orbits.

## Done When

1. `createListedOrbitGroup` fills positions for every member at a time; each member equals a single-member `createTwoBodyTrajectory` with the same elements and epoch to 1e-6 km (independent oracle); `stateAt(i)` reports `recordId`.
2. Validation names the member and field for non-finite, unbound or hyperbolic elements, empty lists and duplicate record ids.
3. Phase rule (elements carry no anomaly: a, e, i, ω, Ω): members' mean anomalies at the reference time are evenly spread and deterministic; each member's drawn path lies on its own measured ellipse (relative distance from the analytic ellipse < 1e-6 at five times); provenance marks the along-orbit position `illustrative` and the elements measured. The epoch is kept as the record's time, not used to place the dot. With the optional `concentration` (owner decision 2026-10-13, clump near the parent), the stated fraction of members' mean anomalies cluster within `widthDeg` of the reference body's mean anomaly at the reference time (test on a made-up parent: fraction within the width is as stated ± sampling tolerance; the rest stay evenly spread; deterministic), and provenance marks the concentration as a model.
4. Performance: 30,000 members fill in under the frame budget measured by `FrameStats` (record the figure); same input gives bit-identical output.
5. A made-up listed experience (`src/synthetic/`) mounts with the points layer; `browser-synthetic-listed.mjs` passes at 1280×800 and 390×844 with zero console errors; the name check passes.
6. Gates pass; every browser script passes in a fresh run directory.

## Context Files

`src/core/pointGroup.ts`, `src/core/orbitGroup.ts`, `src/core/twoBodyAdapter.ts`, `src/core/sunCentredSources.ts`, `src/core/provenance.ts`, `src/app/PointsView.ts`, `src/app/experienceDefinition.ts`, `src/synthetic/syntheticRingDefinition.ts`, `tests/orbitGroup.test.ts`, `tests/pointsLayer.test.ts`, `tools/validate/browser-synthetic-ring.mjs`.

## Design References

Design: Interfaces and Data Flow (groups and the points layer); Guardrails ARCH-03.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, PROV-01, TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-07.

## Implementation Plan

1. Confirm the group contract and `TwoBodyAdapter` batch path; REPLAN REQUIRED if per-member epochs need a contract change.
2. Write `createListedOrbitGroup` beside `createOrbitGroup`, sharing the propagation helper.
3. Tests per Done When, with single-member trajectories as the oracle.
4. A made-up listed fixture and its browser script; run gates and every browser script.

## Boundaries

No real CAMS data here (T-038 loads it). No change to `createOrbitGroup`'s behaviour or to `State`.

## Technical Verification

Focused tests, then the configured gates and every browser script in a fresh run directory. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor: builder session, 2026-10-15 (started 2026-10-15T07:59:49Z, handoff 2026-10-15T08:33Z). Not a Check; not CLEAR.

### Design as built

`createListedOrbitGroup(input, adapter)` in `src/core/listedOrbitGroup.ts`. Members are `{ recordId, epochUtcMs, elements: {a, e, i, raan, argPeriapsis} }`. No contract change was needed for per-member epochs: the epoch is the record's time and does not place the dot, so every member's initial state is built at `phase.referenceUtcMs` and propagated by the unchanged `TwoBodyAdapter.propagateMemberInto` (REPLAN not triggered). Mean anomalies: a seeded shuffle (mulberry32, default seed 0) deals evenly spaced slots (k + 0.5)/n of 360 degrees; with `concentration`, the first round(fraction n) of the shuffle sit evenly across +/- widthDeg about the reference body's mean anomaly (read from `around.stateAt(referenceUtcMs, center)`, velocity by a +/-1000 s central difference when the State has none, mu probed from the adapter) and the rest spread evenly round the whole orbit. Mean anomaly goes to true anomaly by Newton on Kepler's equation. Provenance is always `illustrative`; accuracy states the elements are "as listed (<input sourceType>)" and the position along each orbit is illustrative; notes add the concentration as "a model, not a measurement". State body is `<group id>:<recordId>`; `recordIdAt(i)` and `meanAnomalyDegAt(i)` are extra readers.

### Per Done When

1. PASS. Test "puts every member where a single-member two-body trajectory ... 1e-6 km": 60 members, 4 times (reference, +37 d, -200 d, +1500 d), oracle is `createTwoBodyTrajectory` with the same elements and an independent bisection Kepler solve. Sun-centred tolerance is max(1e-6 km, 1e-13 x |r|): the anomaly solve agrees to about 4e-14 rad for e up to 0.95 (measured worst difference 4.4e-14 rad), which times a 7e7 km distance exceeds 1e-6 km (observed 3.5e-6 km), so the literal 1e-6 km is not reachable at Sun scale in double precision. A second test about a planet (40 members, a 8,000 to 28,000 km) holds the plain 1e-6 km. `stateAt(i).body` is `listed-test:rec-7`; batch equals `stateAt` positions exactly.
2. PASS. Tests name member index and record id and the field for non-finite (all five elements, NaN and Infinity), e < 1 / e < 0 / a <= 0 (the rejection rule from the research record: e >= 1 rows are dropped by the loader, here they throw), inclination outside 0..180, bad epoch, blank record id, duplicate record id (`GroupElementsError`), and an empty list (`GroupCountError`). Bad phase (seed, fraction, widthDeg) also named.
3. PASS. 400 made-up members: sorted mean anomalies equal (k+0.5)/400 x 360 to 9 decimals; identical across two builds; different seed gives a different dealing; list neighbours are not orbit neighbours. Ellipse test: 400 members x 5 times (0, +11 d, +160 d, -420 d, +3000 d), orbit-plane residual of ((x+ae)/a, y/b) against 1 and out-of-plane z/a both < 1e-6. Provenance test: sourceType illustrative, sources kept, accuracy/notes state elements-as-listed and illustrative position; epoch shift of +123 days changes no position. Concentration (made-up parent, epoch 700 days before reference, expected mean anomaly computed independently from the epoch true anomaly plus mean motion): 2,000 members, fraction 0.3, width 12 deg: share inside the window within 0.01 of 0.3 + 0.7 x 24/360, at least 600 inside, clump centred within 1 deg, rest evenly spread; deterministic; provenance adds "model, not a measurement"; all members stay between perihelion and aphelion distance (no orbit invented); fraction 0 equals the plain spread, fraction 1 puts all within the width.
4. PASS. 30,000 members, best of 5 fills (`FrameStats` reset and ticked either side of each fill): listed 5.62, 5.74, 5.79 ms across three runs (and 5.77 ms in the first run) against the 33.4 ms `FRAME_BUDGET_MS`; the existing `createOrbitGroup` at 30,000 measured 5.09 to 7.73 ms in the same runs, so the listed fill is as fast (asserted < 1.5x). Bit-identical: two separately built groups, fill at +400 d, all 720,000 bytes equal; mean anomalies at four indices equal. (Software timing on this machine: relative evidence.)
5. PASS. `src/synthetic/syntheticListedDefinition.ts`: 3,000 invented orbits, Sun-centred, with a made-up parent (clump fraction 0.25, width 15 deg), the Sun, Earth's path and the parent's path; mounted as `?experience=synthetic-listed` (one-line addition to `src/main.tsx`). Look-and-feel numbers (dot colour, point size, refill span, clump fraction/width) are exported settings (`LISTED_LOOK`, `LISTED_REFILL_AFTER_MS`, `LISTED_CLUMP`), per the owner preference; `PointsView` was not touched. `browser-synthetic-listed.mjs` passes at 1280x800 and 390x844 with zero console errors: dot pixels on canvas desktop 8,222 (True) / 8,182 (Readable), phone 864 / 850; panel states made up, position along each orbit illustrative, clump a model, parts missing not shown; information identical under True and Readable; no meteor/shower/Perseid/Geminid/Apollo/Columbia text in the page; Apollo remains the default. Unit tests in `tests/listedOrbitGroup.test.ts` mount it through `groupsOf`, `experienceWithGroups`, `PointsView` (True scale), the shell markup, and check names. `tests/nameCheck.test.ts` passes (no shower naming in `src/core` or `src/synthetic`).
6. PASS (see commands).

### Commands run

- `npm run typecheck`: pass, no output errors.
- `npm run build`: pass (existing chunk-size warning only).
- `npm test`: 33 files, 613 tests passed (`tests/listedOrbitGroup.test.ts` contributes 20 of them).
- Own vite on port 5199 (stopped afterwards; :5301 and :5302 untouched). Browser scripts, each with `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_EVIDENCE_DIR=docs/evidence/o011-t052-20261015T080645Z/<script>`: browser-synthetic-listed (run first, writes screenshots straight into the run directory: 1280x800 and `phone-` 390x844), then browser-earth-moon, browser-jupiter-io, browser-lighting, browser-precision, browser-shell, browser-showers, browser-sky, browser-spike02, browser-spike03, browser-synthetic, browser-synthetic-belt, browser-synthetic-ring, capture-apollo-compare: all exit 0, `errors` empty (browser-sky reports `"errors": 0`). Window 2026-10-15T08:06Z to 08:32Z; logs are `docs/evidence/o011-t052-20261015T080645Z/<script>.log`.
- Not run: `browser-anchor-labels.mjs` (per instruction; it overwrites `docs/evidence/regression-spike01-02`), `diff-screenshots.mjs` (a comparison utility with its own arguments, not an app scenario), `anchor-consistency.mjs` (not a browser script). `docs/evidence/regression-spike01-02` unchanged (`git status` clean for it); no earlier evidence directory was written to.

### Files

Changed: `src/core/orbitGroup.ts` (only added `export` to `seededRandom` and `rotateInto`; behaviour unchanged, its tests pass), `src/main.tsx` (registers `synthetic-listed`). New: `src/core/listedOrbitGroup.ts`, `src/synthetic/syntheticListedDefinition.ts`, `tests/listedOrbitGroup.test.ts`, `tools/validate/browser-synthetic-listed.mjs`, `docs/evidence/o011-t052-20261015T080645Z/`.

### Extra reads

None outside the Context Files, except the Objective's two owner-decision sections, `docs/ASTRAEUS_SPIKE_04_STREAM_AND_SKY_DATA.md` lines 30-75 (rejection rule; Task planned_reads), `src/core/state.ts`, `src/core/trajectory.ts`, `tests/nameCheck.test.ts`, `tests/syntheticRing.test.ts`, `src/app/frameStats.ts` and `src/main.tsx` (how definitions mount, name rules, frame budget), `src/assets/compositions.ts` by import only, and `node_modules/@lizard-isana/orb/src/kepler/index.js` (GM table, to build an independent oracle).

### Limitations

- Sun-scale oracle tolerance is relative (see DW1), not the literal 1e-6 km.
- The concentration clump is evenly spaced across the window (deterministic), not random; the window is +/- widthDeg, uniform. Its size and fraction are fixture settings, not cited from literature (the CAMS-based fixture must cite or state illustrative defaults).
- The parent's mean anomaly uses the parent's own orbit; members with different orbits sit at the same mean anomaly, not the same place. Parent velocity is a central difference when the State has none; mu is probed from `elementsToState` (a circular orbit gives v^2 r = mu) because the adapter exposes no mu.
- Frame timing is software-rendered Node timing; browser dot-pixel counts are relative evidence. Headless evidence is not owner visual judgement.

## Drift Notes

- Architecture delta for T-040: a new generic group, `createListedOrbitGroup` (`src/core/listedOrbitGroup.ts`), beside `createOrbitGroup`; it implements `PointGroup` with extras `recordIdAt` / `meanAnomalyDegAt`, uses the unchanged `TwoBodyAdapter`, and states every member's State body as `<group id>:<recordId>`. The phase rule (even mean-anomaly spread at a reference time, optional model concentration) is a Design-level decision from the owner (2026-10-13). Deferred to T-040: add to Design.md Components / Interfaces.
- `TwoBodyAdapter` exposes no gravitational parameter; mu is probed through `elementsToState`. If the owner or T-040 prefers an explicit accessor, that is a small adapter change (non-breaking) for a later Task; not architectural otherwise.
- `src/main.tsx` and `src/core/orbitGroup.ts` were touched though not in `planned_writes` (one registry line; two `export` keywords).

## Done

Task Check C-029 CLEAR, 2026-10-15T08:37Z. No owner look required. `status: done` set by the O-011 orchestrator under the owner's delegation in chat ("You may mark a task Done after a satisfactory check, except tasks that need my look"), actor {role: owner-delegate, session: o011-orchestrator-check-20261013}.
