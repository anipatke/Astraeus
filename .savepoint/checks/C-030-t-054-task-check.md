---
id: C-030
scope: {kind: task, id: T-054}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261013}
executed_session: t054-builder-2026-10-15
checked_at: '2026-10-15T09:17:50Z'
reviewed:
  base_commit: dc0b9c7
  head_commit: dc0b9c7 (working tree, uncommitted)
  files:
    - src/core/bodies/swiftTuttle.ts
    - src/assets/bodies/swiftTuttle.ts
    - src/core/bodies/index.ts
    - src/assets/catalogue.ts
    - src/core/sunCentredSources.ts
    - src/app/bodyDraw.ts
    - src/app/BodyView.tsx
    - src/app/PathView.ts
    - src/app/sceneFraming.ts
    - src/app/AstraeusScene.tsx
    - src/app/App.tsx
    - src/app/experienceDefinition.ts
    - src/experiences/showers/showerDefinition.ts
    - src/synthetic/syntheticEccentricDefinition.ts
    - src/main.tsx
    - tests/swiftTuttle.test.ts
    - tests/bodyMarkers.test.ts
    - tests/longOrbitPaths.test.ts
    - tests/scalePolicies.ts
    - tests/fixtures/swift-tuttle-horizons-source.txt
    - tests/fixtures/swift-tuttle-horizons.json
    - tools/validate/browser-synthetic-eccentric.mjs
    - tools/validate/browser-marker-existing.mjs
    - docs/ASTRONOMY_VALIDATION.md
  dependencies: [T-051]
issues: []
supersedes: null
---

# C-030: T-054 Task Check (Quick)

Checker: the O-011 orchestrator session. The Sonnet builder sub-session is separate.

## Scope Lock

1. Done When 1–5 of T-054. The owner look is not required; T-038 carries it.
2. Changed files: as listed. `src/experiences/showers/showerDefinition.ts`, `App.tsx`, `AstraeusScene.tsx`, `experienceDefinition.ts`, `sunCentredSources.ts` and `main.tsx` fall outside planned_writes; the builder recorded each with its reason.
3. Out of scope: Perseids' own look (T-038).

## Acceptance Coverage

| DW | Result | Independent evidence |
|----|--------|----------------------|
| 1 Comet definition and Horizons check | Proven | Checker fetched SBDB live (2026-10-15T09:17:50Z): solution date 2001-10-09, epoch 2450000.5, e 0.963225755046038, a 26.0920694978266, i 113.453816997171, Ω 139.3811920815948, ω 152.9821676305871, M 7.631696167124212. All match the definition exactly. Checker fetched Horizons vectors (ICRF, Sun centre, UT) for 2006-01-01 and 2026-08-12 (the Perseid peak date) and compared them with `createSwiftTuttleTrajectory().stateAt` through a temporary test, deleted after the run. Errors were 4,501,400 km (0.114% of r, r = 26.3 AU) and 9,382,470 km (0.146%, r = 42.9 AU), consistent with the builder's eight-date maximum of 10,686,093 km and 0.857% at perihelion. Classified "approximate" (under 1% of Sun distance), and the limitations state two-body motion with no perturbations or non-gravitational forces. Radius 13 km is cited. |
| 2 Marker rule | Proven | `drawsAsMarker` is tested at the boundary values, threshold 0 never swaps, and State is untouched. The checker viewed `marker-existing/earth-moon-true-rule-on.png`: the Moon draws as a labelled marker at True overview. The threshold is a setting (Developer slider, `?markerpx=`), per the owner's preference. |
| 3 Eccentric sampling | Proven (builder figures, code reviewed) | At e = 0.96 and 512 samples, the chord ratio is 1.373 by time against 0.086 by eccentric anomaly, a 16.0× improvement against a limit of 10×. The path passes through the source's own positions (tested). |
| 4 Framing and 50 AU precision | Proven | The checker viewed `synthetic-eccentric/desktop-long-orbit-framed.png`: the whole 1–51 AU orbit is in view. Precision at 50.96 AU by the `browser-precision.mjs` method: 0 px static and a 0.0019 px sweep. |
| 5 Name check, gates, browser | Proven | Checker grep: the comet's name outside `src/core/bodies` and `src/assets/bodies` appears only in `src/assets/catalogue.ts`, as its import line (the catalogue is the registry). Checker gates at 2026-10-15T09:17:50Z: typecheck 0, build 0, vitest 36 files and 654 tests passed. The builder ran 15 browser scripts into `docs/evidence/o011-t054-20261015T085030Z/`, each with its own log, all exit 0 with no errors. Historical evidence unchanged (checker `git status`). |

## Issues

None.

## Observations (non-blocking)

1. **Visible changes to existing experiences.** The owner must be told: at True overview the Moon (Earth–Moon), Io (Jupiter–Io) and Earth (Perseids) now draw as labelled markers; Apollo's default and Readable scale are unchanged. These follow from the generic rule this Task set out to add.
2. **Shower builder edit.** `createPlanetOrbitPathLayers` now skips a catalogued body whose turn cannot be found within the search, so the comet is not drawn as a planet orbit. A test holds the four planet orbits unchanged. T-038 owns the shower builder and should draw the comet's orbit deliberately through the new eccentric sampling.
3. **Wall-clock test.** The 30,000-member fill timing in `tests/listedOrbitGroup.test.ts` failed once while a build ran at the same time. It passes alone and in full runs. That makes it a possible flake under load, so watch it at the Full Objective Check.
4. Drift notes 1–7 in the Task are for T-040.
