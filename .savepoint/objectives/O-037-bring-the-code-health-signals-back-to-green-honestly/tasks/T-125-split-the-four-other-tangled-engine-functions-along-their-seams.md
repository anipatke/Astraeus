---
id: T-125
title: Split the four other tangled engine functions along their seams
objective: O-037
status: planned
depends_on: []
owner_validation: {required: false}
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

Pending execution: per-function readings before and after, test names and results, files changed.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
