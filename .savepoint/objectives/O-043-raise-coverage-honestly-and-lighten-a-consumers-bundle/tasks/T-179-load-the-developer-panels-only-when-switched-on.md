---
id: T-179
title: Load the developer panels only when switched on
objective: O-043
status: planned
depends_on: [{task: T-178, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o043-planning-20261024}
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

Pending execution.

## Drift Notes

Defer architecture notes to the coverage and Design step of O-043.
