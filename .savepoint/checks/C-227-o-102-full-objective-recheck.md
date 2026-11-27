---
id: C-227
scope: {kind: objective, id: O-102}
result: CLEAR
checked_by: {role: checker, session: recheck-o102-20261127}
executed_session: repair-o102-c226-20261127 (repair); orchestrate-o102-20261127 (T-464..T-468 builders and coordinator)
checked_at: '2026-11-27T01:14:00Z'
health_snapshot: sha256:a518776d26fd3575d00ffc06a3eb54b6b9b7b00df6e6e4101632daa785f1d046
reviewed:
  base_commit: 6fc63340
  head_commit: 186c445a
  files: [packages/astraeus-data/src/index.ts, packages/astraeus-data/CHANGELOG.md, packages/astraeus-data/README.md, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/data.ts, packages/astraeus/src/api/planCamera.ts, packages/astraeus/src/api/planPaths.ts, packages/astraeus/tests/bodyPositionsData.test.ts, packages/astraeus/tests/ceresDeferredReads.cases.ts, packages/astraeus/tests/ceresDeferredReads.test.ts, packages/astraeus/tests/cold/ceresDeferredReads.test.ts, tools/check-node-consumer.mjs]
  dependencies: []
issues: []
supersedes: C-226
---

# C-227: O-102 Full Objective Recheck

Fresh session; it did not plan, build, coordinate or repair O-102, and did not run C-226. Recheck under C-226's frozen scope lock and matrix (Full mode). Diff `git diff main...o102-ceres-globe` (main 6fc63340, head 186c445a; 55 files outside `.savepoint`). The repair is commit 186c445a; `reviewed.files` lists the files it changed. All other files are as C-226 reviewed them at 7e9b5d0d. Out of scope, as before: the uncommitted T-388 (O-086) change, untracked `docs/evidence/*` and `docs/research`.

**Result: CLEAR.** Both C-226 Issues are repaired, and my own probes prove it: the packed packages in plain Node, and the scene built twice, cold and preloaded, with and without Ceres. They also fail against the pre-repair engine. Every gate passes.

## Closure map of prior Issues

| Issue | State | Basis |
|---|---|---|
| I-210 Ceres positions fail in plain Node | **Closed (verified)** | Packed-tarball plain-Node probe and the new `check:node-consumer` case (below) |
| I-211 Auto stretches and camera fit dropped once planet series are loaded | **Closed (verified)** | Twice-built table probe, cold and preloaded, with and without Ceres, and interleaved builds. The same probe fails on edd5411e (below) |

I-212 (low, drift, opened by the coordinator) stays open. It is not part of the acceptance: both of its points are advisory STYLE/cleanup items that C-226 recorded as observations, outside the Issue-admission test.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-226's lock, unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-226's matrix, rerun below)
- [x] Finite External-Boundary Matrix (packed packages in plain Node; the browser runner used its own servers, and the owner's :5490 was left alone)
- [x] Workflow And Side-Effect Check Lock (mount/`prepare` read order, now: check, `statesIn`, setup reads or none, load planet series, span, `installData`, deferred reads)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission ledger

| # | Recheck item | Prior Issue / claim | Frozen cell (C-226) | Allowed result |
|---|---|---|---|---|
| L1 | Packed plain-Node `scene.load` with Ceres, position vs archived Horizons | I-210 | "SC1 Ceres with astraeus-data, plain Node packed" | blocking |
| L2 | Loader result shapes: file itself, Node default-only, Vite default+named; malformed inside default | I-210 | "`bodyPositions` loader result" + "`bodyPositions` input shape" | blocking |
| L3 | Auto path with Ceres: first build vs later build, cold and preloaded, vs no-Ceres reference | I-211 | "State: first scene vs later scene (planet series loaded)" | blocking |
| L4 | Camera fit to Ceres after the swallow's removal | I-211 | "Camera fit to Ceres after the swallow" | blocking |
| L5 | Sun-orbit lines (`orbit: true`) with Ceres, now gated by `statesIn` | remediation path (`earlySunPaths`) | "State: Sun-orbit lines after the swallow" | blocking |
| L6 | Two scenes built before either prepares, prepared in reverse order | I-211 (API-03) | "Two viewers / per-scene series" | blocking |
| L7 | Clump group (`lateGroups(statesIn)`) and a planet fit in a Ceres scene | remediation's changed code path | adjacent to L3/L4 (same `statesIn` gate) | blocking |
| L8 | Moon scene with an auto path after the swallow's removal | C-226 adversarial note (moon-fit `NotLoadedError`) | none exact | observation only |

## Coverage matrix (rerun)

| Row | Cells | Evidence (this session) | Result |
|---|---|---|---|
| SC1 Vite | mount, load, check | `ceresBody.test.ts`, `planetViews.test.ts` in `npm test`; browser smoke and planets-phone green | Pass |
| SC1 plain Node packed (L1) | `scene.load` | Own probe: `npm pack packages/{astraeus,astraeus-data}/dist`, tarballs unpacked into a scratch consumer, Node 24.16.0. `await scene.load({ data: [dataSource] })` resolves. `stateOf("ceres")` vs archived Horizons (JPL#48, ICRF, Sun-centred): 1987-03-17 TDB 12:34:56 (UTC 12:34:00.816, a date the builder's proof did not use) **0.162 km**; 2038-11-02 **0.061 km**. Packed `dist/src/index.js` carries `{ with: { type: "json" } }`. `check:node-consumer` 13 passed, including the new Ceres case | Pass |
| SC1 without package | load | Probe: `missing-data` "ceres needs the astraeus-data package"; scene without Ceres: the Ceres loader is called 0 times | Pass |
| Loader result (L2) | file, Node namespace `{default}`, Vite `{...file, default}`; `{default: null}`, `{default: "x"}`, `{}` | Probe in plain Node, through a custom `DataSource`: the three valid shapes give 0.061 km. The three bad shapes give `bad-data` "bodyPositions.ceres: … format must be …". `bodyPositionsData.test.ts` 9 rows green | Pass |
| SC2 fit / boundaries | as C-226 | `ceresFit.test.ts`, `ceresBody.test.ts` green. Probe: a 2046-2047 window without `orbit` resolves `load`, and `stateOf` throws `out-of-span` (unchanged semantics) | Pass |
| SC3-SC6 | as C-226 | Unchanged by the repair. Tests green; API lock, CHANGELOG breaking entry and `releaseBreaks` green | Pass |
| SC4 first download | | `measure:example` first-open 1,849,338 / 530,471, within the owner-raised 1,850,000 / 530,500 (+209 / +44 since C-226; headroom 662 B raw, 29 B gzip) | Pass (by owner decision) |
| State first vs later (L3) | cold build 1 (nothing loaded), cold build 2 (planet series loaded), preloaded builds 1 and 2 | Own throwaway vitest probe (`cold` and `preloaded` projects; fresh module graph per cold run; deleted after). Scene: Sun, Earth and Jupiter (`orbit: true`), Ceres (`orbit: true`), a 60-day `lineFixedTo: "auto"` probe at Ceres+15,000 km on days 20-29 and Earth+200,000 km on days 40-49, a clump group near Jupiter, `fitOrbit(ceres)`. Every build gives stretches `sun@0, ceres@20, sun@30, earth@40, sun@50`, and build 1 equals build 2 in both projects. The no-Ceres scene gives `sun@0, earth@40, sun@50` | Pass |
| Camera fit (L4) | `fitOrbit(ceres)` | `farthestKm` 446,702,084.85 km in every build. Independent oracle: max of the Sun distance of `stateOf("ceres")` sampled daily over ±1,690 days = 446,702,108.8 km (24 km apart, which is daily sampling). `fitOrbit(earth)` in a Ceres scene = 152,087,769.7 km, equal to the no-Ceres scene | Pass |
| Sun-orbit lines (L5) | `orbit: true` with Ceres | Paths exactly `ceres-orbit, earth-orbit, jupiter-orbit`: no duplicates and none missing, in every build | Pass |
| Two scenes / per-scene series (L6) | A (Ceres, fit Earth), B (Ceres, fit Ceres), N (no Ceres), all built before any prepare, prepared B, N, A | Each matches its sequential twin. A's stretches include Ceres, and N's do not | Pass |
| Groups (L7) | clump near Jupiter | `groups: ["ring"]` in every build, with and without Ceres | Pass |
| Discrimination | same L3-L7 probe on edd5411e (pre-repair), in a temporary detached worktree, removed after | Preloaded fails on build 1, cold on build 2 (`lineFixedTo` undefined), as I-211 reported | Probe is sound |

**Scope of planPaths.ts and planCamera.ts.** They fall within I-211. The Issue names `planPaths.ts:369-381` (`autoPaths`'s `later = pending && !planetSeriesLoaded()`) and `fitFarthestKm` as the two reads that failed. The change replaces each one's private `planetSeriesLoaded()` test with the caller's `statesIn` parameter: a 6-line diff per file, with no behaviour change when no package body is pending. That is the root-cause fix C-226 recommended ("retry deferred reads in `prepare`, or install package series before the build reads"), not a widening. Being outside T-467's planned writes is advisory (Parallel Planning Advice) and not a finding.

## Adversarial notes

- `awaitsBodyPositions` repeats `installData`'s own condition (store present, body in the scene, series not yet in the store). The two decide alike, so a body is read before `installData` exactly when its series is already in the store. Rebuilding the same `Scene` after `prepare` finds the series stored and reads at once, which is correct.
- The `NotLoadedError` swallow is gone, so a real not-loaded read at build time throws again. `deferredRead`'s comment now matches the code (C-226's STYLE-08 note is resolved).
- L8 (observation, no frozen cell): a Jupiter + Io scene with an auto path, built with `astraeus-data-jupiter` in `data` while the planet series are loaded and the moon fits are not, throws `NotLoadedError` ("Jupiter's moon fits are not loaded: await the system's load before mounting…") at `definitionOf`. **On main 6fc63340 it does exactly the same** (temporary worktree probe). This is the pre-O-102 behaviour, which the repair restores. It is not introduced by O-102. See Observation 2.

## Gates (this session, real times UTC, 2026-11-27)

| Gate | Start | Result |
|---|---|---|
| `git diff --check main...HEAD` | 01:00 | clean |
| `npm run lint` | 01:00:23 | pass, 16 s (limit 15 s: 1 s over, wall-clock noise; it ran under the shared lock) |
| `npm run typecheck` | 01:00:39 | pass, 8 s |
| `npm run build` | 01:00:47 | pass, 3 s |
| `npm test` (junit) | 01:00:50 | pass, 43 s: 363 files, 5787 passed, 2 skipped (5789), 0 failures |
| `npm run check:pack` | 01:01:47 | pass, 22 s; engine 1,849,338 B raw / 530,471 B gzip (limits 1,850,000 / 530,500) |
| `npm run check:node-consumer` | 01:02:09 | pass, 10 s, 13 tests (incl. the Ceres plain-Node case) |
| `npm run check:public-build` | 01:02:19 | pass (`docs/evidence/public-build-20261127T010219Z`) |
| `npm run measure:example` | 01:02:23 | first-open total 1,849,338 / 530,471 |
| `npm run check:browser -- --tier quick --step look-out --step views` | 01:08:23 | exit 0, 9 steps, 216 s, error-lines 0: smoke 45 s, smoke-public-showers 5 s, planets-phone 9 s, views 21 s, look-out 70 s, hello-scene 12 s, hello-react 3 s, hello-planets 6 s, hello-sky 18 s. Evidence `docs/evidence/browser-quick-20261127T010823Z` |
| `savepoint health check O-102` | 01:12:05 | snapshot above, "does not block clearance" |

How the browser steps were chosen. The repair changed engine code, so C-226's run (`browser-quick-20261127T004528Z`, before the repair) could not be reused. I made one fresh run. It used the quick tier plus `look-out`, because the Objective diff touches Packaging (`tools/check-packs.mjs`) and the Camera path `packages/astraeus/src/api/planCamera.ts`. I added `views` because `planCamera.ts` is a Camera path, and Camera paths are among `views`' own paths. I kept the packed examples (no `--skip-examples`) because `api/index.ts` and `api-surface.lock.json` changed. No path of `orbit-lines`, `two-viewers`, `synthetic-journey`, `meteor-shower`, `group-labels` or `catalogue` is touched. I did not run `engine-alone`, because no `package.json`, build config or engine library import changed.

## Code Health

Snapshot `sha256:a518776d26fd3575d00ffc06a3eb54b6b9b7b00df6e6e4101632daa785f1d046`: does not block clearance. Complexity, vulnerabilities and duplication have no finding. Coverage and the junit tests report are marked stale. That is a collection note, not a finding: coverage refreshes only at release, and the junit report (written 01:01:32Z by this session's `npm test`, 5789 tests, 0 failures) predates this session's throwaway probe files, which have since been deleted.

## Issues

No Issues: no materiality actions are required.

## Owner decisions

No structured owner acceptance or exception is recorded on O-102 yet, so there is nothing to carry forward. T-468 declares `owner_validation.required` and has no `accepted_check`. The owner's look passed on 2026-11-27 ("fine, list it as breaking"; T-468 evidence). It covers the appearance of the picker and globe, which the repair did not change: no file under `packages/astraeus-demo-planets`, no texture and no visual code was touched. The owner may record acceptance of T-468 against C-227. The cap raises and the 2k picture remain owner decisions recorded in the Task files and in SC4's text.

## Readiness for owner closure

T-464..T-467 are done. T-468 is `in_progress`/`audit` and needs the owner's recorded acceptance and `status: done`. Once that is done, every owned Task is done and this mandatory Objective Check is current and CLEAR. The material Issues linked to C-226 (I-210, I-211) are closed as verified. I-212 is low-severity drift, linked to C-226 as its source but not a material defect. The owner may accept the O-102 outcome.

## Observations (non-blocking)

1. C-226 Observation 1 is resolved: SC4 now records the owner's two cap raises. C-226 Observation 3 is resolved: the `astraeus-data` README and a `## 0.13.0 (unreleased)` CHANGELOG section now cover Ceres. C-226 Observations 2 and 4 are captured as I-212.
2. A moon scene with a `lineFixedTo: "auto"` path (or another setup read of moon states) throws `NotLoadedError` at build time when the planet series are loaded but the moon fits are not (main does the same). The new `statesIn` rule ("read now only when every state the read needs is in hand, else in `prepare` after `installData`") is the general shape that would also cover moon systems. This is worth a follow-up under the strategic-fix rule, but it is outside O-102.
3. Engine headroom under the owner-raised cap is now 662 B raw and 29 B gzip. The next engine change will likely meet the cap.
4. `npm run lint` took 16 s against its 15 s limit on this run (the runner prints no `WARNING:` itself; that is for `check:gates`). It is noise unless it repeats.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**: the default-only module and the already-loaded planet series branches are now tested (`bodyPositionsData`, `ceresDeferredReads` cold and preloaded, `check:node-consumer`).
- [x] STYLE-04 **Types document intent**
- [ ] STYLE-05 **Build only what is needed**: `processMoonData` still exists for one test (`core/moonData.ts`; I-212).
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth**: the ecliptic-to-EQJ turn is still repeated in `core/bodies/planetTrajectory.ts` `packageSeriesBinding` (I-212). `awaitsBodyPositions` and `installData` each state the same "awaits this body" condition (`api/data.ts`), which a shared predicate could hold.
- [x] STYLE-08 **Comments explain why**: the `deferredRead` comment is corrected.
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
