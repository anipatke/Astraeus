---
id: T-152
title: Load only the chosen shower's story
objective: O-030
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o030-planning-20261023}
---

# Load only the chosen shower's story

## Outcome

The Showers page fetches only the chosen shower's story panels file, the way the planets already do; the other demos' story files are no longer in the showers' download.

## User Check

None on screen (the story panels look and behave as before). Read the before and after sizes in Technical Evidence.

## Done When

- `src/experiences/showers/showerDefinition.ts` no longer holds the eager `PANEL_FILES` glob; the shower's panels arrive through the entry's lazy `STORY_PANELS` (as the planets' do) and are validated as today (a missing or broken panels file still fails with the same `ShowerSettingsError` wording).
- A fast test proves a shower is built from the panels it is handed and that a made-up shower gains panels from settings alone (ARCH-03); existing story tests still pass (named, TEST-03).
- Public build: the showers page set in `tools/validate/load-budget.mjs` lists the chosen shower's panels chunk instead of the eager ones; before and after sizes recorded; limits lowered where the page got lighter.
- Configured gates pass; the public build and `node tools/validate/load-budget.mjs <dist>` pass. No browser runs.

## Context Files

`src/main.tsx`, `src/experiences/showers/showerDefinition.ts`, `src/experiences/showers/showerSettings.ts`, `src/shell/storyPanels.ts`, `tools/validate/load-budget.mjs`, `tests/showers.test.ts`, `tests/storyStoriesAllDemos.test.ts`, `tests/demoShowers.test.ts`.

## Design References

Design: Shower builder (T-038, T-039, T-055); Story panels (O-015); Public site and launch (O-016).

## Guardrails

ARCH-01, ARCH-03, TEST-01, TEST-03; STYLE rules as listed in `.savepoint/Guardrails.md`.

## Implementation Plan

1. Measure the showers page set on the public build.
2. Move the panels lookup to the entry's lazy glob and pass the panels into the shower builder.
3. Tests, rebuild, measure, update the load budget.

## Boundaries

No change to what visitors see or to story data. The in-place switch is the next step; do not change `SwitchControl` here. No browser runs, no screenshots.

## Technical Verification

Focused `npx vitest run` while building; configured gates, public build and load-budget check at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Note for Design: showers load their story lazily. Reconciled in the last step of this Objective.
