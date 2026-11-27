---
id: C-226
scope: {kind: objective, id: O-102}
result: NEEDS WORK
checked_by: {role: checker, session: check-o102-20261127}
executed_session: orchestrate-o102-20261127 (T-464..T-468 builders and coordinator)
checked_at: '2026-11-27T00:50:00Z'
health_snapshot: sha256:598dc83ab48d4a303d0a140d07d9c3d34fae73ad430c63dd80887b8dbaa9402a
reviewed:
  base_commit: 6fc63340
  head_commit: 7e9b5d0d
  files: [docs/DONOR_PROVENANCE.md, docs/DONOR_TEXTURE_INVENTORY.md, docs/belt-ceres-note.md, packages/astraeus-data/data/bodies/ceres/map.json, packages/astraeus-data/data/positions/ceres.json, packages/astraeus-data/src/index.ts, packages/astraeus-data/src/pictures.ts, packages/astraeus-data/src/textures/ceres-2k.jpg, packages/astraeus-demo-planets/data/planets/ceres.json, packages/astraeus-demo-planets/src/experiences/planets/systems/ceres.ts, packages/astraeus-demo-planets/tests/planetViews.test.ts, packages/astraeus-site/assets.html, packages/astraeus-site/tests/assetsSections.test.ts, packages/astraeus-site/tests/packagePacks.test.ts, packages/astraeus-site/tests/publicBuild.test.ts, packages/astraeus-site/tools/validate/engine-budget.mjs, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, packages/astraeus/api-surface.lock.json, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/bodies.ts, packages/astraeus/src/api/data.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/assets/bodies/planetSystemMaps.ts, packages/astraeus/src/core/bodies/ceres.ts, packages/astraeus/src/core/bodies/index.ts, packages/astraeus/src/core/bodies/planetTrajectory.ts, packages/astraeus/src/core/moonData.ts, packages/astraeus/src/core/planetModels.ts, packages/astraeus/src/core/planetSeries.ts, packages/astraeus/tests/assets.test.ts, packages/astraeus/tests/bodyPositionsData.test.ts, packages/astraeus/tests/ceresBody.test.ts, packages/astraeus/tests/ceresFit.test.ts, packages/astraeus/tests/compositionsContract.test.ts, packages/astraeus/tests/experiencesContract.test.ts, packages/astraeus/tests/pictureList.test.ts, packages/astraeus/tests/planets.test.ts, packages/astraeus/tests/positionLimitations.test.ts, packages/astraeus/tests/publicApiGroup.test.ts, packages/astraeus/tests/stateResolver.test.ts, packages/astraeus/tests/textureLicence.test.ts, packages/astraeus/tools/import/planet-fits.mjs, packages/astraeus/tools/import/planetary-explorer-map-sources.json, packages/astraeus/vitest.moons.setup.ts, tools/check-packs.mjs]
  dependencies: []
issues: [I-210, I-211]
supersedes: null
unmet: [O-102 SC1, API-03]
---

# C-226: O-102 Full Objective Check

Fresh session; it did not plan, build or coordinate O-102. Diff `git diff main...o102-ceres-globe` (main 6fc63340, head 7e9b5d0d; 47 files outside `.savepoint`). Out of scope: the uncommitted T-388 (O-086) change, untracked `docs/evidence/*` and `docs/research`.

**Result: NEEDS WORK.** Every gate passes and most of the Objective is proven: the Horizons fit, the picture and its rights, provenance, the docs, the local picker, the size caps the owner raised, the orbit line and `missing-data`. Two defects block clearance, both from T-467 and both missed by tests that run only under Vite or with planet series not yet loaded:

- **I-210**: in plain Node from the packed packages, `scene.load` with Ceres fails with `bad-data`. The Ceres loader has no JSON import attribute and is not unwrapped from `default`, unlike every other data package.
- **I-211**: once the planet series are loaded (any second scene on a page, or after `scene.load`), a scene holding Ceres silently loses its `lineFixedTo: "auto"` stretches. The new `NotLoadedError` swallow in `deferredRead` is never retried for auto paths, and by reading the code it is not retried for camera fits either.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (the packed packages in plain Node and the browser runner only; the runner used its own servers, and the owner's :5490 was left alone)
- [x] Workflow And Side-Effect Check Lock (the mount/`prepare` read order: check, load planet series, span, `installData`, deferred reads)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: first Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria: O-102 Success Conditions 1-6, with the owner decisions recorded in the Task files: engine caps raised to 1,847,500 then to 1,850,000 raw / 530,500 gzip (dated in `engine-budget.mjs`), the 2048x1024 picture (the astraeus-data 39 MB pack limit), and `addBodyFromElements("ceres")` as `duplicate-id`, listed as breaking (owner: "fine, list it as breaking"). Also each of T-464..T-468's Done When, Guardrails API-01..07, ARCH-01..06, PROV-01/02, DATA-01, TEST-01..04 and STYLE-*, and the release gate `releaseBreaks.test.ts`.
2. Changed files: `reviewed.files`. Entry points: `import { ceres }`, `Scene.addBody(ceres, { orbit })`, `mount`, `scene.load`, `scene.check`, `scene.stateOf`, `DataSource.bodyPositions` (checked by `checkDataSources`, read by `installData`), and `astraeus-data`'s `dataSource` in source and packed form. Also `lineFixedTo: "auto"` paths and camera fits, because T-467 changed their shared deferred read.
3. Relied-on runtime: `assembleScene` `toDefinition`/`prepare` ordering; the process-wide planet series; `bindCatalogue` scene moon data; `createSeriesModel`; orb frame transform; Vite and Node JSON module loading.
4. Axes: below. Not applicable: text classes (no width or truncation rule in scope); environment/output sinks (no CLI); serialization beyond the planet-fit file.
5. Admission: supported public paths (README, `scene.load` doc "Works in plain Node", packed packages) introduced or touched by O-102.

## Coverage matrix

| Row | Cells | Evidence | Result |
|---|---|---|---|
| SC1 Ceres drawn with astraeus-data (Vite) | mount, load, check | `ceresBody.test.ts` (8), `planetViews.test.ts`, browser smoke and planets-phone pass; owner look passed | Pass |
| SC1 Ceres with astraeus-data, plain Node packed | `scene.load` | Probe: `bad-data` `ERR_IMPORT_ATTRIBUTE_MISSING` | **Issue I-210** |
| SC1 without package | mount/load | `missing-data` naming astraeus-data (`ceresBody.test.ts`; T-465 table row "tarn") | Pass |
| SC2 fit within 1 km 1950-2045 | three archived dates, coverage, worst error 0.774 km | `ceresFit.test.ts` (independent: Orb frame transform of archived ICRF vectors), `ceresBody.test.ts` two dates through `stateOf` | Pass |
| SC2 boundaries | 2046-2047 window with `orbit: true` | `prepare` rejects `out-of-span` naming ceres and 1950-01-01..2045-01-01 (test); `toDefinition` does not throw | Pass |
| SC3 orientation/places | pck00011 constants, W0 at J2000; places on features | test; owner look ("fine") on localhost:5490; `features.json` untouched in diff | Pass |
| SC4 first download | Ceres series not in first-open | `measure:example`: `planetModels` on demand, no ceres chunk in first-open; total 1,849,129 / 530,427 within owner-raised 1,850,000 / 530,500. The "no engine cap raise" wording is superseded by two dated owner decisions (Observation 1) | Pass (by owner decision) |
| SC5 provenance | positions, radius, GM, rotation, picture licence; docs and assets page | `ceres.ts` provenance, `PICTURES.ceres` AssetLicence, `packagePacks` credits, `textureLicence`, `assetsSections`, `assetsPageCredits` green; doc diffs read | Pass |
| SC6 orbit line, public list, catalogue | `orbit: true`; READY_MADE, index export, BUILT_IN_BODIES, visual entry | tests + API lock | Pass |
| `bodyPositions` input shape | absent, valid, malformed member, malformed series, body not in scene (loader not called), not loader | `bodyPositionsData.test.ts` 6 rows | Pass |
| `bodyPositions` loader result | file itself, Vite module (named + default), Node module (default only) | Vite only tested; Node default-only fails (I-210) | **Issue I-210** |
| State: first scene vs later scene (planet series loaded) | auto path with Ceres | First: stretches `[sun]`; second: `undefined`; without Ceres: `[sun]` (cold project probe); preloaded project first build: `undefined` | **Issue I-211** |
| State: Sun-orbit lines after the swallow | `orbit: true` | `prepare` re-reads when `sunPaths` is short; test passes | Pass |
| Camera fit to Ceres after the swallow | `fit` deferred read | Code: `fit` becomes undefined, no settle (not probed; listed under I-211) | Issue I-211 (by reading) |
| Two viewers / per-scene series | series per scene, revision bump clears the memo | `MoonDataSelection.provideSeries` per scene; `bindCatalogue` binds scene moon data to every source (`assets/catalogue.ts:107-118`) | Pass |
| Breaking change | `addBodyFromElements("ceres")` | CHANGELOG `### Breaking changes in 0.13.0`; `releaseBreaks` green | Pass |
| Public build Jupiter only | | `publicBuild.test.ts`, `check:public-build` | Pass |

Test edits by the coordinator, judged against each test's intent:
- `assets`, `planets`, `stateResolver`, `textureLicence`, `planetViews`, `assetsSections`: pinned lists gained "ceres". These tests pin the catalogue, so the intent holds. The dwarf-planet allow-list in `assets.test.ts` gained Ceres, which is correct.
- `compositionsContract`, `experiencesContract`, `assets` "unknown body": the stand-in id moved from "ceres" to "tarn". These probe an id the catalogue lacks, so the intent holds.
- `publicApiGroup`: elements id became "ceres-elements" with the same values. It still compares group and body on the same elements, so the intent holds.
- `pictureList` NOT_MOONS gained "ceres", the file's documented extension point. Sound.
- `packagePacks`: the picture count went from 16 to 17. Sound.
- `positionLimitations` RECORDS/REFS gained Ceres, so the registry guard now covers it. Sound.
- `ceres/map.json` was restored to importer output, as `bodyPackages` "importer again writes identical files" requires. The shipped file's record is in `pictures.ts` and in the sources JSON, and the diff keeps the new source text. Sound.
- `bodyMarkers` was left unedited. It passes because `processMoonData` and `vitest.moons.setup.ts` give unbound core resolvers a Ceres series. The test's intent holds, but at the cost of a process-wide store in shipped code (Observation 2).

## Adversarial notes

- `processMoonData` (API-03): production code never fills it, and it is not exported. Every scene path uses `bindCatalogue`, which passes the scene's own moon data, so no host path found reads it. Unbound `catalogue` users (`planPaths.autoStretches`, `scene.#catalogueSource`) also get the bound scene catalogue through `plan.catalogue`. So no reachable failure, and it is not an Issue. It does make the `moons` test project resolve Ceres where production would throw (Observation 2).
- `packageSeriesBinding` repeats the adapter's ecliptic-to-EQJ turn in about 3 lines (STYLE-07, advisory). This was already recorded as a follow-up in T-465's drift notes.
- The `deferredRead` swallow covers any `NotLoadedError`, including the moon-fit one. Before O-102 that error was thrown at build time. It is not separately probed: I-211's fix should decide the general rule.

## Gates (this session, real times UTC)

| Gate | Start | Result |
|---|---|---|
| `git diff --check main...HEAD` | 00:39 | clean |
| `npm run lint` | 00:39 | pass, 7 s |
| `npm run typecheck` | 00:39 | pass, 8 s |
| `npm run build` | 00:39 | pass, 3 s |
| `npm test` (junit) | 00:39 | pass, 46 s: 361 files, 5776 passed, 2 skipped |
| `npm run check:pack` | 00:40 | pass, 25 s; engine 1,849,129 B raw / 530,427 B gzip (limits 1,850,000 / 530,500) |
| `npm run check:node-consumer` | 00:42 | pass (12 tests); does not cover data-package positions (I-210) |
| `npm run check:public-build` | 00:43 | pass (`docs/evidence/public-build-20261127T004310Z`) |
| `npm run measure:example` | 00:43 | first-open total 1,849,129 / 530,427 |
| `npm run check:browser -- --tier quick --step look-out` | 00:45:27 | exit 0, 8 steps, 198 s (limit 280 s), error-lines 0: smoke 45 s, smoke-public-showers 5 s, planets-phone 9 s, look-out 71 s, hello-scene 15 s, hello-react 3 s, hello-planets 3 s, hello-sky 22 s. Evidence `docs/evidence/browser-quick-20261127T004528Z` |
| `savepoint health check O-102` | 00:48:57 | snapshot above, "does not block clearance" |

How the browser steps were chosen: quick tier plus `look-out`, because the diff touches Packaging (`tools/check-packs.mjs`). The packed examples were kept (no `--skip-examples`) because `api/index.ts` and `api-surface.lock.json` changed. No other step's paths are touched. `engine-budget.mjs` is a validate script but belongs to no browser step: it is run by `check:pack`. `engine-alone` was not run because no `package.json`, build config or engine import of a new library changed (orb was already allowed in core).

## Code Health

Snapshot `sha256:598dc83ab48d4a303d0a140d07d9c3d34fae73ad430c63dd80887b8dbaa9402a`: does not block clearance. Complexity, vulnerabilities and duplication: no finding. Coverage and the junit tests report are stale. That is a collection note, not a finding: coverage refreshes only at release, and this session ran probe vitest runs after the junit one. The two Issue files were moved aside while the snapshot was taken, because the health loader refuses Issues that name a Check not yet written, and then restored unchanged.

## Issues

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-210 Ceres positions fail in plain Node (and likely in default-only JSON bundlers) | Medium: any Node/SSR `scene.load` or non-Vite host using Ceres | Medium: Ceres unusable there, with a misleading `bad-data` | Medium | Fix now: the import attribute plus `default ?? module`, on both sides, with a packed-Node proof |
| I-211 Auto stretches (and camera fit) dropped for Ceres scenes after the first load | Medium: needs Ceres plus an auto path or a fit, and any second scene or `scene.load` first | Medium: wrong line fixing, silently; API-03 same-scene-differs | Medium | Fix now with I-210, in one narrow repair: retry deferred reads in `prepare`, or install package series before the build reads |

`unmet`: O-102 SC1 (I-210), API-03 (I-211).

## Owner validation still needed

T-468 declares `owner_validation.required`. The owner's look passed on 2026-11-27T00:40Z ("fine, list it as breaking"). The coordinator may record `accepted_check: C-226` for that look, because it covers appearance, not I-210 or I-211. No prior owner acceptance or exception on O-102 to carry forward (first Check). The cap raises and the 2k picture are owner decisions recorded in the Task files, not structured exceptions.

## Observations (non-blocking)

1. Objective.md SC4 still says "no engine cap raise". The owner superseded that twice, and the decisions are recorded in T-465/T-467 and `engine-budget.mjs`, but not in the Objective's Decisions section.
2. `processMoonData` is a process-wide store in shipped core that exists only so `bodyMarkers.test.ts` can resolve Ceres without a scene. The general fix is for that test to resolve through a scene-bound catalogue and to drop the fallback. That would also remove the test/production divergence.
3. `astraeus-data`'s README (picture list, "what it adds") and CHANGELOG say nothing about Ceres's map or positions yet. Its CHANGELOG has no open section: add a 0.13.0 entry at release at the latest (`dataSource` now provides a body and `data/positions/` ships).
4. The ecliptic-to-EQJ duplication in `packageSeriesBinding` (T-465 follow-up) is not yet captured as an Issue.
5. The `packages/astraeus-data` `exports` source map includes `./data/*`, but `x-publish.exports` does not. That is harmless, since the loader imports relatively.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches**: the default-only JSON module and the already-loaded planet series branches are untested (I-210, I-211).
- [x] STYLE-04 **Types document intent**
- [ ] STYLE-05 **Build only what is needed**: `processMoonData` exists for one test (`core/moonData.ts`).
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth**: the ecliptic-to-EQJ turn is repeated in `core/bodies/planetTrajectory.ts` `packageSeriesBinding`.
- [ ] STYLE-08 **Comments explain why**: the `deferredRead` comment says a not-loaded read is "read again in `prepare`", which is untrue for auto paths and the fit.
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
