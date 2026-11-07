---
id: T-277
objective: O-057
title: Rename what the viewer reports and what orbit records say
status: done
depends_on: [{task: T-276, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o057-planning-20261107}
check_waiver: {task: T-277, reason: 'Owner said "orchestrate O-57" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o057-run-20261107}, recorded_at: '2026-11-06T23:13:51Z'}
---

# Rename what the viewer reports and what orbit records say

## Outcome

The reported time carries its unit and stored orbit records say `plane`, so no `removedBy: O-057` type-lint entry is left except story panels.

## User Check

A test reads `handle.timeUtcMs`; a record with `frame` is refused naming `plane`.

## Done When

`ViewerHandle.timeUtcMs`, `ViewerChange.timeUtcMs` and `EventZoneChange.timeUtcMs` on both embedding paths, with the React `time` prop and `setTime` unchanged as inputs; `ElementsBodyRecord.plane`, with `parseElementsBodyRecord` naming the replacement for `frame`; its `accuracy` validity dates follow API-04; the rest of the `apiTypeLint` breaks are cleared; demos, examples, the site and tests are moved over; the lock is regenerated.

## Context Files

`.savepoint/objectives/O-057-make-names-and-shapes-consistent-for-0-8-0/Objective.md`, `packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/viewerZones.ts`, `packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/core/elementsBody.ts`, `packages/astraeus-site/tests/apiTypeLint.allowlist.json`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-02, API-04, API-05, TEST-01, TEST-02.

## Implementation Plan

1. Rename the three reads and move the callers. 2. Rename the record field and add the refusal. 3. Work through what is left on the lint list. 4. Regenerate the lock.

## Boundaries

Only `ElementsBodyRecord` changes: other files with a `frame` key (ephemerides, orbit fits, generated paths) are internal data and stay. Renamed reads get no throwing stand-in; the migration table covers them.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the last step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads (path, reason): `.savepoint/objectives/O-057-.../Objective.md` Owner Decisions (named by the brief); `packages/astraeus/src/api/renamedInputs.ts` and `tests/renamedInputs.test.ts` (the one table and its guard); `packages/astraeus/src/core/fieldReaders.ts`, `src/api/time.ts`, `src/assets/licence.ts` (code being renamed); `tools/api-rules.mjs` line 83 (the lint needs the written type to name `TimeInput`).

Changes. Viewer reports: `timeUtcMs` on `ViewerHandle`, `ViewerChange`, `EventZoneChange` (link, clock, zones, handle; mount and React share them); the React `time` prop and `setTime` unchanged. `ElementsBodyRecord`: `plane`, and `accuracy.valid: { start, end }` typed `TimeInput`; `TimeInput` now lives in new `src/core/timeInput.ts` (ARCH-04: core cannot import `src/api/`) and `src/api/time.ts` re-exports it. The parser refuses `frame`, `validFromUtc`, `validToUtc` naming the replacement (`ElementsBodyError`); `addBodyFromElements` first runs `rejectRenamed` on three new rows of `RENAMED_INPUTS` (`ElementsBodyRecord.frame`, `ElementsAccuracy.validFromUtc`, `ElementsAccuracy.validToUtc`), giving code `renamed`. `CenteredPosition.frame` and `StateInput.frame` became `plane` (`FrameId` unchanged): about 15 source files and the readers tsc found, mechanical. `TextureRef.desktop.minViewportWidthPx` (unit confirmed CSS pixels: `bodyDraw.ts` passes `window.innerWidth`); `textureUrlFor` parameter is `viewportWidthPx`. Moved: geminids `parentElements` JSON, made-up site orbit records, test records, site `index.html` State example, browser script `tools/validate/driver.mjs` (`watchHostChanges` stores `timeUtcMs`; edited, not run), README rows and examples, CHANGELOG Unreleased entry, `api-surface.lock.json` (regenerated), `scenePin.json` pin (389 `frame` keys to `plane`, nothing else), lint allowlist (11 entries removed, 2 StoryPanels entries remain).

Left alone on purpose (internal data and other records): ephemeris, orbit-fit and moon-index `frame` and `validToUtcMs`; `astraeus-data/**/map.json` `minViewportWidth` (data-package manifest read by the import tool, not `TextureRef`); `PointGroup.frame`; mission readout `frame` fields (their type now reads `State["plane"]`); `tests/fixtures/showers-before-rebuild.json` (a captured pre-rebuild snapshot, never parsed as a record).

Gates: `npm run lint` pass; `typecheck` pass; `build` pass; `npm test` 228 files, 3080 passed, 2 skipped; `check:engine-alone`, `check:pack`, `check:node-consumer`, `check:react-consumer` pass. No browser run. `DEEP_IMPORT_COUNTS` unchanged (apiRules test passes; Planets and Site stay 0).

| Done When | Test (file, case) |
|---|---|
| `ViewerHandle.timeUtcMs` on mount | `tests/viewerHostDom.test.ts` "the mount handle" cases read `mounted.timeUtcMs`; `tests/lifecycle.test.ts` READS (all reads undefined after unmount, now `timeUtcMs`) |
| `ViewerHandle.timeUtcMs` through the React ref | `tests/viewerHostDom.test.ts` "a React app reads camera and time, sets camera and time and listens through the ref after onReady" |
| `ViewerChange.timeUtcMs` from mount and React | `tests/viewerHostDom.test.ts` "calls back on a host set, on a visitor's seek and speed change, and on playback; nothing after unmount"; `tests/viewerLinkPin.test.ts` "setTime validates the window, seeks, then reports once with cause host" |
| `EventZoneChange.timeUtcMs` from link and React | `tests/viewerLinkPin.test.ts` "reports change before zones, with zone leaves before enters, event type and object, and via view or time"; `tests/eventZonesDom.test.ts` "AstraeusScene onEventZone gets the same payload" |
| React `time` prop and `setTime` unchanged | `tests/viewerHostDom.test.ts` "AstraeusScene applies each prop only when that prop changes (I-129)" cases (names unchanged) |
| Record `plane` read; `frame` refused naming `plane` (parser) | `astraeus-demo-showers/tests/elementsBody.test.ts` "names plane when it is wrong" and "names frame (old name alone) when it is wrong" |
| `frame` refused naming `plane` (`addBodyFromElements`) | `tests/renamedInputs.test.ts` "ElementsBodyRecord.frame: the old name alone throws renamed and names its replacement" |
| `accuracy.valid` `{ start, end }` read as text, Date or ms | `elementsBody.test.ts` "reads the validity span as ISO text, a Date or milliseconds, and keeps text as written"; `renamedInputs.test.ts` "accepts a record under its new names, with the span as ISO text, a Date or milliseconds" |
| Old `validFromUtc` / `validToUtc` refused naming the replacement (parser) | `elementsBody.test.ts` "names accuracy.validFromUtc (old name alone) when it is wrong" and the `validToUtc` twin |
| Old `validFromUtc` / `validToUtc` refused (scene call) | `renamedInputs.test.ts` "ElementsAccuracy.validFromUtc: the old name alone throws renamed..." and the `validToUtc` twin |
| One table stays the single list; guard green | `renamedInputs.test.ts` "has a row for every driver and a driver for every row", "is read by a call for every scope in the table", "has one row per old name and scope..." |
| `CenteredPosition.plane` on states | `tests/orbitGroup.test.ts` "declares its identity, centre, frame, bounds and provenance, and reads one member as an ordinary State"; `tests/sampledTrajectory.test.ts` "is deterministic and declares its bounds, center and null orientation"; `tests/scenePin.test.ts` "builds the same definitions, metrics, states and errors in both orders" |
| A mismatched `plane` is still rejected | `tests/core.test.ts` "composes explicit centers, preserves body identity, and rejects mixed epochs or frames"; `tests/orientationIllumination.test.ts` "rejects illumination vectors with mismatched times, frames, or centers" |
| `TextureRef.desktop.minViewportWidthPx` | `astraeus-demo-showers/tests/venusMap.test.ts` "picks the 2k file below 768 px and the 8k file from 768 px up" |
| Lint breaks cleared except story panels | `astraeus-site/tests/apiRules.test.ts` (a stale or missing allowlist entry fails) and "names today's breaks from the API review" |
| Lock regenerated | `npm run api:lock`; `astraeus-site/tests/apiSurface.test.ts` "matches the checked-in lock" |

Limitations: the `driver.mjs` change is not run. The error text "identical frames" in `referenceCenters.ts` and `illumination.ts` keeps the word "frames" (message, not a field).

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.

- The API-04 span rule now applies to `ElementsBodyRecord.accuracy.valid`; Design "Public API shape" should note `TimeInput` is declared in `core/timeInput.ts` and re-exported by `api/time.ts` (ARCH-04). For the last step of O-057.
- `apiRules.test.ts` "names today's breaks" lost its `frame ElementsBodyRecord.frame` key because the break it named is cleared.
