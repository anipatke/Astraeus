---
id: T-395
title: Diagnostics only when asked
objective: O-087
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-395, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:11:52Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: readouts
planned_reads: [packages/astraeus/src/app/sceneDebug.ts, packages/astraeus/src/app/sceneBodySets.ts, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/tests/helpers/frameContext.ts, packages/astraeus/tests/orbitLook.test.ts, packages/astraeus/tests/cameraAndNamesDom.test.ts, packages/astraeus-site/tools/validate/driver.mjs]
planned_writes: [packages/astraeus/src/app/diagnosticsFlag.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/FeatureMarkers.ts, packages/astraeus/src/app/BodySetLabels.ts, packages/astraeus/tests/frameDiagnostics.test.ts, packages/astraeus/tests/sceneFrame.test.ts, packages/astraeus-site/tools/validate/harness.mjs, docs/BROWSER_CHECKS.md]
---

# Diagnostics only when asked

## Outcome

An embedder's frame no longer projects every path, samples up to 512 points per group or `JSON.stringify`s readouts onto the canvas: those browser-check readouts are computed only when the page sets the opt-in flag `globalThis.__ASTRAEUS_DIAGNOSTICS__ = true` before the viewer mounts, and every browser-check page sets it through the shared harness (AH-09; Objective conditions 2).

## User Check

None visual (draft 08 holds the look). In a page without the flag, the canvas carries no `data-paths`, `data-points`, `data-body-screen` attribute.

## Done When

- `src/app/diagnosticsFlag.ts` exports one reader, `diagnosticsRequested(): boolean` (`globalThis.__ASTRAEUS_DIAGNOSTICS__ === true`). `createFrameState` (sceneFrame.ts ~93) reads it once into a new `FrameState.diagnostics` field; nothing else reads the global (STYLE-07).
- With `state.diagnostics === false` the frame skips, at their call sites in `sceneFrame.ts`: `publishOrbitHeadGap` (~376), `publishBodySets` (~382), `publishPathData` (~383), `publishPointsData` (~384), `publishBodyData` (~455; `bodyScreenReadouts` itself still runs, picking needs it), `publishSceneData` (~326) and the feature-marker readout (~520; `FeatureMarkerLayer.update` gets a `readout` argument and skips its `JSON.stringify` (~272) when false). The publisher functions in `sceneDebug.ts` are unchanged, so `orbitLook.test.ts` (which calls them directly) passes unchanged.
- Cheap state attributes the browser checks and unit tests read stay always on but are written only when they change (`setDatum`): `data-pick-hover` (~498), `data-sky-lines` (~337), and in `BodySetLabels.ts` `data-body-set-hover`/`data-body-set-named` (~110-111). `data-frames-drawn`, `data-depth-mode` (LayeredRender), `data-ring-bands`, `data-sky-stars` and `data-pick-target` are untouched (PLAN.md decision 3). The sky probe keeps its Developer-mode rule.
- New `packages/astraeus/tests/frameDiagnostics.test.ts` (ARCH-03: a made-up scene from `tests/synthetic/` or the frame-context helper with a path, a point group and a body set), as one table over {flag absent, flag false, flag true}:
  - "writes no diagnostic readout by default": after 10 `runFrame` calls with nothing changing, none of `paths`, `points`, `bodyScreen`, `orbitHeadGap`, `orbitArcSegment`, `bodySetMembers`, `featureMarkers`, `markerBodies` is in `canvas.dataset`; spies on each view's `screenReadout` were called 0 times; a `MutationObserver` on the canvas records 0 attribute mutations over frames 2-10.
  - "writes the readouts when the page asks": with the flag true the same attributes are present and equal what the publishers produce.
- `tests/sceneFrame.test.ts` gains one case per stage whose behaviour changed (CODE-02); no existing case or its setup changes.
- `harness.mjs` sets the flag on every page and context it opens (`checkScript`'s page, `openPage`, `openContext`) with `addInitScript`, so every browser script and frame (including the portfolio stand-in's iframe) sees it; `ASTRAEUS_DIAGNOSTICS=0` in the environment leaves it unset (for draft 01/07's "off" rows, which also set it per page).
- `docs/BROWSER_CHECKS.md` says in one line that the scripts read readouts only because the harness sets the flag.
- Engine size: raw growth at most ~400 B (PLAN.md risk 1); the engine-size check (`packagePacks.test.ts` "keeps the plain example's first download within ENGINE_LIMIT", or wherever O-086 moved it) passes; before/after bytes recorded.
- Gates per `docs/agents/verification.md`; the browser smoke step once with the flag (this Task changes the harness); the full browser run is draft 07's.

## Context Files

- `packages/astraeus/src/app/sceneFrame.ts` (`createFrameState`, `publishCanvasReadouts`, `placeSkyFigures`, `placeViews`, `updateOverlays`)
- `packages/astraeus/src/app/sceneDebug.ts` (whole; read only)
- `packages/astraeus/src/app/FeatureMarkers.ts` (`update`, ~224-276)
- `packages/astraeus/src/app/BodySetLabels.ts` (~100-120)
- `packages/astraeus-site/tools/validate/harness.mjs` (whole)
- `packages/astraeus/tests/helpers/frameContext.ts` (read only)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` > `Overview` (the staged frame).

## Guardrails

CODE-02, ARCH-03, API-01, API-03, TEST-01, TEST-03, STYLE-05, STYLE-07, STYLE-10.

## Implementation Plan

1. Add `diagnosticsFlag.ts` and `FrameState.diagnostics`.
2. Gate the listed call sites; make the cheap writes change-only.
3. Add the `readout` argument to `FeatureMarkerLayer.update`.
4. Write `frameDiagnostics.test.ts` and the new `sceneFrame.test.ts` cases; show the default case fails with the gate removed (local edit, revert, record).
5. Harness init script; doc line; size check; smoke step once.

## Boundaries

No public API (no mount option, no README API row, no `api-surface.lock.json` change; PLAN.md decision 2 and owner question 1). No change to the publisher functions, the browser scripts' assertions or `driver.mjs` (draft 01 owns it). Label layout is draft 03's; the canvas-box read in `updateOverlays` is draft 03's. No browser-tier change (O-086).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/frameDiagnostics.test.ts packages/astraeus/tests/sceneFrame.test.ts packages/astraeus/tests/orbitLook.test.ts packages/astraeus/tests/cameraAndNamesDom.test.ts packages/astraeus/tests/scenePicking.test.ts packages/astraeus-site/tests/browserDriverGuard.test.ts`. Handoff: `quality_gates`, then the smoke step alone (coordinator confirms no other browser job is running). If a browser script breaks because a readout moved, migrate `driver.mjs` in this Task only after the coordinator confirms draft 01 has merged (it owns `driver.mjs`); otherwise report.

## Technical Evidence

Extra reads: `packages/astraeus/src/app/sceneBodySets.ts` (publishBodySets, to build the flag-true test fake); `tools/check-packs.mjs`, `engine-budget.mjs` (size check, O-086 moved it to `check:pack`); `docs/BROWSER_CHECKS.md` (heading "What it runs", doc line).

| Done When | Evidence |
|---|---|
| `diagnosticsRequested()` one reader; `FrameState.diagnostics` read once | `diagnosticsFlag.ts`; `createFrameState`; `frameDiagnostics.test.ts` "reads the flag once" |
| Gated call sites (orbit gap, body sets, paths, points, body data, scene data, feature readout) | `sceneFrame.ts` guards; `frameDiagnostics.test.ts` default case (flag absent and false): no readout keys, 0 `screenReadout` calls, feature `update` gets `readout=false`; red-first: forcing `diagnostics: true` failed 3 of 4 cases, reverted |
| Cheap attributes change-only (`pickHover`, `skyLines`, `bodySetHover`, `bodySetNamed`) | `setDatum` in sceneFrame.ts and BodySetLabels.ts; default case: 0 canvas writes over frames 2-10 (a Proxy on `dataset` counts writes, since the frame-context canvas is a plain object, not a DOM node); sceneFrame.test.ts "placeSkyFigures writes the line list once" |
| flag true writes equal publisher output | `frameDiagnostics.test.ts` "writes the readouts when the page asks" |
| sceneFrame.test.ts one case per stage | 4 new cases in "the diagnostic readouts follow the frame state's flag"; no existing case touched |
| harness sets flag on page, `openPage`, `openContext`; `ASTRAEUS_DIAGNOSTICS=0` leaves unset | `harness.mjs` `enableDiagnostics`; smoke step passed with it (exit 0, 43 s, 0 error lines; evidence docs/evidence/browser-steps-20261121T222732Z) |
| BROWSER_CHECKS.md line | added above "What it runs" |
| Engine size <= ~400 B | Built in an isolated worktree of HEAD, before vs with only this Task's four src files: raw 1,834,339 -> 1,834,531 (+192 B), gzip 524,878 -> 524,990 (+112 B); limit 1,836,000 / 527,000 (headroom 1,469 B raw). The shared checkout's example at the end of the run (with sibling builders' edits too) measured 1,835,598 raw / 525,328 gzip, within limit. |
| Gates | typecheck clean; `npm test`: 321 files, 5147 passed, 3 skipped; build ok. `npm run lint` last run: only `pausedRenders.test.ts` prettier warning (T-397's file); an earlier run flagged `OrbitSetView.ts` complexity (T-398's file), both not mine. Focused run (frameDiagnostics, sceneFrame, orbitLook, cameraAndNamesDom, scenePicking, browserDriverGuard): 100 passed. |

Limitations: the real `FeatureMarkerLayer.update(readout=false)` is not exercised by a test (the frame test uses a fake that mimics it; the DOM layer tests are an existing file); `FeatureMarkerLayer.update`'s `readout` parameter defaults to true so existing callers and tests are unchanged. Full browser run not done (draft 07's).

## Drift Notes

Design note for draft 07: the browser-check readouts are opt-in (`__ASTRAEUS_DIAGNOSTICS__`, read once per viewer at frame-state creation).

## Coordinator

Set done by the orchestrating session after the combined handoff gates passed with T-395, T-397, T-398, T-399 together (owner: "I mark them as they pass", O-038; G-024 decision 7 "Orchestrate each objective to completion"; "carry on orchestrating G-024", 2026-11-22): lint and Prettier clean, typecheck clean, build ok, `npm test` 321 files, 5147 passed, 3 skipped; `npm run check:pack` engine budget 1,835,598 B raw (limit 1,836,000), 525,328 B gzip (limit 527,000).
