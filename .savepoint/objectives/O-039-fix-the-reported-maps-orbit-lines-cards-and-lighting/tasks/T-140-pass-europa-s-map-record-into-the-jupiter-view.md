---
id: T-140
title: Pass Europa's map record into the Jupiter view
objective: O-039
status: planned
check_waiver:
  task: T-140
  reason: "Owner skipped the optional Task Check for the O-039 overnight run ('Skip them, one big check at the end'); the recheck of C-096 covers it."
  actor: {role: owner, session: 8d73d3f8}
  recorded_at: '2026-10-22T11:24:09Z'
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: 8d73d3f8}
lane: maps
planned_reads: [.savepoint/checks/C-096-o-039-full-objective-check.md, .savepoint/issues/I-067-europa-places-may-use-the-same-west-longitude-mix-up-as-titan.md, src/experiences/planets/systems/jupiter.ts, src/experiences/planets/systems/saturn.ts, src/experiences/planets/planetDefinition.ts, src/experiences/planets/surfacePlace.mjs, tests/mapOrientation.test.ts, tests/planetDefinition.test.ts, .savepoint/Design.md]
planned_writes: [src/experiences/planets/systems/jupiter.ts, tests/planetDefinition.test.ts, .savepoint/Design.md]
---

# Pass Europa's map record into the Jupiter view

## Outcome

The Jupiter planet view passes each Galilean moon's `map.json` the way Saturn's view does, so Europa's places are converted and Tyre is drawn at 33 (I-067, C-096 finding 1).

## User Check

On the preview, open Jupiter and focus Europa: Tyre sits on its ringed impact scar, Pwyll on its rayed crater.

## Done When

- `src/experiences/planets/systems/jupiter.ts` supplies Io, Europa, Ganymede and Callisto map records to the place builder, matching Saturn's pattern.
- A node test builds the real Jupiter planet definition (through the system file, not `shownLongitude` alone) and finds Tyre's placed longitude near 33 and Pwyll's unchanged; Io, Ganymede and Callisto places unchanged.
- Design.md's O-039 paragraph is accurate about Europa.
- Configured gates pass. Owner look recorded.

## Context Files

`.savepoint/checks/C-096-o-039-full-objective-check.md`, `.savepoint/issues/I-067-europa-places-may-use-the-same-west-longitude-mix-up-as-titan.md`, `src/experiences/planets/systems/jupiter.ts`, `src/experiences/planets/systems/saturn.ts`, `src/experiences/planets/planetDefinition.ts`, `src/experiences/planets/surfacePlace.mjs`, `tests/mapOrientation.test.ts`, `tests/planetDefinition.test.ts`, `.savepoint/Design.md`.

## Design References

Design: Current Technical State, O-039 paragraph.

## Guardrails

ARCH-01, STYLE-07, STYLE-10, TEST guardrails.

## Implementation Plan

1. Add the map records to Jupiter's system file as Saturn's does.
2. Write the end-to-end test first; see it fail without the wiring.
3. Correct Design.md.

## Boundaries

Wiring only; no data or conversion changes. No browser sets.

## Technical Verification

Focused node tests; configured gates. Evaluated by the recheck under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
