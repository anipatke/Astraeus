---
id: C-197
scope: {kind: objective, id: O-083}
result: CLEAR
checked_by: {role: checker, session: check-o083-orchestrator-20261121}
executed_session: orchestrate-g024-20261121 (Sonnet builders for T-343..T-353)
checked_at: '2026-11-21T12:08:15Z'
health_snapshot: sha256:97d82ac825ce264b3a5a95ba5e7e98e785d17e1049d399ec955d15c73de00bc7
reviewed:
  base_commit: fb77e8e9
  head_commit: cb342597
  files: [packages/astraeus-demo-planets/data/planets/jupiter.json, packages/astraeus-demo-showers/tests/rebuildComparison.test.ts, packages/astraeus-site/tests/apiRules.test.ts, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, packages/astraeus/api-surface.lock.json, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/data.ts, packages/astraeus/src/api/definitionOf.ts, packages/astraeus/src/api/elementsRecord.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/planBodies.ts, packages/astraeus/src/api/planPaths.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/time.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/viewerLooks.ts, packages/astraeus/src/api/views.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/catalogueItem.ts, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/src/app/liveLook.ts, packages/astraeus/src/app/sceneFraming.ts, packages/astraeus/src/app/viewLink.ts, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/core/bodies/earth.ts, packages/astraeus/src/core/bodies/io.ts, packages/astraeus/src/core/bodies/jupiter.ts, packages/astraeus/src/core/bodies/jupiterMoons.ts, packages/astraeus/src/core/bodies/listedMoonBodies.ts, packages/astraeus/src/core/bodies/mars.ts, packages/astraeus/src/core/bodies/mercury.ts, packages/astraeus/src/core/bodies/moon.ts, packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus/src/core/bodies/outerPlanets.ts, packages/astraeus/src/core/bodies/planetMoons.ts, packages/astraeus/src/core/bodies/venus.ts, packages/astraeus/src/core/body.ts, packages/astraeus/src/core/pacing.ts, packages/astraeus/src/core/referenceCenters.ts, packages/astraeus/src/core/scalePolicy.ts, packages/astraeus/src/core/stateResolver.ts, packages/astraeus/src/core/timeInput.ts, packages/astraeus/src/shell/ScaleControl.tsx, packages/astraeus/src/shell/scaleModel.ts, packages/astraeus/tests/apiImports.test.ts, packages/astraeus/tests/astraeusSceneBadScene.test.ts, packages/astraeus/tests/astraeusSceneConsole.test.ts, packages/astraeus/tests/composedVelocity.test.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/tests/glowAndHooksDom.test.ts, packages/astraeus/tests/jupiterIo.test.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/orientationLabels.test.ts, packages/astraeus/tests/planetMoonSystems.test.ts, packages/astraeus/tests/positionLimitations.test.ts, packages/astraeus/tests/publicApiSunOrbits.test.ts, packages/astraeus/tests/publicErrorContract.test.ts, packages/astraeus/tests/reversePacing.test.ts, packages/astraeus/tests/scaleChoice.test.ts, packages/astraeus/tests/timeText.test.ts, packages/astraeus/tests/tooManyBodiesMount.test.ts, tools/api-rules.mjs]
  dependencies: []
issues: []
supersedes: null
---

# C-197: O-083 Full Objective Check

Run by the orchestrating session under G-024 decision 7 ("Orchestrator session runs it"); this session planned and reconciled Design but did not build T-343..T-353 (Sonnet builders did). Diff `fb77e8e9..cb342597` (66 package/tool files, +1,205/−232). Step checks waived on all eleven Tasks.

**Result: CLEAR.** No Issues.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (data package read: unreadable/unparsable → `bad-data`, proven in `publicErrorContract`; other cells not applicable)
- [x] Workflow And Side-Effect Check Lock (not applicable: no persistence; mount refusal before attach proven)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; up to four builders ran side by side; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria: the eight O-083 Success Conditions and the twelve planner Decisions; T-343..T-353 Done When; API-01..API-07, PROV-01, ARCH-04, TEST-01..04; Full Check gates; browser tier per decision 1 (whole `check:browser`, a superset, since the quick tier arrives with O-086).
2. Entry points: `Scene.stateOf`, `setTime`, `setTimeline`, story panel `at.time`, page address `t`, `mount`, `AstraeusScene`, `load`, `check`, `setViews`, `addTrajectory`, `parseElementsBodyRecord`, data package load, `setScale`/`scales`/`ViewerChange.scale`, body cards (`catalogueItem`), pacing with a negative opening rate.
3. Relied-on: `EphemerisChunkMissingError`/`TrajectoryOutOfRangeError`/`TimeScaleOutOfRangeError` classes, the IAU rotation records, `tools/api-rules.mjs`, `api-surface.lock.json`, `migrationTable.test.ts`.
4. Matrix: time text {date-only, Z, +offset, −offset with fraction, zone-less with/without seconds, free form, space separator, empty, lowercase z} × {setTime, stateOf} (plus the builders' six-entry table × three zones); error causes {planet before/after series, moon before package, moon outside loaded data, missing package, unreadable package, non-Scene, 30 vs 31 lit, bad views, bad samples, bad elements}; scale {three ids, unknown id typed and untyped}; velocity {parent, grandparent, sibling, inverse, a leg without velocity, body about itself}; pacing {forward, backward step, view-switch ease}; labels {13 IAU moons, tidal-lock moons, Io, demo override}.
5. Admission: supported public paths against the criteria above.

## Coverage

- **Span refusals** (T-343): Proven. `publicErrorContract.test.ts` 17 rows (16 of 17 raw before); my probe: Jupiter 1940 and 2100 `out-of-span`, 2000 answers, Earth 1900 answers.
- **Other raw throws coded; API-05 covers re-exports** (T-344): Proven. Rows for `bad-scene`, `bad-view`, `bad-trajectory`, `bad-element`, `bad-data`; re-export sample planted in `apiRules.test.ts`; allowlist untouched. My probe: `mount(div, {})` → `bad-scene` in happy-dom.
- **React default** (T-347): Proven. `astraeusSceneConsole.test.ts` (three causes logged without `onError`; none with it).
- **Zone-less text refused** (T-348): Proven. Builder table 15 texts × 6 entry points × 3 zones (128 red first); my probe 10 texts × {setTime, stateOf}, all as specified; date-only equals the `Z` midnight state.
- **Scale closed** (T-346): Proven. `scaleChoice.test.ts` (`expectTypeOf`, `@ts-expect-error` on unknown ids), runtime `bad-scale` kept; migration row named in the 0.10.0 breaking list.
- **Labels and limits** (T-349, T-350): Proven. `orientationLabels.test.ts` checks each label against the observed state (29 red first); `positionLimitations.test.ts` 23 cases (21 red first); Earth's card unchanged; scene pin diffs limited to the sentences.
- **Composed velocity** (T-351): Proven. `composedVelocity.test.ts` against a finite-difference oracle; my probe: Io about Jupiter 17.39 km/s.
- **Lit-body refusal** (T-345): Proven. 31 lit → `too-many-bodies` at `check` and `mount` (red shown by the coordinator with HEAD's `assembleScene.ts`), 30 lit + 5 markers pass; one shared `MAX_LIT_BODIES`.
- **Reverse pacing** (T-352): Proven reachable (`setTimeline({ rate: -3600, pacing })`) and fixed; `reversePacing.test.ts` 5 rows red first.
- **Docs** (T-353): Proven. README rows, CHANGELOG 0.10.0 Fixed/Added/Changed and a breaking-changes list, lock, error table (`api:errors` no diff); Design reconciled (commit 4cdcc2bb).
- **Existing tests**: changed assertions only where an Objective decision says so (`jupiterIo`, `planetMoonSystems` labels; `rebuildComparison` limits, coordinator decision), type-only casts on three deliberately invalid inputs, `apiImports` ALLOWED list; no fixture or setup changed.

## Gates (this session)

- `git diff --check` clean; `lint` 0 (5 s); `typecheck` 0 (10 s); `build` 0 (3 s); `test:full` 0: 301 files, 5025 passed, 2 skipped (83 s).
- `check:engine-alone` pass (29 s; 227 files, 3841 passed); `check:pack` pass (16 s); `check:node-consumer` pass (10 s); `check:react-consumer` pass (React 19.3.1 installed = newest); `measure:example` first-open 1,832,087 / 524,093 B gzip (+3,608 / +1,525 vs O-082).
- `npm run check:browser` once: exit 0, every step exit 0; evidence `docs/evidence/browser-20261121T120038Z`. Time warnings (look-out 103 s / 75, hello-sky 24 s / 15, total 382 s / 320) are the known AH-29 overrun owned by O-086.
- `savepoint health check O-083`: snapshot above, "does not block clearance".

## Adversarial pass

Lowercase `z` and a space separator are refused (stricter than `Date.parse`; within the decision's "every other text is refused"); a fake element to `mount` gives `bad-element` before the scene is read (element first), a real element with a non-Scene gives `bad-scene`; a moon with the package but an unloaded chunk is `bad-time`, not `out-of-span`; marker bodies do not count toward the lit limit; `body === centre` still has no velocity.

## Materiality

No Issues; no materiality actions required.

## Owner Decisions

No owner acceptance or exception on O-083; no `carried_forward` entries. No Task requires owner validation.

## Observations (non-blocking)

- `migrationTable.test.ts` reads only the 0.7.0→0.8.0 table (it compares the 0.7.0 surface with today's lock), so the 0.10.0 `ScalePolicy.id` row had to sit there, prefixed "From 0.10.0 (O-083)". A test that compares against the previous release would fit better; candidate for O-088 (text pins) or O-090 (docs).
- Planets, Earth, the Moon and elements bodies still report position only (by design of T-351); Io from the Sun therefore has no velocity.

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
- [ ] STYLE-10 **Small diffs** — 66 files across eleven Tasks; each Task's share is proportionate, so advisory only.
