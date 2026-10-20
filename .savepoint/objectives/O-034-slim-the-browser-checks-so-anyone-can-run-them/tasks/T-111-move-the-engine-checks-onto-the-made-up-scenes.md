---
id: T-111
title: Move the engine checks onto the made-up scenes
objective: O-034
status: planned
depends_on: [{task: T-110, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o034-planning-20261020}
planned_writes: [src/synthetic/syntheticDefinition.ts, src/main.tsx, tools/validate/driver.mjs, tools/validate/run-engine.mjs, tools/validate/browser-engine-controls.mjs, tools/validate/browser-engine-shell.mjs, tools/validate/browser-tap-focus.mjs, tests/synthetic.test.ts]
---

# Move the engine checks onto the made-up scenes

## Outcome

Every generic engine and shell behaviour now checked inside a demo is asserted on the made-up scenes instead, in as few scripts as reads clearly, and the engine set runs in under 300 s with no demo opened.

## User Check

Run `npm run check:engine`: no step loads `?experience=` apollo, showers or jupiter-io (the summary names each scene used), it passes with zero console errors, and the total is under 300 s.

## Done When

1. These scenarios move from demo-hosted scripts to made-up scenes: controls (`browser-controls`), phone layout and sheets (`browser-phone`), anchor labels (`browser-anchor-labels`), tap, drag, pinch and hover (`browser-tap-focus`), scale menu (`browser-scale-menu`), view links (`browser-view-link`, generic part), orbit motion (`browser-orbit-motion`), embedded mode (`browser-embedded`), and the generic parts of `browser-spike03` and `browser-sky`. A scenario that only makes sense with a demo's data stays for the demo step, named in the evidence.
2. The made-up scenes gain only what those checks need (for example a second named, tappable body; a story panel; a feature or a sky setting), with made-up names, never a mission or dataset (ARCH-01). They stay out of the public build (T-068); a unit test covers each addition's definition (ARCH-03).
3. Merged scripts go through the driver only; new driver functions as needed; the guard test passes.
4. The engine list in the runner holds the moved scripts; old demo-hosted copies are deleted or reduced to their demo-only scenarios for the next step.
5. Each moved scenario is listed in the Task evidence (old script and case, new script and case) for the map.
6. Gates: typecheck, build, test; `npm run check:engine` passes once at handoff, total recorded.

## Context Files

`src/synthetic/syntheticDefinition.ts`, `src/synthetic/syntheticRingDefinition.ts`, `src/main.tsx`, `tools/validate/driver.mjs`, `tools/validate/browser-controls.mjs`, `tools/validate/browser-phone.mjs`, `tools/validate/browser-anchor-labels.mjs`, `tools/validate/browser-tap-focus.mjs`, `tools/validate/browser-scale-menu.mjs`, `tools/validate/browser-view-link.mjs`, `tools/validate/browser-orbit-motion.mjs`, `tools/validate/browser-embedded.mjs`, `tools/validate/browser-spike03.mjs`, `tools/validate/browser-sky.mjs`, `tools/validate/browser-shell.mjs`, `tools/validate/browser-synthetic.mjs`, `docs/BROWSER_CHECKS.md`.

## Design References

Design: Experience plug-in boundary; Components/Codebase Map rows for `src/synthetic/` and `tools/validate/`. O-034 Confirmed Decision 2.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, TEST-01, TEST-03; STYLE rules.

## Implementation Plan

1. Inventory each listed script's scenarios: generic or demo-only.
2. Add the made-up objects the generic ones need, with unit tests.
3. Rewrite the generic scenarios onto the made-up scenes, merging scripts; new driver functions.
4. Update the engine list; trim or delete the old scripts.
5. Gates and one `check:engine` run.

## Boundaries

No app or engine behaviour change (a defect becomes an Issue); no demo data in the made-up scenes; no screenshots. Time box: report back if the run cannot get under 300 s without dropping a scenario.

## Technical Verification

Configured gates and one `check:engine` run; evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record Design deltas for reconciliation in the last step.
