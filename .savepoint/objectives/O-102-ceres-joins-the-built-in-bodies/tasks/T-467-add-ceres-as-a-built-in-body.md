---
id: T-467
title: Add Ceres as a built-in body
objective: O-102
status: done
check_waiver: {task: T-467, reason: 'Owner said "orchestrate O-102" (G-028, 2026-11-27): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o102-20261127}, recorded_at: '2026-11-27T00:00:58Z'}
depends_on: [{task: T-464, requires: clear}, {task: T-465, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g028-20261127}
lane: engine
planned_reads: [packages/astraeus/src/core/bodies/outerPlanets.ts, packages/astraeus/src/core/bodies/index.ts, packages/astraeus/src/api/bodies.ts, packages/astraeus/src/assets/catalogue.ts, packages/astraeus-data/src/index.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/core/bodies/ceres.ts, packages/astraeus/src/core/bodies/index.ts, packages/astraeus/src/api/bodies.ts, packages/astraeus-data/src/index.ts, packages/astraeus/tests/ceresBody.test.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md]
---

# Add Ceres as a built-in body

## Outcome

`import { ceres } from "astraeus"` (`ref("ceres", "Ceres", "astraeus-data")`) adds Ceres: a sphere of IAU mean radius 469.7 km with GM from the Horizons header, oriented by pck00011 (pole RA 291.418°, Dec 66.764°, W 170.650° + 952.1532°/day), placed Sun-centred from T-464's fit delivered by `astraeus-data`'s `dataSource` through T-465's member. `orbit: true` draws its line round the Sun. Without `astraeus-data`, `mount` throws `missing-data` naming it.

## User Check

None beyond the Objective's.

## Done When

- `core/bodies/ceres.ts` defines `CERES` and `CERES_ROTATION` in Pluto's pattern (`outerPlanets.ts`), with provenance for position (T-464's command, solution, measured error), radius, GM and rotation (PROV-02), and stated limits (e.g. outside 1950 to 2045 no position).
- `astraeus-data`'s `dataSource` provides `["ceres"]` and carries the series loader (lazy import of `data/positions/ceres.json`, so it is its own chunk); its doc comment updated (it now provides a body).
- Ceres is in the public body list, `catalogue`, and `orbitPeriod` if planets are listed there.
- New `packages/astraeus/tests/ceresBody.test.ts`: position at two archived Horizons dates within 1 km; orientation of the prime meridian at J2000 per pck00011; `missing-data` without the package; `orbit: true` accepted; the engine's first download unchanged (`measure:example`).
- README: Ceres added where ready-made bodies are listed (the heading that lists them only). API lock regenerated last; one CHANGELOG bullet.
- Existing tests unchanged and passing, plus `apiImports`/`packageBoundaries`.

## Context Files

`packages/astraeus/src/core/bodies/outerPlanets.ts`, `packages/astraeus/src/core/bodies/index.ts`, `packages/astraeus/src/api/bodies.ts`, `packages/astraeus/src/assets/catalogue.ts`, `packages/astraeus-data/src/index.ts`; T-464 and T-465 Drift Notes.

## Design References

`.savepoint/Design.md` under `Planet positions from Horizons`, `Every listed moon addable`.

## Guardrails

API-01..07, ARCH-01..06, PROV-01, PROV-02, DATA-01, TEST-01..04, STYLE-07.

## Implementation Plan

1. Mirror Pluto's definition for Ceres with T-465's package-positions hook.
2. Wire `astraeus-data` to provide Ceres.
3. Test, measure, docs, lock, changelog.

## Boundaries

No picture (T-466), no places wiring or demo (the showing step).

## Technical Verification

Focused tests plus boundary tests; handoff gates per `docs/agents/verification.md`.

## Technical Evidence

Both blockers resolved by the coordinator rulings below. Final state: all Done When met.

### Done When -> evidence
| Done When | Evidence |
|---|---|
| `core/bodies/ceres.ts`: `CERES`, `CERES_ROTATION`, provenance for position/radius/GM/rotation, stated limits | `tests/ceresBody.test.ts` "turns by pck00011" and "states provenance"; limits text names 1950 to 2045 |
| `dataSource` provides `["ceres"]`, lazy loader, doc comment updated | `packages/astraeus-data/src/index.ts`; test "is provided by astraeus-data" |
| Ceres in public list, catalogue | `ceres` in `api/bodies.ts` READY_MADE and `api/index.ts`; `BUILT_IN_BODIES`/`BUILT_IN_BINDINGS` in `core/bodies/index.ts`; visual entry in `assets/bodies/planetSystemMaps.ts` (`PICTURES.ceres`); no `orbitPeriod` list holds planets |
| New test: two archived positions within 1 km; prime meridian per pck00011; missing-data; orbit: true; first download | `ceresBody.test.ts` 8 tests pass (positions 1955 and 2038 within 1 km; constants; missing-data naming astraeus-data; orbit: true prepares; out-of-span names 1950-01-01 to 2045-01-01). First download: NOT unchanged, see below |
| README, API lock, CHANGELOG | README bodies row and astraeus-data row; `npm run api:lock` run last (+6 lines); one bullet under 0.13.0 |
| Existing tests unchanged and passing | NOT met: see failures below |

### Measurement
`npm run measure:example` first-open total: before 1,846,414 / 529,484 gzip (T-465 end), after 1,848,944 / 530,133: +2,530 raw, +649 gzip. Over the cap 1,847,500 / 530,000 by 1,444 raw and 133 gzip. Stopped per the brief.

### Commands
typecheck clean; eslint (use-typescript6) and prettier --check on all changed files clean. `npx vitest run` over 105 files (every packages/*/tests file mentioning planetTrajectory, planetSeries, planetModels, bodies/index, assembleScene, planetSystemMaps, assets/catalogue, api/bodies or "astraeus-data", plus apiImports, packageBoundaries, layerRule, apiRules, apiSurface, releaseBreaks, publicBuild): 99 files pass, 6 fail (10 tests): assets.test.ts (catalogue id list; allow-list of dwarf planets/planets; planted-case list), compositionsContract.test.ts and experiencesContract.test.ts (use "ceres" as the uncatalogued id), planets.test.ts (BUILT_IN_BODIES list), textureLicence.test.ts (texture id list), bodyMarkers.test.ts (reads every catalogue body's state with no data loaded: NotLoadedError for ceres). apiImports and packageBoundaries pass.

### Files changed
packages/astraeus/src/core/bodies/ceres.ts (new), core/bodies/index.ts, core/bodies/planetTrajectory.ts, core/planetSeries.ts, core/planetModels.ts, api/bodies.ts, api/index.ts, api/scene.ts, api/assembleScene.ts, assets/bodies/planetSystemMaps.ts, tests/ceresBody.test.ts (new), api-surface.lock.json, CHANGELOG.md, README.md; packages/astraeus-data/src/index.ts. Beyond planned_writes: api/index.ts (export), assets/bodies/planetSystemMaps.ts (visual entry), planetSeries.ts, planetModels.ts, scene.ts, assembleScene.ts (below).

### Extra changes
- Out-of-span truth (open point a): `PlanetModel.span` (set by `createSeriesModel` from its time-scale table) and `PlanetFitsUncoveredError.span`; `packageSeriesBinding` rethrows either range error as `PlanetFitsUncoveredError(date, model.span)`; `scene.ts` `#catalogueRefusal` names `error.span` first. Built-in planets unchanged.
- Found a real bug: `orbit: true` on a package body threw a raw `NotLoadedError` from `toDefinition` (early orbit read once planet series were loaded) and `prepare` read the orbit before `installData`. Fix: `deferredRead` gives its fallback on `NotLoadedError`, and `prepare` runs `installData` right after `checkPlanetSpan` (before the orbit/group/fit reads).

### Coordinator rulings, orchestrate-o102-20261127 (applied)
- Coordinator ruling, orchestrate-o102-20261127: engine cap raised by the owner to 1,850,000 raw / 530,500 gzip. Re-measured after trimming provenance text: 1,849,031 raw / 530,420 gzip (+2,617 / +936 over T-465's 1,846,414 / 529,484); `npm run check:pack` pass.
- Coordinator ruling, orchestrate-o102-20261127: assets/planets/textureLicence tests: "ceres" added to their pinned lists and to the dwarf-planet allow-list only; assets.test.ts's "unknown body" probes use "tarn". compositionsContract/experiencesContract: stand-in id "ceres" replaced by "tarn" on the four lines.
- Coordinator ruling, orchestrate-o102-20261127: bodyMarkers.test.ts not edited. Cause: a resolver with no scene gives bindings no moonData. Fix: `processMoonData` (core/moonData.ts, process-wide package-series store used by `packageSeriesBinding` only when no scene's moonData is given) and `vitest.moons.setup.ts` provides Ceres's series into it from astraeus-data's file.
- Coordinator ruling, orchestrate-o102-20261127: untested case added: Ceres with `orbit: true` and window 2046 to 2047: `toDefinition` does not throw; `prepare` rejects `out-of-span` naming ceres and 1950-01-01 to 2045-01-01. Needed `PlanetFitsUncoveredError.body` and a branch in `assembleScene.planetRead` (a raw error leaked before).
- Final focused run: 116 files (the 105 plus ceresBody, apiImports, packageBoundaries, layerRule and site API tests, files mentioning moonData), 2317 tests passed; typecheck, eslint, prettier clean; API lock regenerated last (+6 lines).

- Coordinator ruling, orchestrate-o102-20261127: `stateResolver.test.ts` two pinned lists (built-in ids, bindings): "ceres" added after pluto. `publicApiGroup.test.ts`: the elements record's id "ceres" is now "ceres-elements" (values unchanged). CHANGELOG breaking-changes line now states `addBodyFromElements` with id "ceres" throws `duplicate-id`; releaseBreaks test passes.
- Coordinator ruling, orchestrate-o102-20261127: `positionLimitations.test.ts` registry guard: `CERES_EPHEMERIS` (EphemerisRecord) exported from ceres.ts and used by CERES; `ceres` added to RECORDS and REFS only; per-id card tests pass unchanged. Final: full `npm test` 361 files, 5766 passed, 2 skipped; typecheck, eslint, prettier clean; `check:pack` pass, engine 1,849,129 raw / 530,427 gzip (limit 1,850,000 / 530,500).

### Limitations
Ceres's data-less behaviour in tests that iterate the whole catalogue (bodyMarkers) needs a decision. Window outside 1950-2045 with `orbit: true` for Ceres not tested.

## Drift Notes

Record any change to how catalogue bodies take package positions for T-468's Design reconciliation.

T-467: `prepare` now calls `installData` before the orbit/group/fit setup reads, and `deferredRead` treats `NotLoadedError` as read-later, so a package body can have an orbit line. `PlanetModel.span` and `PlanetFitsUncoveredError.span` carry a package body's own years into the out-of-span message. Design.md: under "Planet positions from Horizons" Ceres is the first `bodyPositions` body, a built-in catalogue body whose data comes only with astraeus-data.

Marked done by the coordinator under the owner's "orchestrate O-102" (2026-11-27) after the gate passed at 2026-11-27T00:33Z: typecheck, lint, `npm test` 361 files 5766 passed 2 skipped, build, check:pack (engine 1,849,129 raw / 530,427 gzip within the owner-raised 1,850,000 / 530,500). Breaking change recorded in CHANGELOG 0.13.0: addBodyFromElements("ceres") now throws duplicate-id.

## Repair after C-226

Repair builder, session repair-o102-c226-20261127, under T-467's scope (no new Task). Targets: I-210 and I-211 Proof Needed, verbatim. Status left as recorded; Issues left `open` for a re-check.

Extra reads (beyond T-467's Context Files): C-226 and I-210/I-211 in full (the targets); `agent-skills/references/issue-capture.md` (history entry shape); `packages/astraeus/src/api/planPaths.ts` `autoPaths` and `planCamera.ts` `fitFarthestKm` (the two deferred reads I-211 names); `planBodies.ts` `earlySunPaths`, `planGroups.ts` `lateGroups` (the other setup reads sharing the readiness rule); `tools/check-node-consumer.mjs` (the mechanised guard); `vitest.config.ts` (project split preloaded / cold); `packages/astraeus-data/README.md` intro and CHANGELOG top section (C-226 Observation 3).

### What changed

- **I-210, both sides.** `packages/astraeus-data/src/index.ts`: the Ceres loader is now `loadCeres`, `await import("../data/positions/ceres.json", { with: { type: "json" } })` then `loaded.default ?? loaded`, as every other data package. `packages/astraeus/src/api/data.ts`: `installData` passes the loader's result through `jsonOf` (a JSON module's `default` when it is an object, else the result itself), so any host loader shape works (Parcel's file, Node's default-only module, Vite/webpack's default plus named keys); `DataSource.bodyPositions` doc says so.
- **I-211, root cause.** The setup reads in `assembleScene` decided "read now" by `planetSeriesLoaded()` alone, which is process-wide, while a package body's series is per scene and arrives only in `prepare`'s `installData`; the T-467 `NotLoadedError` swallow then hid the gap for auto paths and the fit. Now one flag, `statesIn = planetSeriesLoaded() && !awaitsBodyPositions(data, ids, catalogue)`, decides every setup read: `autoPaths(..., statesIn)` (`later` = pending && !statesIn), `fitFarthestKm(..., statesIn)`, `earlySunPaths(..., statesIn)`, `lateGroups(statesIn)`. When false, each read is made in `prepare` after `installData`, by the existing settle paths. `awaitsBodyPositions` (new, `data.ts`) mirrors `installData`'s own test (a scene body in some `bodyPositions` whose series is not in the scene's store). The `NotLoadedError` swallow in `deferredRead` is removed (a not-loaded error at build time is again a real fault, as before O-102; this also settles C-226's adversarial note on the moon-fit error) and the comments are corrected (STYLE-08 note). `planPaths.ts` and `planCamera.ts` lose their `planetSeriesLoaded` import; they are outside T-467's planned_writes but are the two reads the Issue names (parameter added, no behaviour change when no package body is pending).
- **Mechanised guard.** `tools/check-node-consumer.mjs`: new case "Ceres's positions load in plain Node from the packed astraeus-data and match Horizons within 1 km (I-210)".
- **Docs.** `packages/astraeus-data/CHANGELOG.md` new `## 0.13.0 (unreleased)` (provides Ceres; map and positions; plain-Node loading). `packages/astraeus-data/README.md` intro list gains Ceres's map and positions.

Files changed: packages/astraeus-data/src/index.ts, packages/astraeus/src/api/data.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/planPaths.ts, packages/astraeus/src/api/planCamera.ts, packages/astraeus/tests/bodyPositionsData.test.ts (three new rows only; existing rows and setup untouched), packages/astraeus/tests/ceresDeferredReads.cases.ts (new), packages/astraeus/tests/ceresDeferredReads.test.ts (new, preloaded project), packages/astraeus/tests/cold/ceresDeferredReads.test.ts (new, cold project), tools/check-node-consumer.mjs, packages/astraeus-data/CHANGELOG.md, packages/astraeus-data/README.md.

### Proof Needed -> evidence

| Proof Needed item | Evidence |
|---|---|
| I-210: packed packages in plain Node, `scene.load({ data: [dataSource] })` with Ceres resolves, `stateOf("ceres")` within 1 km of archived Horizons | `npm run check:node-consumer`: 13 passed (new case: TDB 2038-11-02T20:00:13 JPL#48 ICRF state, at UTC 19:59:03.816Z, TT-UTC 69.184 s by the engine's table, distance < 1 km). Red first: with HEAD's `astraeus-data/src/index.ts` and `api/data.ts` the run FAILED; rerun with the fix: pass. Packed `dist/src/index.js` carries `{ with: { type: "json" } }`. |
| I-210: table test of `bodyPositions`: file itself, module with only `default`, plus malformed rows | `tests/bodyPositionsData.test.ts` 9 rows: "valid" (file itself), new "valid, a module whose only key is default (plain Node)", new "valid, a module with default and named keys (Vite)", new "malformed series inside default" (bad-data), existing absent / malformed member / malformed series / not in scene / missing package. Red first: the default-only row fails at HEAD. |
| I-211: table, preloaded and cold, built twice in one process via `definitionOf` + `prepare`: Ceres holds no sample -> same stretches as without Ceres; sample inside Ceres's sphere -> stretch fixed to Ceres; camera fitted to Ceres gets its distance | `tests/ceresDeferredReads.test.ts` (preloaded, 4 rows) and `tests/cold/ceresDeferredReads.test.ts` (cold, fresh module graph per row: build 1 cold, build 2 planet series loaded), shared `ceresDeferredReads.cases.ts`; each row checks both builds: no-sample -> `[{sun, whole span}]` equal to the no-Ceres reference row; near (days 20-29 at Ceres + 20,000 km) -> bodies `[sun, ceres, sun]`, Ceres stretch opens at day 20; `fitOrbit(ceres)` -> `camera.fitOrbit.farthestKm()` between 2.5 and 3.1 au. Red first at HEAD engine: 6 of 6 Ceres rows fail (preloaded on build 1, cold on build 2: `lineFixedTo` undefined, fit absent). |
| Configured gates and `check:pack` pass | below |

### Gates (2026-11-27, UTC 00:54-00:58)

- `npm run typecheck`: pass.
- eslint (`tools/lint/use-typescript6.cjs`) and `prettier --check` on every changed file: pass.
- Focused vitest: ceresDeferredReads (both), tests/cold, bodyPositionsData, ceresBody, ceresFit, publicApiAutoStretches, publicApiSunPaths, publicApiLineStretches, sceneLoadOrder, sceneFaultOrder, lifecycle: 13 files, 407 passed.
- `npm test` (under `flock /tmp/claude-1000/astraeus-gates.lock`): 363 files, 5787 passed, 2 skipped.
- `npm run build`: exit 0.
- `npm run check:pack`: pass; engine 1,849,338 B raw / 530,471 B gzip (limits 1,850,000 / 530,500; +209 / +44 over C-226's figure).
- `npm run check:node-consumer`: 13 passed.
- No browser runs.

### Drift notes (for Design reconciliation)

- The setup-read rule changed: "read now" means every state the read needs is in hand (planet series loaded and no scene body awaiting `bodyPositions`), else the read is made in `prepare` after `installData`; there is no not-loaded swallow. Design.md has no text on `deferredRead` or the swallow (grep), so nothing there contradicts it; T-467's earlier drift note ("`deferredRead` treats `NotLoadedError` as read-later") is superseded by this one.

### Limitations

- Camera fit: proven through `definitionOf` + `prepare` (`camera.fitOrbit.farthestKm`), not through a mounted viewer (no browser runs).
- Engine headroom is now 662 B raw / 29 B gzip under the owner-raised cap.
