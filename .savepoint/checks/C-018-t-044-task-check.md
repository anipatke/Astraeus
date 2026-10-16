---
id: C-018
scope: {kind: task, id: T-044}
result: CLEAR
checked_by: {role: checker, session: o014-orchestrator-check-20261012}
executed_session: o014-t044-sonnet-executor-20261011
checked_at: '2026-10-12T08:20:00Z'
reviewed:
  base_commit: b9081fd
  head_commit: 3e881cf
  files:
    - src/assets/compositions.ts
    - src/app/sceneFraming.ts
    - src/app/AstraeusScene.tsx
    - src/app/App.tsx
    - src/app/BodyView.tsx
    - src/app/PointsView.ts
    - src/app/SunCentredView.ts
    - src/app/TrackedBodyView.ts
    - src/app/experienceDefinition.ts
    - src/app/sceneLayout.ts
    - src/core/moonTrajectory.ts
    - src/synthetic/syntheticRingDefinition.ts
    - tests/compositions.test.ts
    - tests/scenePlacement.ts
    - tests/experienceDefinition.test.ts
    - tests/infoProvenance.test.ts
    - tests/metricVisuals.test.ts
    - tests/missionScene.test.ts
    - tests/pointsLayer.test.ts
    - tests/stateResolver.test.ts
    - tests/sunCentred.test.ts
    - tests/syntheticRing.test.ts
    - tools/validate/browser-synthetic-belt.mjs
    - tools/validate/capture-apollo-compare.mjs
    - tools/validate/diff-screenshots.mjs
  dependencies: []
issues: []
supersedes: null
---

# C-018: T-044 Task Check (Quick, mandatory per owner decision)

Independence: orchestrator checker session (2026-10-12); T-044 was built by a separate Sonnet executor sub-session. The rename was committed separately as 3e881cf (behaviour-free; checker inspected that diff: name changes only in `App.tsx`, `AstraeusScene.tsx`, `tests/experienceDefinition.test.ts`; build passed). The generalisation is the uncommitted working tree over 3e881cf.

## Scope Lock

1. Done When 1–8 of T-044; ARCH-02, ARCH-03, ARCH-04, ARCH-05, TEST-01, TEST-03, the browser regression maintenance and historical evidence rules, STYLE.
2. Changed files in `reviewed.files`.
3. Out of scope: path kinds and the AU precision measurement (T-045), I-020 (T-045), experience folder moves and alias retirement (T-047).

## Outcome Coverage

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `earthMoonSystem`, `sunEarthSystem`; ids only; rejects uncatalogued id and centre outside list | Proven | `src/assets/compositions.ts`; `tests/compositions.test.ts:57`; checker probe: empty list, uncatalogued id, centre outside, repeat, zero-span path all rejected; bodies frozen |
| 2 | `composition`, `sceneCenter`; `earth-moon` alias; `usesEarthMoon` results unchanged | Proven | `src/app/experienceDefinition.ts:306–337`; `tests/compositions.test.ts:69–104`; probe: alias → `earthMoonSystem` centre Earth, `sceneCenter: "moon"` accepted, `"sun"` rejected for Earth–Moon, unknown id rejected, bare scene keeps Earth zero and mounts nothing |
| 3 | `AstraeusScene` (rename commit, then generalisation): N `BodyView`s; overview to `sceneCenter`; framing from radii and span, Apollo numbers exact | Proven | `src/app/AstraeusScene.tsx:378–400` maps every composition body (Sun included, closing C-016 observation 1) to `<BodyView>`; overview targets `sceneCenter` (`:287`); `src/app/sceneFraming.ts`; `tests/compositions.test.ts:106–134` asserts Apollo framing exactly under both scales |
| 4 | Tracked, points and paths placed through `resolver.offsetKm`; Moon path unchanged | Proven | `sceneOffsetKm` in `src/app/sceneLayout.ts:385` used by `PointsView`, `TrackedBodyView`, `trackedAbsolute`; returns null (adds nothing) when data centre is the scene centre; `tests/compositions.test.ts:180–187`; probe: in a Moon-centred scene an Earth-measured point at the Moon's position lands at the origin |
| 5 | Moon Sun branch removed; three metric tests on the resolver; equality test guards removal | Proven | `src/core/moonTrajectory.ts`; `tests/metricVisuals.test.ts` (three cases now call `resolver.stateOf("moon", t, "sun")`); `tests/stateResolver.test.ts` compares the resolver against the old branch's formula written out, and a new case asserts `stateAt(t, "sun")` now throws |
| 6 | Invariance (i)–(iii) | Proven | `tests/compositions.test.ts:316–357` |
| 7 | Made-up three-body composition about a non-Earth centre mounts in a test render; belt declares `sunEarthSystem`/`sun` and its script asserts Sun at origin and Earth on its path at two dates, prior scenarios kept | Proven at the placement/mount-object level | `tests/compositions.test.ts:268–315` places, frames, limits, focuses, layers and mounts each body into `Object3D` groups through the scene's own `placeComposition`/`placeBody`; the repo has no React test renderer (as in C-016), so no DOM render. Belt: `src/synthetic/...` declares the composition; `tools/validate/browser-synthetic-belt.mjs` adds the Sun-at-zero, Earth-at-focus and Earth-on-path checks at desktop/phone, True/Readable, two times; prior assertions kept. |
| 8 | Gates; every browser script in a fresh run directory; Apollo pixel-identical by owner's look | Proven for this Task, I-020 unchanged | Run dir `docs/evidence/o014-t044-20261012T073652/`: 7 scripts pass with zero console errors; `synthetic-belt` passes every new T-044 assertion and then fails only at the pre-existing I-020 threshold (`phone/True: Earth's path is drawn (29)`); the HEAD script fails identically on the before tree. Apollo after-vs-before ≤0.066% pixels (full page), below the before-vs-before noise of 0.117%. Owner look pending. |

## Visual Comparison (checker)

Viewed `before/` and `after/apollo-desktop-readable-translunar-overview.png`: identical. Viewed `after/belt-desktop-true-start-overview.png`: the Sun is at the centre with its label, the belt and made-up far path around it; Earth's path line is not visible at True scale, which is I-020 (owned by T-045), not a T-044 regression. The belt Overview reframing (6–13% pixel change) is the intended change (Overview now frames the Sun-centred system).

## Historical Evidence

The executor's first anchor-labels run without an output argument overwrote tracked files under `docs/evidence/regression-spike01-02/anchor-labels`; it restored them with `git checkout`. Checker confirmed `git status` shows no change under `docs/evidence/regression-spike01-02/`. Not a finding (restored, no net change); noted so T-050's browser runs always pass the output directory.

## Gates (checker, 2026-10-12T08:15Z)

- `npm run typecheck` — exit 0
- `npm run build` — exit 0
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` — 24 files, 460 tests passed
- `git diff --check` — clean
- Checker probe (3 cases) passed and was removed.

## Issues

None. No materiality actions are required. I-020 remains open with T-045.

## Observations (non-blocking)

1. `ExperienceRuntime.moon` is still a separate `MoonTrajectory` built in `App.tsx`, outside the resolver (drift note; T-047/T-050).
2. `bodyDraw.drawnRadii` still omits the body id for `mapRadius` (C-017 observation 1) — T-047.
3. The resolver memo holds 64 entries FIFO; relative trails that are re-shifted per sample on a centre change call `offsetKm` once per sample. Only on centre or policy change, so not a frame-rate concern now; worth watching when T-045 generalises paths.
4. The made-up three-body proof is below the React mount; the browser belt run is the real-DOM evidence for a non-Earth centre.

## Owner Validation Still Needed

`owner_validation.required: true`: Apollo at the six telemetry times, True/Readable, desktop/phone, unchanged (screens in `docs/evidence/o014-t044-20261012T073652/{before,after}/`), and the belt with the Sun at the centre. Task stays at `stage: audit` until the owner records acceptance; dependants needing `clear` (T-045, T-048) may start.

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
- [ ] STYLE-10 **Small diffs** — the generalisation is one ~760-line change across 20 files; the Task scope makes this hard to avoid, and the rename was split out as asked.
