---
id: T-156
title: Let demos and the site use the engine only through its front door
objective: O-035
status: planned
depends_on: [{task: T-155, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o035-planning-20261023}
---

# Let demos and the site use the engine only through its front door

## Outcome

The engine declares its entry points in its `package.json` `exports`; the demos and the site import it only through `astraeus` and those entries, and a fast test fails any import that reaches inside another package or any engine import of a demo or the site.

## User Check

None on screen. `npm test` includes the boundary test; break it on purpose (a deep import) and see it fail, then revert.

## Done When

- `astraeus`'s `package.json` `exports` lists the entries the demos and site use today, grouped plainly (for example the scene app and definition types, core, assets, shell, synthetic scenes), each with its types; the entries are exactly what is in use, no more (STYLE-05). O-036 designs the small public API; this step only declares today's doors.
- Every demo and the site import the engine through `astraeus` or `astraeus/<entry>`; no relative path crosses a package folder. Demos do not import each other or the site.
- A fast test (`tests/packageBoundaries.test.ts` or in the engine's tests) reads every source import in every package and fails a cross-package relative path, an engine import of a demo or the site, and a demo-to-demo import; it is proven with made-up offending files in a temp folder (ARCH-03).
- Configured gates pass; the public build and load budget pass unchanged. No browser runs.

## Context Files

The five `package.json` files from the previous step, `tsconfig.json`, `vite.config.ts`, the site's entry `main.tsx`, `src/app/experienceDefinition.ts` (at its new path), and the previous step's Technical Evidence.

## Design References

Design: Experience plug-in boundary; Components/Codebase Map.

## Guardrails

ARCH-01, ARCH-03, ARCH-04, TEST-01, TEST-03; STYLE-05, STYLE-07.

## Implementation Plan

1. List every import that crosses a package from the previous step's moves.
2. Declare the entries; switch those imports to the package name.
3. Write the boundary test with its made-up offenders.
4. Gates, public build, load budget.

## Boundaries

No new API, no renames of engine functions, no behaviour change. No browser runs, no screenshots.

## Technical Verification

Focused `npx vitest run`; configured gates, public build and load budget at hand-off. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Note for Design: the engine's declared entries and the boundary test. Reconciled in the last step.
