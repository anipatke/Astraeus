---
id: T-075
title: Work out shower dot positions on the graphics chip so streams run smoothly on phones
objective: O-017
status: planned
depends_on: [{task: T-073, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o017-orchestrator-check-20261017}
---

# Work out shower dot positions on the graphics chip so streams run smoothly on phones

## Outcome

Large orbit groups (the Geminids' 51,115 and the Perseids' 25,588 measured orbits) are positioned every frame by the graphics chip, straight from each member's orbital elements, instead of by periodic whole fills on the processor. Phones and laptops play both showers smoothly at one week per second, and each dot follows its true curved path rather than a straight-line blend between fills.

## User Check

On a phone and a laptop, open the Geminids and the Perseids and press Play: the dots glide at every speed. Pause anywhere: the dots sit where they sit today.

## Done When

1. Owner decision 2026-10-17 ("It will need to run on phones and laptops, we should optimise for that"; chose "use the graphics chip" after measurement: at 4x CPU throttle the Geminids run at about 3 frames a second, C-053 Observation 1). Each member's elements are uploaded once as vertex attributes; the vertex shader solves Kepler's equation (enough Newton iterations for the highest eccentricity in the shipped sets, with a starting guess that converges for e up to 0.99) and rotates into the scene frame. Time enters as a uniform relative to a recent epoch chosen on the CPU in 64 bits, so 32-bit shader arithmetic keeps its precision; the floating-origin offset stays a uniform (as in T-073).
2. Accuracy: the shader's math, mirrored in a JavaScript 32-bit emulation, reproduces the CPU orbit group's positions within a stated tolerance (in kilometres and in screen pixels at the closest camera the showers allow) across the whole timeline, for every member of both shipped sets and for a made-up group with eccentricities up to 0.99 (ARCH-03 first). Where a scale policy maps positions in a way the shader cannot reproduce exactly, that group keeps the CPU path (fills plus GPU blend from T-073), and the rule is tested.
3. Behaviour: pause, seek, reverse, scale change and the timeline bounds give the same positions as today within tolerance; centroid, extent, labels, selection and any readouts that read member positions keep working (from the CPU path on demand, not every frame).
4. Measured with the C-053 probe (`docs/evidence/c053-20261017T022500Z/frames.mjs`): desktop and phone-like runs (390x844 at 2x and 4x CPU throttle), both showers, before and after, with frames over 60 and 90 ms counted. Target: no periodic long frames for either shower at 2x and 4x; any remaining cost stated with its cause.
5. Gates: typecheck, tests, both builds, validator with budget, lite browser check, before/after pictures within tolerance (O-017 Decision 8), plus `tools/validate/run-full.sh` once before handoff since the drawing path changes.
6. Owner validation: the owner sees both showers glide on a phone and a laptop.

## Context Files

`src/app/PointsView.ts`, `src/core/orbitGroup.ts`, `src/core/listedOrbitGroup.ts`, `src/core/pointGroup.ts`, `src/core/scalePolicy.ts`, `src/experiences/showers/showerStream.ts`, `tests/pointsGpuBlend.test.ts`, `tests/pointsLookAhead.test.ts`, `.savepoint/checks/C-053-t-073-task-check.md`.

## Design References

Design.md points layer, floating origin, scale policies.

## Guardrails

ARCH-02 (frame layer only: State and the clock unchanged), ARCH-03, TEST-01, TEST-03, STYLE-01, STYLE-02.

## Implementation Plan

1. Measure the before figures (desktop, 2x, 4x).
2. Shader path for orbit groups behind a capability check; CPU path kept for groups or policies it cannot serve.
3. 32-bit emulation tests on a made-up group, then the shipped sets; behaviour tests; probe; pictures; full run.

## Boundaries

No change to orbit data, State or the clock. No fewer dots drawn (O-017 Decision 7). No worker threads.

## Technical Verification

Configured gates, lite, pictures, one full run, the frame probe at desktop, 2x and 4x. Evaluated under `agent-skills/references/check-method.md`.
