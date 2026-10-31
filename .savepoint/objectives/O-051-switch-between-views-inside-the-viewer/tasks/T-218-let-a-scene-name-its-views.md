---
id: T-218
title: Let a scene name its views
objective: O-051
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o051-plan-20261101}
---

# Let a scene name its views

## Outcome

`scene.setViews(views, { place, start })` records named views on a scene, each listing the paths, bodies, events and story panels it shows, and `toDefinition` carries them into the definition with every object's view membership resolved once (I-124, API half).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `setViews` accepts `[{ id, label, paths?, bodies?, events?, panels?, camera? }]` and `{ place: "top-bar" | "panel", start? }` as in the Objective's Success Conditions. `camera` is `"stay"` (default), `"start"` with an optional `{ follow | focus: id }` framing, or `{ follow: id }` / `{ focus: id }`; it is validated and carried here, applied in a later step.
- Validation: empty list, duplicate view id, unknown path/body/event/panel id (events by their id; check what identifies an event and panel today and use that), bad place, `start` not a view, a camera target not in that view: each throws a named `SceneError` naming the view index or id and the field. Ids are checked when the scene is built (`toDefinition`), so `setViews` may come before or after `addTrajectory`/`addEvents`.
- Membership rule: anything no view names shows in every view; anything named shows only in the views that name it. Resolved once into the definition (for example a per-view set of visible object, event and panel ids plus the start view), never per frame.
- A scene without views produces exactly today's definition (existing tests pass unchanged).
- Tests on made-up configurations (ARCH-03): every validation fault, the membership rule with a shared body, a path in two views, events and panels, and the no-views case.
- README `setViews` row and API comment; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/scene.ts` (fields, `setSwitches`, `addEvents`, `addStoryPanels`, `toDefinition`), `packages/astraeus/src/api/switches.ts`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/src/app/experienceDefinition.ts` (`ExperienceDefinition`), `packages/astraeus/tests/displaySwitches.test.ts`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-06, TEST-01, TEST-03, TEST-04, CODE-01; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Types and validation in a small module beside `switches.ts`, reusing its error style.
3. Resolve membership in `toDefinition` into one optional `views` entry on the definition.
4. Tests, README, CHANGELOG.

## Boundaries

No viewer, shell or camera behaviour (next steps); no change to `setSwitches` or the existing `switcher`; no State change (ARCH-02).

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
