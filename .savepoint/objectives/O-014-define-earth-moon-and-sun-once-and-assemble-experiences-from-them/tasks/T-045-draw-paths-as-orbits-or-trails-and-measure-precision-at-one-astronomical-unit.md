---
id: T-045
title: Draw paths as orbits or trails and measure precision at one astronomical unit
objective: O-014
status: planned
depends_on: [{task: T-044, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o014-plan-2026-10-11}
lane: scene
planned_reads: [src/app/experienceDefinition.ts, src/app/SunCentredView.ts, src/app/orbitPath.ts, src/app/AstraeusScene.tsx, src/app/TrackedBodyView.ts, src/app/mission.ts, src/core/sunCentredSources.ts, src/core/stateResolver.ts, src/assets/compositions.ts, tests/sunCentred.test.ts, tests/missionScene.test.ts, tools/validate/browser-synthetic-belt.mjs, docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md]
planned_writes: [src/app/experienceDefinition.ts, src/app/PathView.ts, src/app/SunCentredView.ts, src/app/orbitPath.ts, src/app/AstraeusScene.tsx, src/app/TrackedBodyView.ts, src/assets/compositions.ts, src/core/sunCentredSources.ts, tests/paths.test.ts, tests/sunCentred.test.ts, tests/missionScene.test.ts, tools/validate/browser-synthetic-belt.mjs]
---

# Draw paths as orbits or trails and measure precision at one astronomical unit

## Outcome

A path is declared as a co-moving `orbit` (optionally about a named centre) or a `trail` whose frame is `relative` or `inertial`, and every path, including the Moon's monthly path and the Apollo tracks, is drawn by the same rule through the resolver's offsets. The Moon path stops being a special case and becomes the Earth–Moon composition's declared orbit path. The precision of a true-scale body one astronomical unit from the floating origin is measured in pixels and recorded, so the Sun-centred claim rests on a number.

## Astraeus Hypothesis

- **Capability tested:** that the presentation layer's "paths" job holds for any state source under one stated transformation rule, and that the floating origin carries Sun-centred scenes at the precision the brief needs.
- **Contract reused:** `samplePathKm`, `PathView`, `TrackedBodyView`, `sampleOrbitPath`, `StateResolver.offsetKm`, `ScalePolicy`, `FloatingOrigin`.
- **Gap:** design A.4 item 9 (unmeasured precision) and Addendum 1 finding 6 / final review correction 2 (path semantics undefined).
- **Generic change:** `PathLayer` as the tagged union in design C.6; `TrackedBodyView` declared a relative trail; `orbitPath.ts` folded into the generic path layer.
- **Evidence independent of any experience:** made-up two-body sources for all three readings; the review's moving-centre test with a body stationary in the root frame.

## User Check

None required; the belt and Apollo should look as before. The owner may read the recorded precision figure.

## Done When

1. `PathLayer` is `orbit` (optional `center`, default the source's native centre) or `trail` with `frame: "relative" | "inertial"`; validation names the bad field; existing declarations (belt paths) are migrated to `orbit`.
2. Rule tests on made-up sources: an orbit's vertices are invariant under a change of scene centre up to one rigid translation; a relative trail equals per-sample positions from the scene centre at the sample time; an inertial trail equals root-frame positions offset by the scene centre at the display time; a body stationary in the root frame under a moving scene centre gives an inertial trail of one point and a relative trail mirroring the centre's motion.
3. The Earth–Moon composition declares the Moon's monthly orbit path; its vertices equal today's `sampleOrbitPath` output at three dates, and the refresh policy is preserved; `orbitPath.ts`'s Moon-specific code is removed.
4. `TrackedBodyView` is a relative trail: Apollo's drawn path is unchanged (vertex equality test at three times); as an inertial trail in a Sun-centred test scene, Columbia's samples equal sample + Earth-from-Sun at the sample time minus the centre at display time.
5. Precision measured: in the belt at true scale, with the camera focused on Earth and then on the Sun marker, the screen-space jitter of Earth's rendered centre and of a path vertex near Earth over 60 frames at a fixed clock time, in pixels, at 1280×800; recorded in `docs/evidence/o014-<task>-<date>/precision.json` with the method. If jitter exceeds one pixel on the focused body, record the finding and return REPLAN REQUIRED rather than change the floating-origin threshold silently.
6. Gates pass; every browser script passes in a fresh run directory.

## Context Files

`docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` (A.4 item 9, C.6 path semantics, E step 3 and risks), `src/app/experienceDefinition.ts`, `src/app/SunCentredView.ts`, `src/app/orbitPath.ts`, `src/app/AstraeusScene.tsx`, `src/app/TrackedBodyView.ts`, `src/app/mission.ts`, `src/core/sunCentredSources.ts`, `src/core/stateResolver.ts`, `src/assets/compositions.ts`, `tests/sunCentred.test.ts`, `tests/missionScene.test.ts`, `tools/validate/browser-synthetic-belt.mjs`.

## Design References

Design: Interfaces and Data Flow (tracked-body path, Moon path refresh); Groups and the `points` layer. Design document C.6, E step 3, Gate D (precision).

## Guardrails

ARCH-02, ARCH-03, TEST-01, TEST-03, STYLE-01, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm the scene Task's composition and resolver offsets landed; REPLAN REQUIRED if not.
2. Define the `PathLayer` union and validation; rename `SunCentredView.ts`'s path class to `PathView.ts`.
3. Implement the orbit and the two trail rules through `offsetKm`; make `TrackedBodyView` the relative trail.
4. Move the Moon path to the composition's declared orbit path; delete the Moon-specific sampler.
5. Rule tests; the moving-centre test; Apollo and Moon equality tests.
6. Precision script in the belt browser run; record the figures; gates and browser scripts.

## Boundaries

No scale change, no experience move, no planets. The floating-origin threshold and `State` are not changed; a precision failure is a recorded finding.

## Technical Verification

Focused tests during iteration; handoff runs the gates and every browser script. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; the integration Task reconciles them into Design.
