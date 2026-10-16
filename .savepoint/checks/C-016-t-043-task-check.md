---
id: C-016
scope: {kind: task, id: T-043}
result: CLEAR
checked_by: {role: checker, session: o014-orchestrator-check-20261011}
executed_session: o014-t043-sonnet-executor-20261011
checked_at: '2026-10-11T10:12:00Z'
reviewed:
  base_commit: ea592a3
  head_commit: ea592a3
  files:
    - src/assets/visual.ts
    - src/assets/licence.ts
    - src/assets/catalogue.ts
    - src/assets/bodies/sun.ts
    - src/assets/bodies/earth.ts
    - src/assets/bodies/moon.ts
    - src/assets/textures/earth-2k.jpg
    - src/assets/textures/moon-orig-2k.jpg
    - src/app/BodyView.tsx
    - src/app/bodyDraw.ts
    - src/app/BodyMesh.tsx
    - src/app/AtmosphereGlow.tsx
    - src/app/EarthMoonScene.tsx
    - src/app/SunCentredView.ts
    - src/app/sceneLayout.ts
    - tests/assets.test.ts
    - tests/textureLicence.test.ts
    - tests/sceneTransforms.test.ts
    - tests/layerRule.test.ts
    - tests/sunCentred.test.ts
    - tests/fixtures/scene-placement-pre-t043.json
    - docs/DONOR_PROVENANCE.md
  dependencies: []
issues: []
supersedes: null
---

# C-016: T-043 Task Check (Quick)

Independence: orchestrator checker session; T-043 was built by a separate Sonnet executor sub-session.

## Scope Lock

1. Done When 1–7 of T-043; Guardrails as listed on the Task (ARCH-02, ARCH-04, ARCH-05, PROV-02, TEST-01, TEST-03, STYLE).
2. Changed files in `reviewed.files` (working tree over ea592a3).
3. Out of scope: compositions and scene centre (T-044), the `SunBody` override fold-in (T-047), the public-build gate (T-047).

## Outcome Coverage

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Catalogue from explicit imports; rejects duplicate id, parented body without source, root with source, visual without definition; `definitions()`/`sources()` | Proven | `src/assets/catalogue.ts`; `tests/assets.test.ts`; checker probe: missing visual, ghost visual, duplicate visual, root source, missing source, duplicate id, unlicensed texture all rejected; `definitions()` equals `BUILT_IN_BODIES`, `sources()` = earth, moon |
| 2 | Visual records for Sun/Earth/Moon; constants exist once | Proven | `src/assets/bodies/*.ts`; `grep` for the material/atmosphere colours, `DEFAULT_SUN_SIZE` and the yaw constants outside `src/assets/` finds nothing |
| 3 | Earth and Moon textures `localOnly` with reason and public replacement; rights test fails on neither/both | Proven | `tests/textureLicence.test.ts`; probe: both → "both", blank reason → rejected, licence only → ok; every catalogue texture passes |
| 4 | `BodyView` draws sphere with/without texture, atmosphere, marker, spheroid with independently mapped radii; scene's Earth, Moon and Sun views are `BodyView` | Proven, with the interpretation below | `src/app/BodyView.tsx`, `src/app/bodyDraw.ts`; probe: fake spheroid maps equatorial and polar radii independently under True and Readable, a definition with only one of the two radii falls back to the mean; Earth and Moon are `<BodyView>` in `EarthMoonScene.tsx`. The Sun is drawn by `BodyMarkerView`, which builds its marker with `createMarker` from the same renderer module and the catalogue record — the special `SunView` drawing code is gone. Mounting the Sun as a `<BodyView>` element in the scene is T-044 Done When 3 ("N `BodyView`s from the composition"); see observation 1. |
| 5 | Placement snapshot equals pre-change values | Proven | `tests/sceneTransforms.test.ts` against `tests/fixtures/scene-placement-pre-t043.json` (5 dates × both policies); corroborated by screenshots |
| 6 | Layer rule for `src/assets/` | Proven | `tests/layerRule.test.ts` new case |
| 7 | Gates; every browser script in a fresh run directory | Proven for this Task; `browser-synthetic-belt.mjs` still fails the pre-existing I-020 assertion, identically on the ea592a3 baseline | Executor: `docs/evidence/o014-t043-20261011T095118/` (`results.txt`); 7 of 8 scripts pass with zero console errors |

## Visual Comparison (checker)

Viewed `before/spike03/close-moon-1440x900.png` and `after/spike03/close-moon-1440x900.png` (the pixel-diff outlier at 6.6%): identical to the eye — same terminator, labels, tracks and texture; the baseline-vs-baseline rerun shows 8.6% on the same file, so the difference is renderer noise. Other files differ in ≤0.35% of pixels (`pixel-diff.json`).

## Gates (checker, 2026-10-11T10:10Z)

- `npm run typecheck` — exit 0
- `npm run build` — exit 0
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` — 23 files, 417 tests passed
- `git diff --check` — clean
- Checker probe file (3 cases) passed and was removed.

## Issues

None. No materiality actions are required.

## Observations (non-blocking)

1. The Sun is not yet a `<BodyView>` element; `BodyMarkerView` shares BodyView's draw module. T-044 must mount every composition body, the Sun included, through `BodyView` (its Done When 3); I will check that there.
2. `SunBody` still overrides the marker's colour and size (drift note; T-047 folds it in).
3. `BodyView`'s React branches are tested through `describeBody`/`createMarker`, not a render; browser runs exercise the sphere branch only. The spheroid branch gets its first real body in T-048/T-049.

## Owner Validation Still Needed

`owner_validation.required: true`: the owner's look at Apollo (Spike 03 default and telemetry times, True/Readable, desktop/phone) and the belt. Screenshots: `docs/evidence/o014-t043-20261011T095118/{before,after}/`. Until the owner records acceptance, the Task stays at `stage: audit`; dependants needing `clear` may start.

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
