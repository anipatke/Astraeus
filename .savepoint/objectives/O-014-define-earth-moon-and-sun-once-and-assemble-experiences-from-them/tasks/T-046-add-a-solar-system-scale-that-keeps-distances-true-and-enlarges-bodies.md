---
id: T-046
title: Add a solar-system scale that keeps distances true and enlarges bodies
objective: O-014
status: planned
depends_on: [{task: T-042, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o014-plan-2026-10-11}
lane: scale
planned_reads: [src/core/scalePolicy.ts, src/core/body.ts, src/shell/scaleModel.ts, src/shell/ScaleControl.tsx, src/shell/AstraeusShell.tsx, tests/core.test.ts, tests/controls.test.ts, docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md]
planned_writes: [src/core/scalePolicy.ts, src/shell/scaleModel.ts, src/shell/ScaleControl.tsx, tests/core.test.ts, tests/controls.test.ts]
---

# Add a solar-system scale that keeps distances true and enlarges bodies

## Outcome

A third scale policy, `solar-system`, maps distances exactly as True scale does and enlarges each body's radius by a factor declared per body (with a default), so a Sun-centred scene can show Earth as more than a pixel without moving anything. The policy id union is open, `mapRadius` takes the body id, and the shell's scale choices come from a list the application supplies rather than a constant pair. Apollo keeps True and Readable only and is unchanged.

## Astraeus Hypothesis

- **Capability tested:** that `ScalePolicy` is the right place for presentation-only enlargement and that a third policy needs no change to State, the views or the shell's rendering.
- **Contract reused:** `ScalePolicy` (contract unchanged in shape), `scalePolicyFor`, `SCALE_CHOICES`, `ScaleControl`.
- **Gap:** design A.4 item 5; O-011 success condition 5.
- **Generic change:** `SolarSystemScalePolicy` created with `{ exaggeration: Record<BodyId, number>; defaultExaggeration: number }`; `mapRadius(radiusKm, bodyId?)`; `ScaleId` open; `scaleChoicesFor(ids)` in the shell model. The wiring of an experience's declared choices and factors into `ExperienceDefinition` is the experiences Task's job, so this Task shares no file with the scene lane.
- **Evidence independent of any experience:** policy tests on fake bodies; shell tests with a three-choice list and with the existing two.

## User Check

None required in this Task; the belt and Perseids looks happen in the experiences Task.

## Done When

1. `createSolarSystemScale` positions equal True-scale positions exactly for any vector; `mapRadius(r, id)` equals `trueScale.mapRadius(r) × factor(id)`; without an id the default factor applies; a factor must be finite and at least 1; the policy's explanation text states the factor for the info panel (PROV-01).
2. `ScalePolicy.id` is a string type; `trueScale` and `readableScale` are byte-for-byte unchanged in behaviour (existing tests).
3. `scaleChoicesFor(["true-scale", "readable-scale"])` yields today's two choices and wording; adding `"solar-system"` yields a third with its explanation; an unknown id throws; `ScaleControl` renders N choices and keeps its keyboard and ARIA behaviour (existing `controls.test.ts` cases pass).
4. Gates pass; browser scripts pass in a fresh run directory (no visual change expected; record it).

## Context Files

`docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` (C.7 "True vs readable scale", E step 4), `src/core/scalePolicy.ts`, `src/core/body.ts`, `src/shell/scaleModel.ts`, `src/shell/ScaleControl.tsx`, `src/shell/AstraeusShell.tsx`, `tests/core.test.ts`, `tests/controls.test.ts`.

## Design References

Design: Architecture (scale policies); Interfaces and Data Flow (`ScalePolicy`, `scalePolicyFor`). Design document C.7, E step 4; O-011 Reference Capability Decision 4.

## Guardrails

ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-05, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm the core Task's definitions expose radii by id; REPLAN REQUIRED if not.
2. Open the id type; add `bodyId` to `mapRadius`; write the solar-system policy as a factory.
3. Make the shell choices a function of ids; keep the two existing choices' wording.
4. Tests; gates; browser scripts.

## Boundaries

No `ExperienceDefinition`, scene or experience change (the experiences Task wires `scaleChoices` and factors). No change to how True and Readable behave.

## Technical Verification

Focused tests during iteration; handoff runs the gates and every browser script. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; the integration Task reconciles them into Design.
