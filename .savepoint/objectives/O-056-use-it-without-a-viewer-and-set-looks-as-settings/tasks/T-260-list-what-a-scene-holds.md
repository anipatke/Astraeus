---
id: T-260
title: List what a scene holds
objective: O-056
status: planned
depends_on: [{task: T-259, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o056-planning-20261103}
---

# List what a scene holds

## Outcome

Read-only properties on `Scene` say what it holds in public types, so the Voyagers and showers apps can check their scenes in tests without `toDefinition` before O-057 removes it (O-056 Success Condition 3; D10; owner decision 2, plain lists).

## User Check

Not owner-facing: the change is an API with tests.

## Done When

- `Scene` gains read-only properties, each a frozen list or object of public types built from the scene's own plans (never by calling `assembleScene` or reading `ExperienceDefinition`): `bodies` (id, label, parent, orbit line on/off, enlarge), `paths` (id, label, center, provenance), `groups` (id, count, plane, provenance), `events` (id, label, time as UTC ms, type, object, provenance), `panels` (the story panels as given, typed), `views` (ids, start, place), `scales` (the scale choices the viewer will offer, in order) and `timeline` (window start/end ms, rates, rate, loop). Field names follow API-04 (units in names, `center`, spans `{ start, end }`). Exact shapes are set by this step and recorded in Technical Evidence; each property has a doc comment.
- Planet orbit lines and the camera far plane that Voyagers and showers read today: answered by `bodies[].orbit` and the existing `scene.camera` getters, or by a named new read if neither covers it; Technical Evidence lists each current outside read (`/home/user/code/voyagers/src/*.test.ts`, `/home/user/code/showers/tests/*.test.ts`, read only) and its public answer.
- A table-driven test builds one made-up scene with every kind of item and checks each property, that each is frozen, and that a read on a mounted (frozen) scene still answers.
- CHANGELOG (Unreleased) carries a "From `toDefinition` to public reads" migration table, one row per outside read.
- **Surface:** `npm run api:lock` regenerated and the lock diff limited to the members this step adds; CHANGELOG (Unreleased) and the README API tables updated in the same change; `apiSurface`, `apiRules` and `allowlistGrowth` tests pass (no allowlist group grows).
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/planBodies.ts`, `packages/astraeus/src/api/planPaths.ts`, `packages/astraeus/src/api/planGroups.ts`, `packages/astraeus/src/api/planStory.ts`, `packages/astraeus/src/api/planTimeline.ts`, `packages/astraeus/src/api/planViews.ts`, `packages/astraeus/src/api/planCamera.ts`, `packages/astraeus/src/api/assembleScene.ts` (to see how scale choices are made, without calling it), `/home/user/code/voyagers/src/scene.test.ts`, `/home/user/code/voyagers/src/voyagers.test.ts`, `/home/user/code/showers/tests/showerScene.test.ts`, `/home/user/code/showers/tests/storyPanels.test.ts`.

## Design References

`.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)` ("Verb grammar": reads are plain properties; "Compatibility": D10); `Interfaces and Data Flow` ("Scene and host-link split (O-058").

## Guardrails

API-01, API-02, API-04, API-05, API-06, ARCH-02, ARCH-03, ARCH-06, TEST-01, TEST-03, STYLE-02, STYLE-07, STYLE-10, CODE-01.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. List every outside `toDefinition` read and choose its public answer.
3. Add one read per plan (each plan answers its own list; `Scene` only forwards), with public types in `src/api/`.
4. Table-driven test; migration table; lock, README, CHANGELOG; gates.

## Boundaries

Do not edit `docs/prds/`, `docs/research/` or the G-012 to G-014 `Release.md` files. No renames of existing members and no removal of `toDefinition` (O-057). Do not edit the Voyagers or showers repositories.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus the named `check:*` scripts. No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`. Also `npm run check:node-consumer` if it reads any of these.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; T-264 reconciles them into Design.md.
