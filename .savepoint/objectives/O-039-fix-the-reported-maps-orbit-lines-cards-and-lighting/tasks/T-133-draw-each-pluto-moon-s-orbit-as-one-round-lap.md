---
id: T-133
title: Draw each Pluto moon's orbit as one round lap
objective: O-039
status: planned
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o039-planning-20261022}
lane: pluto
planned_reads: [src/core/bodies/moonSystem.ts, src/app/OrbitSetView.ts, src/experiences/planets/systems/pluto.ts, data/planets/pluto.json, tests/bodySet.test.ts, tests/jupiterMoonsScene.test.ts]
planned_writes: [src/core/bodies/moonSystem.ts, src/app/OrbitSetView.ts, tests/plutoOrbitLines.test.ts]
---

# Draw each Pluto moon's orbit as one round lap

## Outcome

Each Pluto-system moon's orbit line spans exactly one true lap, with its period from the Pluto–Charon system mass, and the four small moons' lines are drawn about the Pluto–Charon balance point, so they are under 1% from round and still pass through each moon (I-056).

## User Check

On the preview, open Pluto: every moon's line is one clean loop, Nix's is closed, and each moon sits on its line as time plays.

## Done When

- Charon, Styx, Nix, Kerberos and Hydra lines each span one lap (within 2%) of their true periods (about 6.39, 20.2, 24.9, 32.2 and 38.2 days).
- The small moons' lines are centred on the Pluto–Charon balance point and deviate under 1% from a best-fit circle at 2016-07-01; the moon's drawn position lies on its line at any time.
- Titan's and Phobos's lines are unchanged (same span and shape as before, within numerical noise).
- `tests/plutoOrbitLines.test.ts` measures laps, roundness and the moon-on-line property for these cases. The core stays presentation-free. Owner verdict recorded. Configured gates pass.

## Context Files

`src/core/bodies/moonSystem.ts`, `src/app/OrbitSetView.ts`, `src/experiences/planets/systems/pluto.ts`, `data/planets/pluto.json`, `tests/bodySet.test.ts`, `tests/jupiterMoonsScene.test.ts`.

## Design References

Design: Components/Codebase Map rows for `src/core/` and `data/planets/`; Interfaces and Data Flow.

## Guardrails

ARCH-01, ARCH-02, STYLE-02, STYLE-07, STYLE-10, TEST guardrails.

## Implementation Plan

1. Reproduce the measured lap counts in a failing test first (the I-056 history has the figures).
2. Take the period from the system mass (Pluto plus Charon) or a fitted mean period; choose the smaller change and record why.
3. Offer the line centre as the balance point for a system that names one (data, not a Pluto check in code); draw the small moons about it.
4. Confirm Titan and Phobos are unchanged; ask the owner to look.

## Boundaries

Orbit lines only; no change to moon positions, fits or data files. No browser sets.

## Technical Verification

Focused node tests; configured gates at handoff; owner's look on the preview. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Any new line-centre field is a Design change; deferred to T-137.
