---
id: T-171
title: Give the list switch a general home
objective: O-042
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o042-planning-20261024}
---

# Give the list switch a general home

## Outcome

The switch that picks which shower or planet opens lives at `packages/astraeus/src/app/listSwitch.ts` under generic names (`chooseSwitch`, `SwitchEntry`); the shower's own parameter and label live in the showers demo; the engine's `src/experiences/showers/` folder is gone.

## User Check

None required; `?experience=showers` (Perseids/Geminids switch) and `?experience=planets` behave as today.

## Done When

`showerChoice.ts` is gone; `listSwitch.ts` is tested on made-up entries (ARCH-03), ported from `showerChoice.test.ts`; `planetChoice.ts` and `main.tsx` import the new file; `SHOWER_PARAM` and `SHOWER_SWITCH_LABEL` sit in the showers demo; browser scripts unchanged; hand-off gates plus `check:engine-alone` green.

## Context Files

`packages/astraeus/src/experiences/showers/showerChoice.ts`, `packages/astraeus/tests/showerChoice.test.ts`, `packages/astraeus/src/shell/SwitchControl.tsx`, `packages/astraeus/package.json`, `packages/astraeus-demo-planets/src/experiences/planets/planetChoice.ts`, `packages/astraeus-demo-showers/src/experiences/showers/showerEntry.ts`, `packages/astraeus-demo-showers/tests/demoShowers.test.ts`, `packages/astraeus-site/src/main.tsx`.

## Design References

Design Components/Codebase Map (engine `src/app/`, `src/experiences/`, demos).

## Guardrails

ARCH-01, ARCH-03, ARCH-04, TEST-01, TEST-03, STYLE-10.

## Implementation Plan

1. Move and rename; repoint users. 2. Port tests. 3. Gates.

## Boundaries

A rename only: no behaviour change and no new switch features.

## Technical Verification

Hand-off gates from AGENTS.md (`npm run lint`, `npm run typecheck`, `npm run build`, `npm test`) plus the extra gates named in Done When. No `npm run check:browser` per Task (one run at the Full Objective Check); a changed browser step may be run alone once. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for Design reconciliation in the showers rebuild Task.
