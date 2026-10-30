---
id: T-189
title: Let a path cross the solar system with its line fixed to any body
objective: O-046
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o046-planning-20261030}
---

# Let a path cross the solar system with its line fixed to any body

## Outcome

`addTrajectory` is accepted in a Sun-centred scene, and a new path option `lineFixedTo` names the body the path's line is drawn against (any body in the scene; default the scene centre). A Sun-centred probe's line stays fixed against the Sun while time plays, and the enlarged "Solar system" scale is offered beside the path (I-096).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- The `bad-trajectory` refusal at `src/api/scene.ts:504` is gone; a Sun-first scene with an enlarged body and a `center: "sun"` path builds, lists the path, and offers the "solar-system" scale choice.
- `lineFixedTo` is one generalised trail rule: the sample shift in `relativeTrailKm` targets the chosen body instead of always the scene centre, so "scene centre" and "Sun-fixed" are two instances of one rule (strategic fix, owner 2026-10-30), and `TrackedBodyView.pathRule` is derived per path, not a fixed constant. If the existing inertial rule is the cleaner general form, use it and say why in Technical Evidence.
- `lineFixedTo` naming a body not in the finished scene throws `bad-trajectory` naming the field and the body (from `toDefinition`, like `addGroup`'s centre check).
- Made-up tests (ARCH-03; a made-up probe on a made-up transfer between two planets): with the line fixed to the Sun, the drawn line points are the same at two display times; with the default in an Earth-centred scene they match today's output exactly; the marker meets the target planet at the flyby time within the sampling error; `readouts` (range, speed, distance) still work about the path's centre in a Sun-centred scene.
- Apollo 11 and hello-scene definitions unchanged (existing comparison tests green; name them).
- Doc comment on `lineFixedTo` and the `addTrajectory` README row state the rule: the line is drawn against `lineFixedTo` (default the scene centre) at each sample's own time.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/app/TrackedBodyView.ts`, `packages/astraeus/src/app/pathRules.ts`, `packages/astraeus/src/app/PathView.ts`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/tests/publicApiPaths.test.ts`, `packages/astraeus/tests/publicApiSunOrbits.test.ts`, `packages/astraeus/README.md` (the `addTrajectory` and `addBody` rows).

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Experience plug-in boundary; Asset architecture), `docs/architecture/state-and-assets.md` where it covers path rules and scene placement.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Read how the tracked-bodies layer places markers and lines in a Sun-centred scene (floating origin, scale policy, Earth-radii units such as `labelMaxDistance` and camera `distance`); return REPLAN REQUIRED if a Sun-centred tracked path needs a design change beyond the trail rule.
3. Generalise the trail rule to a chosen body; derive each path's rule from `lineFixedTo`.
4. Lift the refusal; validate `lineFixedTo` in `toDefinition`.
5. Made-up tests, then doc comment and README row; CHANGELOG `Unreleased` line.

## Boundaries

No probe data, no mission names. No changes to group or orbit-line drawing beyond sharing the generalised rule. Frame (`plane`), scale export and label reach are later steps.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step (O-046: one `npm run check:browser` at the end). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record any change to the tracked-bodies layer contract for the last step's Design reconciliation.
