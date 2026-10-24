---
id: T-179
title: Load the developer panels only when switched on
objective: O-043
status: done
depends_on: [{task: T-178, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o043-planning-20261024}
check_waiver:
  task: T-179
  reason: 'Owner said "orchestrate O43"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o043-run-20261024}
  recorded_at: '2026-10-24T01:39:39Z'
---

# Load the developer panels only when switched on

## Outcome

The developer settings and debug readouts are a separate on-demand piece: an app that never switches them on does not download them, and the site shows them exactly as today when switched on. Any other engine part T-178 listed as small and safe also loads on demand. The example app's first-open code is measured again with the T-178 command and is smaller than the baseline.

## User Check

On the preview (`localhost:5490`), open any demo, switch on the developer settings and the debug readout: they appear and work as before (sliders change the scene, readouts update). Read the before-and-after figures in the hand-off.

## Done When

- `App.tsx` no longer imports `DeveloperSettings`, `DebugOverlay` or the other listed panels statically; they load through `React.lazy` / dynamic `import()` (or the same idea) only when switched on, with a quiet placeholder while loading. Settings read from the address (`?...` search values) still apply before the panels load.
- The packed example's build shows the panels in a separate on-demand script; the T-178 command reports the first-open totals lower than the baseline; before and after are recorded in Technical Evidence and appended to `docs/evidence/o043-bundle-baseline.md`.
- Tests: a node test proves the first-open import graph of the public `.` entry does not reach the panel modules (for example by reading the built example's manifest from the T-178 function on a made-up folder, or by static analysis of `App.tsx` imports); existing panel tests still pass.
- Any T-178 candidate that is not small and safe is not done here: it is listed for the owner.
- Hand-off gates plus `npm run check:pack`, `npm run build:example` and `npm run check:engine-alone` green.

## Context Files

`packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/DeveloperSettings.tsx`, `packages/astraeus/src/app/DebugOverlay.tsx`, `packages/astraeus/src/app/FrameRateSection.tsx`, `packages/astraeus/src/app/SettingControls.tsx`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `tools/build-packages.mjs`, `tools/check-packs.mjs`, `tools/build-example.mjs`, the T-178 command and its test, `docs/evidence/o043-bundle-baseline.md`.

## Design References

Design Components/Codebase Map (`src/app/`, `src/api/`, O-036 packaging); Decisions (public API is a thin layer, T-160).

## Guardrails

ARCH-02, ARCH-04, CODE-01, CODE-02, TEST-01, TEST-03, STYLE-10.

## Implementation Plan

1. Confirm the T-178 list; return REPLAN REQUIRED if the panels cannot be split without changing the public API.
2. Move the panel imports behind on-demand loading; keep the settings state in `App.tsx`.
3. Check `tools/build-packages.mjs` keeps the dynamic imports working in `dist/` (extensions added) and `check-packs.mjs` still passes.
4. Apply the small, safe extra candidates, one at a time, measuring after each.
5. Measure, record, test, gates.

## Boundaries

No change to what the public API exports or to scene behaviour; three.js and React stay; no removal of the panels from the package (owner chose on-demand loading). No change to the public site's demos.

## Technical Verification

Hand-off gates from AGENTS.md plus the extra gates in Done When. No `npm run check:browser` per Task unless a browser script breaks (then run that step alone once); the full browser run is at the Full Objective Check. Owner look on the preview. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-10-24 by a builder session (no Task Check requested; owner validation required).

Changes: `app/developerPanels.tsx` (new: six `React.lazy` wrappers over one `import("./DeveloperSettings")`); `app/App.tsx` (imports the panels from it; `developerTools` wrapped in `Suspense` with a quiet "Loading developer tools..." line); `app/debugReadout.ts` (new: `DebugReadout`, `buildDebugReadout`, `EARTH_MOON_LABELS` and types moved out of `DebugOverlay.tsx`, which re-exports them); `sceneDebug.ts`, `metricReadouts.ts`, `AstraeusScene.tsx` and `App.tsx` import the types from `debugReadout`; `tests/firstOpenGraph.test.ts` (new). Per-frame stats collection (`sceneFrame`/`sceneDebug`) is unchanged and stays in the first-open script (CODE-02). Settings read from the address are applied in `App.tsx` state, which is not moved.

Per criterion:
- No static panel imports in App.tsx; lazy with placeholder: met (`developerPanels.tsx`, `Suspense` fallback).
- Separate on-demand script, totals lower, recorded: met. `DeveloperSettings-pp231YOh.js` 14,479 B raw / 4,589 gzip on-demand. First-open 1,603,283 to 1,589,537 B raw (-13,746), 458,257 to 454,113 gzip (-4,144). Appended to `docs/evidence/o043-bundle-baseline.md`.
- Node test: met. `tests/firstOpenGraph.test.ts` walks static value imports from `src/api/index.ts` and asserts `DeveloperSettings`, `DebugOverlay`, `FrameRateSection` are not reached, and `developerPanels` uses a dynamic import. Existing panel tests (`frameStats`, `domMenuAndLink`, `orbitLook`) pass unchanged.
- Other candidates not small and safe: not done, by owner choice (2026-10-24 "Panels only"): planet-system modules, chebyshevEphemeris, sunCentredSources.
- Gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (131 files, 1744 passed, 1 skipped, junit.xml), `npm run check:pack` pass, `npm run measure:example` (builds the example) pass, `npm run check:engine-alone` pass.

Extra reads: none beyond Context Files except `sceneDebug.ts`, `sceneFrame.ts`, `metricReadouts.ts`, `shell/AstraeusShell.tsx` (grep of who imports the panels and where `developerTools` is drawn), and `docs/evidence/o043-bundle-baseline.md`.

Limitations: no browser run (none required). The developer drawer opening and working was not looked at in a browser; the owner checks on the preview. No test renders the lazy path in a browser; panel components remain covered by static-markup tests. Open it with the "Developer" switch in the shell (DeveloperToggle); no address parameter.

## Drift Notes

Defer architecture notes to the coverage and Design step of O-043.

## Owner Validation

2026-10-24T01:39:39Z, owner (session o043-run-20261024), on the localhost:5490 preview after turning on the Developer switch: "Looks fine, carry on" (developer tools open, sliders change the scene, Under the hood readouts update). Owner decision before this step: "Panels only" (planet-system modules and chebyshevEphemeris/sunCentredSources not made on-demand).
