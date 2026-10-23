---
id: T-171
title: Give the list switch a general home
objective: O-042
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o042-planning-20261024}
check_waiver:
  task: T-171
  reason: 'Owner said "orchestrate O42"; under the standing O-042 run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o042-run-20261024}
  recorded_at: '2026-10-23T23:34:47Z'
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

Moved `src/experiences/showers/showerChoice.ts` to `packages/astraeus/src/app/listSwitch.ts` (`chooseSwitch`, `SwitchEntry`; shower constants and `chooseShower` removed from the engine; folder gone). Tests ported to `packages/astraeus/tests/listSwitch.test.ts` on made-up entries. `SHOWER_PARAM`, `SHOWER_SWITCH_LABEL`, `ShowerEntry`, `chooseShower` now in `packages/astraeus-demo-showers/src/experiences/showers/showerEntry.ts` (one test added in `demoShowers.test.ts`). `planetChoice.ts` and `main.tsx` repointed. Browser scripts unchanged.
Gates, all pass: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `npm run check:engine-alone` (758 passed), `npm run check:pack`. No browser run (not required).

## Drift Notes

Record architecture deltas for Design reconciliation in the showers rebuild Task.
