---
id: T-218
title: Let a scene name its views
objective: O-051
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-218, reason: 'Owner said "Let''s do the scene switching now" under the standing run rules (no per-step checks, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o051-run-20261101}, recorded_at: '2026-10-31T23:01:48Z'}
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

Builder run 2026-11-01 (stage build -> test -> audit). Focused: `npx vitest run tests/sceneViews.test.ts` 27 passed.
Gates: `npm run lint` pass (first run failed complexity 24 > 20 on toDefinition; fixed by moving resolution into `#viewsEntry`); `npm run typecheck` pass; `npm run build` pass; `npm test` 167 files passed / 1 failed, 2090 passed, 1 failed, 1 skipped. The one failure is packagePacks.test.ts ("astraeus: 476 files is over 472"); `npm run check:pack` fails the same way: the astraeus package packs 476 files against a limit of 472 (the new modules add declaration/map files). Limit not raised, per run rules; owner decision needed. No browser run.
Owner decision (actor owner, 2026-11-01), relayed by the coordinator: "Replace with a stray-file check (Recommended)" for the astraeus pack file-count limit. Done: `tools/check-packs.mjs` drops the astraeus `files` limit and adds `strayFiles` (every packed `src` .js/.node.js/.d.ts needs a `.ts`/`.tsx` source module, other `src`/`data` files need the same path in the package source, top-level entries must be package.json or in `x-publish.files`); a stray fails as "astraeus: stray file <path> ...". Byte limits kept; the other packages' rules unchanged (their file counts stay; the same rule does not fit the data packages, whose files are generated). Tests added in `packagePacks.test.ts` (pure strayFiles cases and a planted stray file in the astraeus build). Rerun after the change: lint pass (after splitting problemsOf for complexity), typecheck pass, build pass, `npm test` 168 files passed, 2093 passed, 1 skipped, `npm run check:pack` pass (astraeus 476 files, 7.16 MB packed, 9.21 MB unpacked, within byte limits).

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- T-218: `definition.views?: ViewSettings` ({ place, start, views: [{ id, label, camera: {rule:"stay"} | {rule:"start", framing?:{follow|focus:id}}, objects, events, panels: ReadonlySet<string> }] }), types in `src/app/views.ts`, validation/resolution in `src/api/views.ts`. `objects` holds bodies, paths and groups. New error code `bad-view`. Camera input `{ follow|focus: id }` is normalised to rule "start" with that framing (the Objective's "start with framing" and "{follow}/{focus}" are the same behaviour). Shape faults throw at `setViews`; unknown ids and camera targets throw at `toDefinition`. Camera target must be a path/body/group shown by the view.


- T-218 pack rule: the astraeus pack file-count limit (472) is replaced by the stray-file check (owner, 2026-11-01). Design.md's sentence "The astraeus pack file limit is 472" must be updated in the last step.
