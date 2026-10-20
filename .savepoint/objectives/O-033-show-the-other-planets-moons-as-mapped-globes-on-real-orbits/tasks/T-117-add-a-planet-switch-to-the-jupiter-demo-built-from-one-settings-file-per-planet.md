---
id: T-117
title: Add a planet switch to the Jupiter demo, built from one settings file per planet
objective: O-033
status: in_progress
stage: build
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o033-planning-20261020}
lane: demo
planned_writes: [src/experiences/jupiter-io/jupiterIo.ts, src/main.tsx]
---

# Add a planet switch to the Jupiter demo, built from one settings file per planet

## Outcome

The Jupiter demo is rebuilt as a planets demo: one builder reads a settings file per planet, and a top-bar switch lists the planets that have one. With only Jupiter's file present it opens and behaves exactly as today; adding a planet is adding a file.

## User Check

Open the Jupiter demo (old link and new link): same opening view, story panels, moons panel and tagged places as before, now with a planet switch showing Jupiter.

## Done When

1. A generic builder under the demo (the Showers pattern: settings types with strict validation, a choice module, the builder) turns `data/stories/<planet>/` style settings into an `ExperienceDefinition`: centre body, moon system, mapped bodies with feature packages, families, rings, window, story panels; no Jupiter names in the builder (names only in the settings file).
2. The switch uses the existing `ExperienceDefinition.switcher` and `SwitchControl`; switching keeps the clock date and swaps in place (as O-030 did for showers); a planet's address is `?experience=planets&planet=<id>` (or the name settled in the Task, recorded), and `?experience=jupiter-io` opens Jupiter.
3. Proven on a made-up planet settings file first (ARCH-03), dev-only like the synthetic experiences.
4. Jupiter unchanged: `tests/jupiterIo.test.ts`, `tests/jupiterMoonsScene.test.ts`, `tests/moonFamilyPanel.test.ts` pass with at most renamed imports; the Jupiter view's definition compares equal on window, bodies, story panels and families before and after.
5. Browser scripts and `tools/validate/run-demo.mjs` updated for the renamed demo where it breaks them (not run; the Full Objective Check runs them).

## Context Files

`src/experiences/jupiter-io/jupiterIo.ts`, `src/main.tsx`, `src/app/experienceDefinition.ts`, `src/shell/SwitchControl.tsx`, `src/experiences/showers/showerChoice.ts`, `src/experiences/showers/showerSettings.ts`, `src/experiences/showers/showerDefinition.ts`, `data/stories/jupiter-io/panels.json`, `tests/jupiterIo.test.ts`, `tools/validate/run-demo.mjs`, `tools/validate/public-addresses.mjs`, `docs/BROWSER_CHECKS.md`.

## Design References

Design: Experience plug-in boundary, Shower builder, Jupiter and Io, public site row.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Settings types and validation from what `jupiterIo.ts` hard-codes today.
2. Builder and switch; Jupiter's settings file; old address.
3. Made-up planet proof; equality tests for Jupiter; update scripts that break.

## Boundaries

No new planets (later Tasks); no change to Jupiter's look, window or stories; no core changes.

## Technical Verification

Configured gates; no browser runs (owner rule); evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
