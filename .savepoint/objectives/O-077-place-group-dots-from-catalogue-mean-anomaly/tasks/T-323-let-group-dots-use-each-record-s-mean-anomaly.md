---
id: T-323
title: Let group dots use each record's mean anomaly
objective: O-077
status: done
depends_on: []
check_waiver: {task: T-323, reason: 'Owner chose "Skip the step check (Recommended)" for the single build step of O-077; the mandatory Full Objective Check covers the same diff.', actor: {role: owner, session: plan-g021-20261120}, recorded_at: '2026-11-20T08:09:59Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g021-20261120}
planned_reads: [packages/astraeus/src/api/group.ts, packages/astraeus/src/core/listedOrbitGroup.ts, packages/astraeus/tests/listedOrbitGroup.test.ts, packages/astraeus/tests/publicApiGroup.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/api/group.ts, packages/astraeus/src/core/listedOrbitGroup.ts, packages/astraeus/tests/listedOrbitGroup.test.ts, packages/astraeus/tests/publicApiGroup.test.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
---

# Let group dots use each record's mean anomaly

## Outcome

`addGroup` orbits may carry `meanAnomalyDeg`; a group where every orbit does places each dot at its real catalogue position (O-077 Success Conditions), and illustrative groups are unchanged.

## User Check

None required; proven by Node tests. The belt app tests the packed tarball separately.

## Done When

Every O-077 Success Condition has named test evidence; configured gates plus `npm run check:engine-alone` and `npm run check:pack` pass; `npm run api:lock` updated; tarball path, build time and one full fill time for 110,000 orbits recorded below.

## Context Files

`packages/astraeus/src/api/group.ts`, `packages/astraeus/src/core/listedOrbitGroup.ts`, `packages/astraeus/tests/listedOrbitGroup.test.ts`, `packages/astraeus/tests/publicApiGroup.test.ts`, `packages/astraeus/README.md` under the addGroup row and "Groups of dots", `packages/astraeus/CHANGELOG.md` (top section only), `docs/agents/build.md`.

## Design References

`.savepoint/Design.md` under "Public API shape (G-016, owner 2026-11-01)".

## Guardrails

API-01..API-07, TEST rules, STYLE (advisory).

## Implementation Plan

1. Core: optional `meanAnomalyDeg` on `ListedMember`; all-or-none check; measured branch computing M_ref into a Float64Array with GM from `gravitationalParameterOf`; reject seed/concentration with measured; conditional `listedGroupProvenance`.
2. API: field and doc comments; validation in `checkOrbits`/`planGroup` (finite, all-or-none naming first missing, no seed/clump); pass through in `buildGroupLayer`; conditional card provenance and limitations.
3. Tests per O-077 (Ceres independent calculation, addBodyFromElements agreement, quarter period, wrap, errors, card strings, determinism/order, 110k smoke with timings).
4. README, CHANGELOG 0.10.0 (proposed), `npm run api:lock`; gates; `npm run build:packages` and `npm pack` of the built package.

## Boundaries

O-077 Boundaries. No new error code; no change to illustrative output.

## Technical Verification

Focused vitest during iteration; configured gates, `check:engine-alone`, `check:pack` at handoff. Evaluated later by the Full Objective Check (`agent-skills/references/check-method.md`).

## Technical Evidence

Executor session exec-t323-20261120 (same session as planning; the Full Objective Check runs in a fresh session). Branch `feat/group-mean-anomaly`.

**Per criterion (O-077 Success Conditions):**
- All or none, finite, wrap: core `assertMembers` returns measured-phase and throws `GroupElementsError` naming the first member without one; API `checkOrbits` throws `bad-group` (`orbit "<id>" gives no meanAnomalyDeg while others do ...`) and for non-finite or non-number values. Tests: listedOrbitGroup "refuses a mix, a non-finite mean anomaly, and a seed or concentration"; publicApiGroup "refuses a mix, a non-finite mean anomaly, and seed or clump". Wrap: "wraps the mean anomaly: −90 and 270 give the same position" (exact equality; 630 too; epoch reading of −90 is exactly 270).
- Measured placement: `measuredMeanAnomaliesDeg` (Float64Array, no per-member allocation): wraps the epoch value in degrees, adds `sqrt(mu/a³)·(ref−epoch)/1000` with `mu = gravitationalParameterOf(adapter, center)` (one call), wraps to 0–2π. Absent `time` → epoch = reference time (unchanged `buildGroupLayer` default). Tests: Ceres independent check (below); "a quarter period on a circular orbit is exactly 90°" (meanAnomalyDegAt to 1e-9°, ecliptic longitude to 1e-6°).
- seed/clump: `planGroup` throws `bad-group` ("seed only shuffles illustrative positions ... drop seed", "clump only shapes illustrative positions ... drop clump"); core `assertPhase` throws for seed or concentration. Note: `seed: 0` explicitly given is refused too (presence, not value).
- Card: `listedGroupProvenance(source, concentrated, measured)` keeps sourceType, sources, accuracy and appends MEASURED_PHASE_NOTE; `groupLimitations` swaps in MEASURED_PLACEMENT_LIMIT, keeps MOTION_LIMIT. Test "keeps the caller's sourceType on the card and in scene.groups" asserts `scene.groups[0].provenance` = group provenance = card provenance and the exact limit list. Illustrative unchanged: exact-string tests of provenance, description and limits at core and API level ("leaves an illustrative group's card exactly as before"); the whole existing suite (incl. showers tests) passes unchanged.
- `meanAnomalyDegAt`: returns the reference-time value; doc comment updated.
- Ceres (JPL SBDB, JD 2461200.5 TDB, ttMinusUtc 69.184 s): group position at epoch and epoch + 365.25 d, for reference = epoch and epoch − 400 d, equals an independent calculation in the test (bisection Kepler, explicit rotations, GM 132712440018 km³/s² and obliquity 84381.406″ written in the test) within 1 km. Against `addBodyFromElements` for the same record: measured gap 4.5e-7 km at epoch and 2.4e-7 km a year later; both paths use GM 132712440018 (engine adapter GM equals the catalogue Sun GM exactly), so the test tolerance is 1e-3 km (rounding only).
- Determinism and order: core and API tests (same input → identical fill; reversed list → each record's identical position); API also shows referenceTime makes no difference beyond 1e-6 km.
- Scale: 110,000 synthetic main-belt orbits (a 2.1–3.3 au, e<0.3, i<30°) in one measured group, Node v24.16.0 on this WSL2 machine (16 cores), vitest: build 368 ms, one full `fillPositionsKm` 109 ms (measurement, not a threshold; logged by the test as `[O-077 scale]`).
- Docs: README `addGroup` row and `scene.groups` row, `SceneGroupRead.provenance` doc, GroupInput/GroupOrbitInput doc comments (the /api "Groups of dots and activity" section is generated from them); CHANGELOG "0.10.0 (proposed, unreleased)" section; `npm run api:lock` (one added field `GroupOrbitInput.meanAnomalyDeg`). `api:errors` not run: no error code changed (`bad-group` reused).

**Gates** (fresh, 2026-11-20T08:17:51Z–08:19:31Z, Node v24.16.0): `npm run lint` 0, `npm run typecheck` 0, `npm run build` 0, `npm test` 0 (265 files, 4059 passed, 2 skipped), `npm run check:engine-alone` 0 (194 files, 2953 passed), `npm run check:pack` 0 (astraeus packed 7.31 MB / limit 8.0, unpacked 9.46 MB / limit 9.5). The first `npm test` run failed one test: the /api page gzip budget (45,167 B against 45,000; 44,977 B before this change). Owner 2026-11-20 chose "Raise cap to 46,000"; `packages/astraeus-site/tools/validate/load-budget.mjs` records it.

**Tarball:** `npm run build:packages` then `npm pack` of `packages/astraeus/dist` → `/home/user/code/astraeus-tarballs/astraeus-0.9.2-group-mean-anomaly.tgz` (version field still 0.9.2, no bump; renamed after packing; sha256 7ea7ee7559dc02222e5e6d8a075a434776f4516dd6a9a632d08c8f563964573d; `package/src/api/group.d.ts` names meanAnomalyDeg).

**Files read:** the planned reads, plus `packages/astraeus/src/core/orbitGroup.ts` (memberStatesOf), `src/core/pointGroup.ts`, `src/core/keplerElements.ts` (GM), `src/core/twoBodyAdapter.ts` (obliquity), `src/core/elementsBody.ts` (addBodyFromElements GM/epoch), `src/api/planGroups.ts`, `src/api/scene.ts` (setTimeline, stateOf), `packages/astraeus-site/tools/site/api-reference.mjs`, `docs/RELEASING.md`, logged as needed to place the change and choose the comparison.
**Files changed:** `packages/astraeus/src/core/listedOrbitGroup.ts`, `src/api/group.ts`, `src/api/sceneReads.ts`, `tests/listedOrbitGroup.test.ts`, `tests/publicApiGroup.test.ts`, `README.md`, `CHANGELOG.md`, `api-surface.lock.json`, `packages/astraeus-site/tools/validate/load-budget.mjs`.

**Limitations:** no browser run (the points layer and its sliced refill are unchanged; not exercised with 110,000 dots in a browser here). Positions use unperturbed two-body motion, as stated on the card. `memberStatesOf` still takes one small object per member (existing path, unchanged). The belt app has not yet tested the tarball.

## Drift Notes

- Planned writes grew by `packages/astraeus/src/api/sceneReads.ts` (doc comment said "always illustrative") and `packages/astraeus-site/tools/validate/load-budget.mjs` (owner-approved budget raise).
- Design: non-architectural. Groups now have two placement modes inside the existing listed-orbit group; no new module, interface or data owner. Design.md "Public API shape" needs no change; the Full Check may confirm.

## Owner Decision

Owner 2026-11-20 (session plan-g021-20261120), after the handoff gates passed: "Mark done, run final check (Recommended)". Status set to done by the executor on that instruction; the mandatory Full Objective Check follows in a fresh session.
