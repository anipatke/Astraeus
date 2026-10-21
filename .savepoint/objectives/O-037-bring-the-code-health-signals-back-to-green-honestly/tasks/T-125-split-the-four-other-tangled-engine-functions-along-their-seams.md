---
id: T-125
title: Split the four other tangled engine functions along their seams
objective: O-037
status: done
depends_on: []
owner_validation: {required: false}
check_waiver:
  task: T-125
  reason: Owner waived the optional Task Check for O-037 ('dont run full checks until the final objective check'); the Full Objective Check covers it.
  actor: {role: owner, session: 9d85e5d6-91d4-454a-a0d6-81701c464056}
  recorded_at: '2026-10-21T10:13:56Z'
planned_by: {role: planner, session: o037-planning-20261021}
planned_reads: [src/experiences/showers/showerSettings.ts, src/experiences/planets/planetDefinition.ts, src/app/OrbitSetView.ts, src/shell/AstraeusShell.tsx, src/experiences/planets/planetSettings.ts]
planned_writes: [src/experiences/showers/showerSettings.ts, src/experiences/planets/planetDefinition.ts, src/app/OrbitSetView.ts, src/shell/AstraeusShell.tsx, src/shell/useDrawers.ts, src/experiences/settingsFields.ts, src/experiences/planets/planetSettings.ts]
---

# Split the four other tangled engine functions along their seams

## Outcome

`parseShowerSettings`, `buildPlanetDefinition`, `OrbitSetView.sync` and `AstraeusShell` each read as a short function calling named helpers, with no behaviour change proven by the tests that already cover them.

## User Check

Open the Showers and planets demos on the preview: settings load, the moons and orbit lines draw, the two phone drawers open and close as before. The owner looks once at the Objective's end.

## Done When

1. `parseShowerSettings` (complexity 24) becomes a composition of per-section parsers (`parseParent`, `parseStream`, `parseActivity`, `parseRadiant`), each returning its typed section; every error message text is unchanged, proven by the existing settings tests.
2. `buildPlanetDefinition` (20) separates a `validatePlanetSystem(settings, system, moonList)` that holds every throw from the assembly of objects and moon families; error messages unchanged, proven by the existing planet tests.
3. `OrbitSetView.sync` (21) extracts the per-path step size (`#stepFor`) and the refresh decision (`#refreshNeeded`), keeping the per-frame budget loop; proven by the existing orbit-set tests.
4. `AstraeusShell` (21) moves the two drawers' open, close and Escape handling into a `useDrawers` hook; proven by the existing shell and phone-layout tests.
5. The ten-line settings-field helper repeated in `planetSettings.ts` and `showerSettings.ts` becomes one shared module (STYLE-07); the repeat in `src/core/sunCentredSources.ts` and the one between the synthetic listed and ring definitions are merged where a shared helper reads better, else recorded as accepted.
6. Each function lands under 20 by lizard and by ESLint's `complexity` rule; readings before and after are recorded.
7. TEST-03: the exact test files and case names relied on are recorded. Gates: `npm run typecheck`, `npm run build`, `npm test`. No browser run.

## Context Files

`src/experiences/showers/showerSettings.ts`, `src/experiences/planets/planetDefinition.ts`, `src/experiences/planets/planetSettings.ts`, `src/app/OrbitSetView.ts`, `src/shell/AstraeusShell.tsx`, `src/core/sunCentredSources.ts`, `tests/showerSettings*.test.ts`, `tests/planetSystems.test.ts`, `tests/orbitSet*.test.ts`, `tests/phoneLayout.test.ts`, `tests/controls.test.ts` (confirm the actual names when starting; record them).

## Design References

Design: "Shower builder", "Planets" and "Shell layout (O-020)" paragraphs. O-037 Why (the six other functions), Planned Technical Decisions.

## Guardrails

ARCH-01, ARCH-02; TEST-01, TEST-03; CODE-01; STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. One function at a time: split, run its tests, record the reading.
2. Merge the shared settings-field helper.
3. Gates.

## Boundaries

No new validation rules, no changed messages, no changed drawing or drawer behaviour; `AstraeusScene.tsx` belongs to the frame Task; tool scripts belong to the lint Task.

## Technical Verification

Named existing tests per function; handoff gates per AGENTS.md's Verification Policy; owner look and engine set at the Full Objective Check.

## Technical Evidence

Complexity before (Task's lizard figures) and after (lizard CCN, this session; ESLint `complexity` not measured here, the rule arrives with T-127):

| Function | Before | After |
|---|---|---|
| `parseShowerSettings` | 24 | 2 (helpers: `parseParent` 5, `parseStream` 6, `parseActivity` 8, `parseRadiant` 7) |
| `buildPlanetDefinition` | 20 | 11 (`validatePlanetSystem` 9) |
| `OrbitSetView.sync` | 21 | 16 (`#stepFor`, `#refreshNeeded` extracted) |
| `AstraeusShell` | 21 | 9 (`useDrawers` hook, plus `MoonsSheet`, `initialObjectId`, `ownStorySettings` helpers) |

1. Done: `parseShowerSettings` composes `parseParent`, `parseStream`, `parseActivity`, `parseRadiant`; messages untouched. Proof: `tests/showers.test.ts`, `tests/showersMeasured.test.ts`, `tests/showersYearHorizons.test.ts`, `tests/showerChoice.test.ts` (136 tests pass).
2. Done: `validatePlanetSystem(settings, system, moonList)` holds the mapped-moon, centre and featured-family throws. Proof: `tests/planetDefinition.test.ts`, `tests/planetSystems.test.ts`, `tests/planetFitErrors.test.ts`, `tests/planetMoonSystems.test.ts` and the rest of `tests/planet*.test.ts`.
3. Done: `#stepFor` and `#refreshNeeded` in `src/app/OrbitSetView.ts`; the per-frame budget loop stays. Proof: `tests/bodySet.test.ts` (the only test importing `OrbitSetView`), `tests/longOrbitPaths.test.ts`, `tests/moonOrbits.test.ts`, `tests/listedOrbitGroup.test.ts`.
4. Done: `src/shell/useDrawers.ts` holds both drawers' open, close and Escape handling. Proof: `tests/phoneLayout.test.ts`, `tests/controls.test.ts` (no test renders `AstraeusShell`; its drawer behaviour is covered by the browser phone checks, pending for the Full Objective Check).
5. Done: `src/experiences/settingsFields.ts` (`settingsFields(fail)`) holds the shared `positive` reader used by `planetSettings.ts` and `showerSettings.ts`. In `src/core/sunCentredSources.ts` the repeated span and count check of the two path-time functions is now `assertPathSpan`. The repeat between the synthetic listed and ring definitions was not touched: not in this Task's planned writes; recorded as accepted for now.
6. Lizard readings above; each function is under 20. ESLint reading deferred to T-127.
7. Existing tests relied on, 365 in the focused run: `tests/bodySet.test.ts`, `tests/phoneLayout.test.ts`, `tests/controls.test.ts`, `tests/planet*.test.ts`, `tests/showers*.test.ts`, `tests/showerChoice.test.ts`, `tests/sunCentred.test.ts`, `tests/paths.test.ts`, `tests/longOrbitPaths.test.ts`. Gates at handoff: build passes; full `npm test`: 89 files, 1259 passed, 1 skipped. `npm run typecheck` passed on rerun (a first run hit a transient error in the parallel T-124 builder's `tests/sceneFrame.test.ts`). No browser run; the Showers and planets phone checks are pending for the Full Objective Check.
8. Error ordering: where a settings file has several faults at once, `parseShowerSettings` may now report a different one first (the sections run parent, stream, activity, radiant); each single-fault message and path is unchanged.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
