---
id: T-141
title: Use the sharp Venus map only in the planets demo
objective: O-039
status: planned
check_waiver:
  task: T-141
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the recheck of C-096 covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T11:24:09Z'
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: 8d73d3f8}
lane: venus
planned_reads: [.savepoint/checks/C-096-o-039-full-objective-check.md, .savepoint/issues/I-068-desktop-showers-demos-now-download-the-14-mb-venus-map-unmeasured.md, src/app/bodyDraw.ts, src/assets/licence.ts, src/assets/bodies/venus.ts, src/experiences/planets/planetDefinition.ts, src/app/experienceDefinition.ts, tools/validate/load-budget.mjs, tests/venusMap.test.ts, tests/publicBuild.test.ts, .savepoint/Design.md]
planned_writes: [src/app/bodyDraw.ts, src/app/experienceDefinition.ts, src/experiences/planets/planetDefinition.ts, tools/validate/load-budget.mjs, tests/venusMap.test.ts, tests/publicBuild.test.ts, .savepoint/Design.md]
---

# Use the sharp Venus map only in the planets demo

## Outcome

The 8k desktop Venus map is used only by the planets demo; every other demo (Perseids, Geminids, Apollo) asks for the 2k map at any width, so their pages are back to their earlier size; the Venus load-budget limits are re-measured (I-068, C-096 finding 2; owner 2026-10-22: "Sharp map only in the planets demo").

## User Check

None beyond the recheck; Venus in the planets demo looks as already approved.

## Done When

- An experience opts in to desktop texture variants (the planets demo does; the default is off), expressed as data on the experience definition, not a demo-name check in engine code (ARCH-01).
- Node tests: a desktop-width showers composition asks for `venus-2k-balanced.jpg`; the planets demo at desktop width asks for the 8k file; phone width asks for 2k everywhere.
- `tools/validate/load-budget.mjs` limits for the pages that draw Venus are re-measured against the new 2k file and set on purpose with the measurement in a comment; the public-build check passes.
- Design.md describes the opt-in. Configured gates pass.

## Context Files

`.savepoint/checks/C-096-o-039-full-objective-check.md`, `.savepoint/issues/I-068-desktop-showers-demos-now-download-the-14-mb-venus-map-unmeasured.md`, `src/app/bodyDraw.ts`, `src/assets/licence.ts`, `src/assets/bodies/venus.ts`, `src/experiences/planets/planetDefinition.ts`, `src/app/experienceDefinition.ts`, `tools/validate/load-budget.mjs`, `tests/venusMap.test.ts`, `tests/publicBuild.test.ts`, `.savepoint/Design.md`.

## Design References

Design: Current Technical State, O-039 paragraph; Experience plug-in boundary.

## Guardrails

ARCH-01, STYLE-05, STYLE-07, STYLE-09, STYLE-10.

## Implementation Plan

1. Find where `describeBody` picks the variant; thread an opt-in from the experience definition.
2. Set it for the planets demo only.
3. Tests, then re-measure and set the load-budget limits with a public build.

## Boundaries

No change to the maps or to which bodies a demo draws. No browser sets.

## Technical Verification

Focused node tests; configured gates plus a public build and the public-build check. Evaluated by the recheck.

## Technical Evidence

Pending execution.

## Drift Notes

Design note written in this Task.
