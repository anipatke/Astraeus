---
id: T-189
title: Let a path cross the solar system with its line fixed to any body
objective: O-046
status: done
check_waiver:
  task: T-189
  reason: 'Owner said "orchestrate O-46"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o046-run-20261030}
  recorded_at: '2026-10-30T20:45:00Z'
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

Per criterion:
- Refusal gone: `#checkSunCentred` in `src/api/scene.ts` now only reports Sun-centred. Test "builds, lists the path and offers the enlarged solar-system scale" (`tests/publicApiSunPaths.test.ts`) passes; the old refusal test in `publicApiSunOrbits.test.ts` was removed.
- One generalised rule: `relativeTrailKm(samples, native, placement, against = placement.center)` in `src/app/pathRules.ts`; `TrackedBodyView` reads `body.lineFixedTo` (new optional field on `TrackedBody`), draws the relative trail against it, then carries the line by `sceneOffsetKm(placement, against, displayTime)` (null when against is the scene centre, so default output is bit-identical). The static `TrackedBodyView.pathRule` stays as the one rule kind (an existing Apollo test asserts it); the target is per path. The inertial rule was not reused: it needs the root frame and a separate cache, while this form covers scene centre and Sun-fixed as two instances.
- `lineFixedTo` not in the finished scene: `bad-trajectory` naming field and body, thrown from `#checkReadouts` (called from `toDefinition`). Tested with "jupiter".
- Made-up tests (`tests/publicApiSunPaths.test.ts`, probe on a straight transfer Earth to Mars): Sun-fixed first vertex identical at two display times; marker meets Mars at the flyby time (relative gap < 1e-6); default and `lineFixedTo: "earth"` in an Earth-centred scene give the same line and `relativeTrailKm` returns its input; readouts (range, speed) work in the Sun-centred scene; the enlarged solar-system policy places the marker finite.
- Apollo 11 and hello-scene unchanged: no change to their definitions; `packages/astraeus-demo-apollo11/tests/paths.test.ts` and the existing public API tests pass in the full run.
- Docs: doc comment on `lineFixedTo` (scene.ts), README `addTrajectory` and `addBody` rows, CHANGELOG `Unreleased`.

Commands (repo root): `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass (chunk size warning only); `npm test` 145 files passed, 1892 tests passed, 1 skipped. (One earlier typecheck failure from removing `pathRule` was repaired by restoring it.)

Files read: Context Files plus `src/app/sceneLayout.ts` (sceneOffsetKm, trackedAbsolute; extra read, to check placement units), `src/app/mission.ts` (TrackedBody; extra read, to add the field), `tests/scenePlacement.ts`, `tests/scalePolicies.ts` (test helpers).
Files changed: `src/api/scene.ts`, `src/app/pathRules.ts`, `src/app/TrackedBodyView.ts`, `src/app/mission.ts`, `README.md`, `CHANGELOG.md`, `tests/publicApiSunPaths.test.ts` (new), `tests/publicApiSunOrbits.test.ts` (old refusal test removed) under `packages/astraeus/`.

Limitations: no browser run (by run rules); the Sun-centred tracked layer was checked in unit tests only (marker and line positions with the true and solar-system scale policies), not for label reach, camera distance units or visual look (T-190..T-192). A line fixed to a body other than the scene centre is remapped every frame the clock changes.

## Drift Notes

Record any change to the tracked-bodies layer contract for the last step's Design reconciliation.

Tracked-bodies layer contract: `TrackedBody` gains optional `lineFixedTo`; `relativeTrailKm` gains an optional `against` argument. Sun-centred scenes now accept tracked paths. For the last step's Design reconciliation. Design.md/state-and-assets.md not edited here.
