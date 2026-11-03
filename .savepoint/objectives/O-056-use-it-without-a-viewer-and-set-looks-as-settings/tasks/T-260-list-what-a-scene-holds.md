---
id: T-260
title: List what a scene holds
objective: O-056
status: done
depends_on: [{task: T-259, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-260, reason: 'Owner said "Orchestrate o56" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o056-run-20261103}, recorded_at: '2026-11-03T10:02:57Z'}
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

Extra reads (none beyond Context Files except): `packages/astraeus/src/core/listedOrbitGroup.ts` (group card provenance, to share it without building a group), `packages/astraeus/src/app/catalogueItem.ts` (card limits of a catalogued body), `tools/api-rules.mjs` (why the type lint refused `{ start, end }` reads), `packages/astraeus/README.md` and `CHANGELOG.md` (the files this step must update).

Shapes (types in `packages/astraeus/src/api/sceneReads.ts`, each property has a doc comment in `scene.ts`): `bodies` `{ id, label, parent?, orbit, enlarge, description?, knownLimitations }`; `paths` `{ id, label, center, provenance, description?, knownLimitations }`; `groups` `{ id, label, count, center, plane, provenance, description, knownLimitations }`; `events` `{ id, label, timeUtcMs, type?, object?, provenance? }`; `panels` `{ id, timeUtcMs, title, body, badge, details, sources, object? }`; `views` `{ startId, place, items: [{ id, label }] } | undefined`; `scales` `string[]` (ids, opening first); `timeline` `{ windowStartUtcMs, windowEndUtcMs, openUtcMs, rates, rate, loop }`. Each plan answers its own list (`BodyPlan.reads`/`scaleChoices`, `pathReads`, `GroupPlan.reads`, `StoryPlan.eventReads`/`panelReads`, `ViewPlan.read`, `TimelinePlan.read`); `Scene` only forwards. Nothing calls `assembleScene` or reads `ExperienceDefinition`. `scaleChoicesOf` moved from `assembleScene.ts` into `BodyPlan.scaleChoices` (one rule, two users); group card text/provenance helpers (`groupDescription`, `groupLimitations`, `groupCardProvenance`, `listedGroupProvenance`) are shared by the draw layer and the read.

| Done When | Evidence |
|---|---|
| Read-only properties, frozen, from the scene's plans, doc comments, shapes recorded | Shapes above; `tests/sceneReads.test.ts` "lists what was added" (8 table rows), "is a frozen list of frozen items, fresh on every read", "views and timeline are frozen objects", provenance and card-text cases. |
| Outside reads and public answers (voyagers `src/scene.test.ts`, `voyager2.test.ts`, `voyagers.test.ts`; showers `tests/showerScene.test.ts`, `storyPanels.test.ts`, `parentAssociations.test.ts`, `parentRecords.test.ts`; all read only) | composition.bodies / [0] -> `bodies`; scaleChoices -> `scales`; trackedBodies ids -> `paths`; views.views / views.start -> `views.items` / `views.startId`; paths `*-orbit` ids -> `bodies[].orbit`; experience.objects label/description/known limits -> `bodies`/`paths`/`groups` `label`/`description`/`knownLimitations`; object provenance -> `scene.provenanceOf` (existing); groups[0].object / group.count / group.provenance -> `groups`; experience.events -> `events`; eventProvenance -> `events[].provenance`; storyPanels.panels -> `panels`; clock.startUtcMs -> `timeline.openUtcMs`; camera.far -> `camera.reach` (far = 2.5 x reach; no new read); `.prepare()` -> `scene.load` and the build-check `toDefinition` calls -> `scene.check` (T-259). Reads of `.toDefinition()` for "does not throw" (parentRecords, parentAssociations, voyagers) -> `scene.check`. |
| Table-driven test over one made-up scene with every kind of item, frozen, mounted scene still answers | `tests/sceneReads.test.ts` (22 tests): READS table, frozen table, "answers the same on a scene a viewer has taken" (via `markMounted`, and an edit still throws), empty/readable/only scale rows, default timeline. |
| CHANGELOG "From `toDefinition` to public reads" table | `packages/astraeus/CHANGELOG.md` Unreleased, entry "Added (O-056 T-260, G-016)", 17 rows. |
| Surface: lock regenerated, diff limited to additions, README and CHANGELOG updated, apiSurface/apiRules/allowlistGrowth pass | `npm run api:lock`: lock diff is +326/-0 (new members only: 8 Scene getters, 8 types). README API table rows added. `apiRules`/`apiSurface`/`allowlistGrowth` pass inside `npm test`; no allowlist changed. No error code added (no `api:errors`). |
| Gates | `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 206 files, 2554 passed, 2 skipped (second run clean; the first run printed one unhandled error attributed to `packages/astraeus-site/tests/loadingCoverChain.test.ts`, not reproduced on two reruns); `npm run check:node-consumer` pass ("node consumer: pass"). No browser run. |

Limitations: the pre-existing Voyagers/showers tests were not run or edited (read only). `scene.panels` and `scene.timeline` compute on each read, and a timeline with nothing setting a span or moment uses the moment of the read (documented). The first-run loadingCoverChain error is unexplained (flake suspected).

## Drift Notes

- API-04 says every span is `{ start, end }`, but the public-type lint (`tools/api-rules.mjs`) refuses `{ start, end }` numbers (unit and time rules) and also refuses a `start*`/`end*` pair in one type, so `timeline` reads `windowStartUtcMs` / `windowEndUtcMs` (flat); `views` reads `startId`. T-264 to reconcile API-04 wording for read-side spans (or the lint) in Design/Guardrails.
- The plan listed bodies/paths/groups without card text; the outside tests read info-card `description` and `knownLimitations`, so those were added to the reads (and `scene.provenanceOf` answers object provenance). Design "Public API shape" should list them.
- `scaleChoicesOf` moved from `assembleScene.ts` to `BodyPlan.scaleChoices`; group card helpers moved into `group.ts` and `core/listedOrbitGroup.ts` (`listedGroupProvenance`). Architecture-neutral but Design's scene-builder split note could mention them.
