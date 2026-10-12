---
id: C-019
scope: {kind: task, id: T-045}
result: CLEAR
checked_by: {role: checker, session: o014-orchestrator-check-20261012}
executed_session: o014-t045-executor
checked_at: '2026-10-12T08:45:00Z'
reviewed:
  base_commit: 15c381f
  head_commit: 882fa1c
  files:
    - src/app/pathRules.ts
    - src/app/PathView.ts
    - src/app/SunCentredView.ts
    - src/app/orbitPath.ts
    - src/app/experienceDefinition.ts
    - src/app/AstraeusScene.tsx
    - src/app/TrackedBodyView.ts
    - src/app/mission.ts
    - src/core/sunCentredSources.ts
    - src/synthetic/syntheticRingDefinition.ts
    - tests/paths.test.ts
    - tests/sunCentred.test.ts
    - tests/sceneTransforms.test.ts
    - tests/controls.test.ts
    - tests/missionScene.test.ts
    - tools/validate/browser-precision.mjs
    - tools/validate/browser-synthetic-belt.mjs
  dependencies: []
issues: []
supersedes: null
---

# C-019: T-045 Task Check (Quick)

Independence: orchestrator checker session; T-045 was built by a separate Sonnet executor sub-session. `SunCentredView.ts` was renamed to `PathView.ts` and `orbitPath.ts` deleted (intentional, recorded in the Task evidence).

## Scope Lock

1. Done When 1–6 of T-045; Issue I-020 (assigned here); ARCH-02, ARCH-03, TEST-01, TEST-02, TEST-03, browser regression maintenance and historical evidence rules, STYLE.
2. Changed files in `reviewed.files` (working tree over 882fa1c).
3. Out of scope: the planets' paths (T-049), `sunEarthSystem` declaring Earth's path (T-047).

## Outcome Coverage

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `PathLayer` orbit/trail union; validation names the field; belt migrated | Proven | `src/app/experienceDefinition.ts` `PathRule`/`validatePathSpec`; checker probe: bad kind → "kind", bad frame → "frame", uncatalogued centre → "center", even rolling sample count → "odd", reversed span → "after", failing source → "cannot give" |
| 2 | Rule tests on made-up sources | Proven | `tests/paths.test.ts`; checker's own oracle (root r, centre c moving at 1 km/ms, body b fixed): inertial trail of the stationary body collapses to one point at the display time; relative trail is unchanged when the source centre is the scene centre and mirrors the centre's motion in a root-centred scene; orbit is one rigid translation and returns the input when its centre is the scene centre |
| 3 | Earth–Moon composition declares the Moon's monthly orbit; vertices equal old `sampleOrbitPath` at three dates; refresh policy kept; Moon-specific `orbitPath.ts` removed | Proven | frozen copy of the removed sampler in `tests/paths.test.ts`; `pathNeedsRefresh` keeps the old policy constants; `orbitPath.ts` deleted |
| 4 | `TrackedBodyView` relative trail, Apollo vertex equality at three times; inertial Columbia in a Sun-centred scene | Proven | `tests/paths.test.ts` / `tests/missionScene.test.ts`; Apollo browser scripts `spike02`, `spike03`, `anchor-labels` pass |
| 5 | Precision at 1 AU, 60 frames, both focuses, recorded with method; REPLAN if >1 px on the focused body | Proven | `docs/evidence/o014-t045-20261012T075844/run/precision/precision.json` (method in `tools/validate/browser-precision.mjs`): focused Earth centre ≤1.3e-12 px; Sun-marker focus with Earth at 0.98 AU from the GPU origin: Earth centre 1e-9 px still / 5.8e-4 px sweep residual, near-Earth path vertex 3e-8 / 5.6e-4 px. All far below 1 px; no REPLAN |
| 6 | Gates; every browser script in a fresh run directory | Proven | `run/results.txt`: all nine scripts exit 0 with zero console errors, including `synthetic-belt` (I-020 repaired) and the new `precision` script |

## I-020

Cause (executor, confirmed by the controlled renderOrder 0/1 run): transparent belt dots depth-sorted after the path line painted over Earth's 1 AU circle. Repair: path lines draw with `renderOrder` 1. Assertion and threshold unchanged. Checker viewed `run/synthetic-belt/desktop-composition-true-start-earth-on-path.png`: Earth's path line is clearly drawn through Earth's label. I-020 closed as `verified` against this Check.

## Gates (checker, 2026-10-12T08:40Z)

- `npm run typecheck` — exit 0
- `npm run build` — exit 0
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` — 25 files, 494 tests passed
- `git diff --check` — clean
- Checker probe (4 cases) passed and was removed.

## Issues

None opened. No materiality actions are required.

## Observations (non-blocking)

1. Precision is projected in Float64 from the Float32 buffers the GPU receives under a software renderer; the GPU's own Float32 matrix arithmetic is not in the figures. With Earth focused close up, the chosen path vertex is off screen, so the near-Earth path figure is meaningful only for the Sun-marker focus.
2. A rolling span's source is not probed at validation time; an unusable one throws on first sync (drift note).
3. Evidence holds 69 PNGs (screenshots are now git-ignored, so they stay local).

## Owner Validation Still Needed

None (`owner_validation.required: false`).

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
