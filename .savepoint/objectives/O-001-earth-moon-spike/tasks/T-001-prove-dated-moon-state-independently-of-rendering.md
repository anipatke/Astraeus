---
id: T-001
title: Prove dated Moon state independently of rendering
objective: O-001
status: done
depends_on: []
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: astraeus-spike-01-planning-2026-10-05}
check_waiver:
    task: T-001
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-05T20:47:30Z"
---

# Prove dated Moon state independently of rendering

## Outcome

A framework-independent TypeScript core supplies dated Earth/Moon orientation and Earth/Moon/Sun positions in explicit centers, with a documented astronomy-provider decision and independent scale policies before donor rendering changes.

## User Check

Inspect the exported core and automated evidence: the same timestamp produces the same kilometre position under different rates and scale modes; the chosen library and reference-fixture accuracy are documented.

## Done When

1. Clock exposes time/play/pause/seek/rate with absolute UTC Unix milliseconds and an injected monotonic time source. Pause freezes time, backward/forward seek is deterministic, rate changes preserve continuity, invalid input fails at the boundary, and elapsed-time results do not depend on frame schedules.
2. Physical Body, explicit readonly State, minimal Trajectory and pure ScalePolicy exist without React/Three.js/provider types or presentation metadata. Positions are owned Float64Array kilometre snapshots; optional velocity uses velocityKmS. State includes normalized body-to-EQJ quaternion orientation and explicit time/frame/center. Source radii/units and document axes, quaternion convention and typed-array ownership; rendering conversion stays outside state.
3. Before custom time/frame/propagation maths, evaluate current orb.js 3.x and Astronomy Engine through primary documentation/source for time, Earth/Moon positions, frames/transforms, Kepler propagation, state vectors, Sun geometry and orientation support. Produce a capability/limitations matrix and provider/conversion decision in docs/ASTRONOMY_VALIDATION.md. Pin the useful provider(s), retain notices and hide them behind Astraeus adapters. If orb.js is unsuitable, document why; do not force integration or expose its API.
4. Offline trusted geometric EQJ Moon fixtures cover several phases/distances within a month and dates in different years, with raw source data, query parameters, timescale conversion, retrieval time and ephemeris identity recorded. Meet O-001's angular/distance targets or return a material discrepancy for replanning; do not silently relax tolerances.
5. Tests establish repeatability, nonconstant distance, plausible mean distance and approximate sidereal recurrence with independently justified tolerances; rate never changes the solution at the same timestamp. TrueScale/ReadableScale tests establish unchanged scientific state including orientation, TrueScale physical ratios, initial readable distance factor 0.1 and identical radius mapping. Policy implementations remain replaceable.
6. Minimal single-application TypeScript/Vite/Vitest setup is reproducible with pinned dependencies/lockfile. Configure project-owned build, typecheck and test gates in .savepoint/config.yml and run them before handoff. Do not add publishing/monorepo/framework infrastructure.

7. Earth orientation follows absolute timestamp, sourced axial orientation and rotation rate; Moon orientation approximately locks its documented near-side axis toward Earth with a stable pole basis. Tests verify unit quaternions, rotation at independently justified epochs/intervals and locking across dates; no arbitrary visual spin.
8. Represent Moon/Earth, Earth/Sun and Moon/Sun in EQJ via same-time vector composition without redefining bodies. Tests verify composition, inverse centers and rejection of mismatched frames/times. Minimal Sun geometry supplies physical body-to-Sun directions and geometric lunar illuminated fraction, checked against independent solar/phase reference dates with explicit approximate tolerances.

## Context Files

Existing: `.savepoint/config.yml`, `.savepoint/Design.md`, `docs/ASTRAEUS_SPIKE_01_ADDENDUM.md`, `/home/user/code/planetary-explorer/package.json`.

Planned new outputs (not existing read prerequisites): `.gitignore`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts` (minimal build entry), `src/types/orb.d.ts`, `src/core/clock.ts`, `src/core/body.ts`, `src/core/state.ts`, `src/core/trajectory.ts`, `src/core/moonTrajectory.ts`, `src/core/scalePolicy.ts`, `src/core/astronomyAdapter.ts`, `src/core/referenceCenters.ts`, `src/core/bodyOrientation.ts`, `src/core/illumination.ts`, `tests/orientationIllumination.test.ts`, `tests/core.test.ts`, `tests/fixtures/moon-horizons.json`, `tests/fixtures/moon-horizons-source.txt`, `tests/fixtures/sun-horizons.json`, `tests/fixtures/sun-horizons-source.txt`, `tests/fixtures/usno-moon-phases-2024.json`, `licenses/orbjs-MIT.txt`, `licenses/ERFA.txt`, `licenses/python-sgp4.txt`, `docs/ASTRONOMY_VALIDATION.md`.

External evidence: current orb.js 3.x primary documentation/source, Astronomy Engine primary documentation, JPL Horizons documentation/data and independent orientation/solar/phase sources needed by the Objective. Log exact versions/URLs used. Log any necessary extra local reads before reading.

## Design References

Owning Objective: Confirmed core contracts, Astronomy choice and accuracy, Scene integration, Verification and handoff, and Discovered risks. Planned changes remain in the Objective until implementation is reconciled into Design.

## Guardrails

SEC-01, TEST-01, TEST-02, TEST-03, TEST-04 and STYLE-01 through STYLE-10. Existing scaffold rules outside this work do not introduce authentication or unrelated infrastructure requirements.

## Implementation Plan

1. Confirm setup assumptions and required dependency availability; keep the donor read-only.
2. Complete bounded provider research first: deliver capability matrix, chosen adapter and explicit time/frame/unit/orientation recipe. Return REPLAN REQUIRED if the required science cannot be supplied within scope; do not invent lunar theory.
3. Establish the minimal project setup and configured gates.
4. Implement the small core contracts, adapter, center composition, scientific Earth/Moon orientation and minimal Sun illumination geometry, with sourced constants and explicit validation.
5. Acquire independent fixtures, archive provenance and implement meaningful deterministic tests.
6. Run configured gates and record per-criterion evidence; reconcile implemented core into Design.

## Boundaries

No donor visual adaptation yet, homemade lunar theory, runtime Horizons adapter, velocity unless needed, speculative abstractions or package publishing. Do not initialise a Git repository merely to satisfy a commit instruction; record the current setup limitation.

## Technical Verification

Fake-time clock tests; same-time orbit/scale invariance; trusted fixture comparisons; monthly distance and recurrence evidence; center composition, scientific orientation and independently sourced Sun/phase sanity checks. Run configured build, typecheck and test gates at handoff. No browser appearance claim in this Task.

## Technical Evidence

Execution evidence recorded 2026-10-05 20:37:16 UTC. Toolchain: Node v22.22.2, npm 10.9.7, `@lizard-isana/orb` 3.1.1, TypeScript 7.0.2, Vite 8.3.2 and Vitest 5.0.3. Provider lockfile integrity is recorded in `package-lock.json` and `docs/ASTRONOMY_VALIDATION.md`.

1. **PASS — absolute clock.** `SimulationClock` uses integer UTC Unix milliseconds and an injected monotonic source. Named cases: `pauses, seeks in either direction, and preserves continuity when the rate changes`; `returns the same elapsed time under different observation schedules`; `rejects invalid UTC times, rates, and a regressing monotonic source` in `tests/core.test.ts`. Covers pause freeze, backward/forward seek, continuous rate change including reverse playback, schedule independence, invalid/out-of-range timestamps and monotonic regression. Provider calls take only the requested absolute timestamp.
2. **PASS — framework-independent contracts.** `Body`, `State`, `CenteredPosition`, `Trajectory` and pure scale policies are in `src/core/`. State uses owned Float64 kilometre snapshots, optional km/s velocity, explicit EQJ/time/center, and normalized `[x,y,z,w]` body-to-EQJ quaternions for Earth/Moon. Runtime guards reject unknown frame use and malformed vectors. No React, Three.js or presentation imports exist under `src/core/`; scale conversion returns fresh arrays. `docs/ASTRONOMY_VALIDATION.md` records radii sources, units, axes, quaternion and buffer ownership.
3. **PASS — provider decision before custom orbit/frame code.** `docs/ASTRONOMY_VALIDATION.md` contains the Orb 3.1.1 versus Astronomy Engine 2.1.19 capability/limitations matrix, exact Orb package integrity, adapter conversion recipe, model/time/frame limitations and notices. `src/core/astronomyAdapter.ts` is the sole Orb boundary. Only Orb is pinned because it supplies the measured lunar path, explicit transforms, Earth orientation and EPV00 Sun geometry without a second dependency. Orb, ERFA and bundled Python-SGP4 notices are retained in `licenses/`.
4. **PASS — independent position fixtures.** Eight geometric DE441 JPL Horizons Moon vectors across 2022, January 2024 and 2025 are archived in `tests/fixtures/moon-horizons-source.txt` and normalized in `moon-horizons.json`; equivalent Sun target-10 data are in the `sun-horizons-*` files. Both raw responses identify UTC labels, ICRF, Earth center, km-s, geometric position-only output and DE441. Query settings, timescale conversion and response retrieval times are recorded in fixture metadata and the astronomy validation note. `matches offline geometric JPL Moon vectors within the unchanged targets` passes ≤2 arcmin/≤100 km; measured maxima are 0.0708144 arcmin and 6.38534 km. The Sun comparison passes the documented ≤1 arcmin/≤100 km target; measured maxima are 0.00752872 arcsec and 1.37303 km. Tests require no network.
5. **PASS — repeatability, recurrence and scale independence.** `has changing lunar distance, a plausible monthly mean, and approximate sidereal recurrence` checks varying distance, plausible monthly mean and the documented 0.6°/1,500 km approximate recurrence limits; measured recurrence is 0.294954° and 655.927 km after 27.321659606 days. `keeps same-time science fixed when playback rates differ` and `returns owned Float64 snapshots and leaves scientific state unchanged across scales` cover same-time results, TrueScale ratios, ReadableScale's 0.1 distance factor, identical radii and unchanged orientation/state.
6. **PASS — reproducible minimal project and configured gates.** Exact dependency versions and lockfile are present. `.savepoint/config.yml` defines `npm run typecheck`, `npm run build` and `npm test`; lint remains unconfigured. All configured gates passed at 2026-10-05 20:37:15 UTC: `npm run typecheck` (exit 0), `npm run build` (Vite production build, exit 0) and `npm test` (2 files, 15 tests passed). `npm ls --depth=0` resolved the four exact pins; `npm install` reported zero vulnerabilities. `git diff --check` passed. No publishing, monorepo or app framework was added.
7. **PASS — scientific orientation.** Earth uses Orb's date-dependent ECEF→EQJ transform (IAU 2006 precession, IAU 2000B nutation, IAU 1982 GMST); its DUT1=0 and polar-motion limits are stated. `uses a normalized date-based Earth-fixed-to-EQJ orientation with sidereal daily motion` checks normalized quaternions and about 0.985647° inertial prime-meridian advance per 24 UTC hours from the independent sidereal-day ratio. Moon orientation uses the Earth-facing +X axis and local plane normal estimated from dated Moon positions ±30 minutes; `keeps the Moon's body +X near-side axis Earth-facing and its +Z pole on the local orbit normal` checks five dates across the fixture range. No visual spin or libration is claimed.
8. **PASS — explicit centers and solar geometry.** `composes explicit centers, preserves body identity, and rejects mixed epochs or frames` verifies Moon/Earth + Earth/Sun = Moon/Sun, inverse vectors, center identities and mismatch rejection. `matches USNO new, quarter and full Moon event fractions within one percent` checks archived 2024 USNO phases with 0.01 absolute tolerance; measured fractions are 0.501443 (last quarter), 0.001911 (new), 0.501177 (first quarter) and 0.998254 (full). `provides normalized physical body-to-Sun directions independent of scale` checks Earth and Moon vectors. Illumination rejects time, frame and center mismatches.

Read/changed-file evidence: implemented only the planned project setup, `src/core/`, build entry and types, T-001 tests/fixtures/licenses, `.savepoint/config.yml`, `.savepoint/router.md`, this Task record, `.savepoint/Design.md`, and `docs/ASTRONOMY_VALIDATION.md`. Router selection remains O-001/T-001 with `release: G-001` preserved from the owner's pasted Next selection. Extra local reads: `.savepoint/Guardrails.md` to apply the Task's referenced rules; `find tests/fixtures -maxdepth 1 -type f -print` to confirm the fixture directory before adding outputs. The Task's listed Context Files and focused Orb package sources were read as planned. The donor checkout was not changed. `docs/ASTRAEUS_SPIKE_01.md` adoption/rejection summary, rendering and floating origin, controls, integrated validation, and browser appearance remain with later Tasks.

Since the recorded final gates, only this Task's stage/evidence chronology changed; code, tests, fixtures, dependencies and gate definitions are unchanged.

No Task Check or owner waiver is recorded. Task remains `status: in_progress`; stage is `audit` and ready for the independent Task Check/owner decision. This evidence does not mark the Task done or close O-001.

## Drift Notes

Record implementation deltas and reconcile Design before the independent Full Objective Check. Return REPLAN REQUIRED for a material design gap.

## Owner Architecture Addendum — 2026-10-06

Owner revised the existing Spike 01 scope; continue the same Objective and Tasks, preserve working implementation, and make only the smallest changes needed. Canonical addendum: `docs/ASTRAEUS_SPIKE_01_ADDENDUM.md`.

REPLAN REQUIRED: the confirmed Objective excludes physical Sun illumination, fixes State to Earth-centered Moon positions, and places locking in application orientation code. Those decisions conflict with the owner's revised scope. Preserve status `in_progress` and stage `build`; revise the existing plan before execution. No Task is completed, no Check or waiver is recorded.

Extra reads: repository file listing and git status to establish whether existing implementation is present; owning Objective to identify conflicting contracts. New output: `docs/ASTRAEUS_SPIKE_01_ADDENDUM.md`, recording the owner's addendum for the planner. No scientific implementation, dependency evaluation, or gate execution is claimed. Configured gates remain null. The tracked checkout contains README.md and Savepoint planning artifacts, with no existing src/package setup found by the scoped file listing.

Planner handoff: fold the addendum into the existing four Tasks rather than restarting or allocating replacement Tasks. Prioritize floating origin as a separate rendering layer and quaternion orientation plus Sun illumination derived from scientific state. Evaluate current orb.js 3.x from primary sources before selecting astronomy implementation. Retain independent fixture validation and the original accuracy targets unless the owner explicitly revises them. At implementation completion, document adoption/rejection reasons and architecture consequences in `docs/ASTRAEUS_SPIKE_01.md`.

## Replan Resolution — 2026-10-06

The historical REPLAN REQUIRED above is resolved in the revised Objective and existing Task plan. Float64 scientific coordinates, explicit centers, scientific quaternions, Sun illumination geometry and orb.js evaluation are now owned here; floating-origin rendering is owned by T-002. Original fixture accuracy targets are unchanged. Status remains in_progress and stage build. No implementation, provider evaluation, Check or gate result is claimed. Owner review of the revised plan is pending.

## Implementation Progress — 2026-10-06

The planning-only statements above record the replan point and are superseded by the execution evidence in this Task. T-001 implementation and all configured gates are now recorded under Technical Evidence. Current lifecycle state is `status: in_progress`, `stage: audit`; no independent Task Check, owner waiver, or completion decision is recorded.
