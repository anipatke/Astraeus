---
id: C-020
scope: {kind: task, id: T-047}
result: NEEDS WORK
checked_by: {role: checker, session: o014-orchestrator-check-20261012}
executed_session: o014-t047-sonnet-executor-20261012
checked_at: '2026-10-12T10:10:00Z'
reviewed:
  base_commit: 2d8b2dd
  head_commit: 2d8b2dd
  files:
    - src/app/App.tsx
    - src/app/AstraeusScene.tsx
    - src/app/BodyView.tsx
    - src/app/bodyDraw.ts
    - src/app/sceneFraming.ts
    - src/app/experienceDefinition.ts
    - src/app/metricReadouts.ts
    - src/app/bodyMetrics.ts
    - src/app/catalogueItem.ts
    - src/app/CameraController.tsx
    - src/experiences/apollo11/apollo11.ts
    - src/experiences/apollo11/apollo11Definition.tsx
    - src/experiences/apollo11/apolloMetrics.ts
    - src/experiences/apollo11/MissionPanel.tsx
    - src/experiences/apollo11/DebugControls.tsx
    - src/experiences/earth-moon/earthMoonExplorer.ts
    - src/experiences/showers/showerDefinition.ts
    - src/main.tsx
    - vite.config.ts
    - tools/validate/public-build-assets.mjs
    - tools/validate/browser-earth-moon.mjs
    - tools/validate/browser-showers.mjs
    - tests/experiences.test.ts
    - tests/publicBuild.test.ts
  dependencies: []
issues: [I-021]
unmet: [T-047-DW5]
supersedes: null
---

# C-020: T-047 Task Check (Quick)

Independence: orchestrator checker session; T-047 was built by a separate Sonnet executor sub-session. The folder moves were committed separately as 2d8b2dd (checker verified the diff was paths and imports only, plus one widened import-guard regex in a test; build passed).

## Scope Lock

1. Done When 1–7 of T-047 (DW1–DW7); ARCH-01, ARCH-04, ARCH-05, PROV-02, TEST-01, TEST-03, browser regression maintenance and historical evidence rules, STYLE.
2. Changed files in `reviewed.files` (working tree over 2d8b2dd).
3. Out of scope: planets and Jupiter–Io (T-048, T-049), Design reconciliation (T-050).

## Outcome Coverage

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| DW1 | Earth–Moon Explorer with `earthMoonSystem`, items, presets, body metrics; `?experience=earth-moon`; browser script at both sizes | Proven | `src/experiences/earth-moon/earthMoonExplorer.ts:42`; `src/main.tsx:15`; `browser-earth-moon.mjs` passed at 1280×800 and 390×844 (`docs/evidence/o014-t047-20261012-1943/`) |
| DW2 | Apollo under `src/experiences/apollo11/` with panels and metrics, `earthMoonSystem`, True/Readable choices; Spike 02/03, shell, anchor-label scripts pass with path updates only | Proven | `apollo11Definition.tsx:14–15`; scripts pass unedited; Apollo before/after pixel diff within run-to-run noise (≤0.162% vs a 0.676% noise floor) |
| DW3 | Showers under `src/experiences/showers/`, `sunEarthSystem`, `sceneCenter: "sun"`, Sun/Earth items and no Moon, True/solar-system with Earth's factor, Earth and parent orbit paths, browser assertions mapped | Proven | `showerDefinition.ts:300–302`; `browser-showers.mjs` scenario map and Sun–Earth block pass at both sizes |
| DW4 | Alias removed; every definition names a composition; `ExperienceRuntime` has `resolver` and `catalogue`; metrics split | Proven | No `sceneLayers: "earth-moon"` remains (the remaining `"earth-moon"` string is the experience id and the composition id); `ExperienceRuntime = {clock, resolver, catalogue}`; `apolloMetrics.ts` and `bodyMetrics.ts`; the bodiless fixture keeps `composition` optional (drift note) |
| DW5 | Name check: no experience names in core/assets/shell/generic app; body names only in `src/core/bodies/` and `src/assets/bodies/` | **Issue I-021** | Experience-name half holds (checker grep over `src/core src/shell src/assets src/app` for apollo, perseid, geminid, columbia, eagle and shower finds nothing). Body-name half fails and is untested: `App.tsx:62` `selectedObjectId: "earth"`, `CameraController.tsx:40` `focus: "earth"`, `experienceDefinition.ts:220,239`, `AstraeusScene.tsx:108,329–341`, `metricReadouts.ts:1,95–119`; the executor's report states the rule is not mechanised. Consequence: an experience without Earth (T-049's Jupiter–Io) starts selected and focused on a body it does not mount. |
| DW6 | Public build substitutes local-only textures; validator hashes `dist/` and fails on a match; test with a fake texture; normal build unchanged | Proven | Checker re-ran: `ASTRAEUS_PUBLIC_BUILD=1 vite build` → `public-build-assets.mjs` `ok: true`, 0 matches; the same validator on the normal `dist/` exits 1 (it can fail); `tests/publicBuild.test.ts` catches a copied and a base64-embedded fake texture |
| DW7 | Gates; browser scripts at both sizes in fresh run directories; owner look separate | Proven | Checker: typecheck exit 0, build exit 0, 27 files / 524 tests passed, `git diff --check` clean; executor's fresh run: every browser script `errors: []` |

## Issues

| Issue | Likelihood | Impact | Materiality | Recommendation |
|-------|-----------|--------|-------------|----------------|
| I-021 — generic app assumes Earth; body-name check not mechanised | High (the next Task mounts an Earth-free composition) | Medium (wrong initial selection and focus; the layer contract the Objective exists to prove is untested) | Medium | Fix now in T-047: mechanise the check with a reasoned allowlist, derive defaults from the experience, record the core-provider allowlist as a drift note for T-050 |

## Re-check Lock

The re-check covers DW5 and I-021's Proof Needed items 1–4 only, plus the gates and the browser scripts for the four experiences; DW1–DW4, DW6 and DW7 are re-verified only for regressions from the repair.

## Observations (non-blocking)

1. The public-build Earth and Moon are flat colour; the donor's public-domain Moon map is named but not copied (as planned in T-043).
2. The parent orbit is drawn for peak ±180 days, because the full 109P orbit exceeds the camera reach (drift note).
3. The executor noticed T-043 and T-044 Task files modified in the working tree: those are the owner's acceptance records written by the orchestrator, not executor changes.

## Owner Validation Still Needed

Owner look at Earth–Moon Explorer, Apollo and Perseids, after the re-check.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — body ids repeated as literals in generic app code (I-021).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
