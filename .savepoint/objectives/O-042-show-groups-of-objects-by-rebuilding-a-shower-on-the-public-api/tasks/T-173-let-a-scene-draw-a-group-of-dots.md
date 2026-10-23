---
id: T-173
title: Let a scene draw a group of dots
objective: O-042
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o042-planning-20261024}
check_waiver:
  task: T-173
  reason: 'Owner said "orchestrate O42"; under the standing O-042 run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o042-run-20261024}
  recorded_at: '2026-10-23T23:47:37Z'
---

# Let a scene draw a group of dots

## Outcome

`scene.addGroup(...)` adds many listed orbits as one group of dots (one colour, dot size, menu item, info card, provenance and known limits), with seeded placement along each orbit and an optional clump near a body; thin over the existing listed-orbit group and `points` layer. `examples/hello-scene` gains a small made-up ring of dots.

## User Check

None required.

## Done When

- `addGroup` and its input type exported with doc comments and on `/api` (in a named section).
- New `SceneError` code `bad-group` (empty list, unbound orbit, duplicate id, bad clump) tested on a made-up configuration (ARCH-03).
- Group ids join the automatic camera menu and can be named by story panels.
- A refill option (how often dots are re-placed) is offered; a slice option only if the default proves too coarse.
- hello-scene uses it; `check-hello-scene.mjs` reads the dot count through `driver.mjs` (mapped in `docs/BROWSER_CHECKS.md`); `publishWorkflow.test.ts` story-length rule updated if needed.
- README and CHANGELOG entries.
- Hand-off gates plus `check:engine-alone`, `check:pack`, `build:example` green.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/src/app/experienceDefinition.ts`, `packages/astraeus/src/core/listedOrbitGroup.ts`, `packages/astraeus/src/core/pointGroup.ts`, `packages/astraeus/src/app/PointsView.ts`, `packages/astraeus/tests/publicApi.test.ts`, `packages/astraeus/tests/publicApiStory.test.ts`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `examples/hello-scene/src/main.js`, `packages/astraeus-site/tools/validate/check-hello-scene.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `packages/astraeus-site/tests/publishWorkflow.test.ts`, `packages/astraeus-site/tools/site/api-reference.mjs`, `docs/BROWSER_CHECKS.md`.

## Design References

Design Interfaces and Data Flow (points layer), Current Technical State O-041.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, PROV-01, TEST-01, TEST-03, STYLE-05, CODE-02.

## Implementation Plan

1. Scene option over the listed-orbit group. 2. Menu and panel lookup. 3. Tests. 4. hello-scene ring and its browser step (run alone once). 5. Docs.

## Boundaries

Only listed-orbit groups (Decision 3); no new draw code.

## Technical Verification

Hand-off gates from AGENTS.md (`npm run lint`, `npm run typecheck`, `npm run build`, `npm test`) plus the extra gates named in Done When. No `npm run check:browser` per Task (one run at the Full Objective Check); a changed browser step may be run alone once. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built `scene.addGroup` as a thin layer over `createListedOrbitGroup` and the `points` layer (no new draw code, Decision 3): `packages/astraeus/src/api/group.ts` (new: `GroupInput`, `GroupOrbitInput`, `GroupClumpInput`, validation, layer build), `scene.ts` (`addGroup`, shared id namespace, group layers, camera menu and panel `object` lookup, no info-card bars for a group), `errors.ts` (`bad-group`), `index.ts` (exports). Group centre defaults to the scene's first body; reference time defaults to the opening time; `refillAfterMs` offered, slice option not (default not shown too coarse). Known limits: caller's first, then engine placement, clump and two-body lines.

Criteria:
- Exports with doc comments, on `/api` in a new "Groups of dots" section (`packages/astraeus-site/tools/site/api-reference.mjs`): done; the doc-comment test and `npm test` pass.
- `bad-group` tested on a made-up ring: `packages/astraeus/tests/publicApiGroup.test.ts` (9 tests: layer/menu item/provenance, known limits, camera menu and panel, seeded placement within each orbit's reach, clump, centre and ids, bad input list, centre/clump body missing, no bars).
- hello-scene: ring of 40 in `examples/hello-scene/src/main.js` (74 lines, limit 80); `check-hello-scene.mjs` `checkGroup` reads the point group through `driver.mjs` `scenePointGroup`; mapped in `docs/BROWSER_CHECKS.md`; `publishWorkflow.test.ts` call list gained `addGroup(`. Ran the changed step alone once on the built example (HELLO_STORY=1, preview on port 5611, evidence in scratchpad `hello-run`): ringDots 40, errors [], pass. No `check:browser`.
- README row and CHANGELOG entry added.

Gates (all pass): `npm run lint`, `npm run typecheck`, `npm test` (125 files, 1658 passed, 1 skipped), `npm run build`, `npm run check:engine-alone`, `npm run check:pack`, `npm run build:example`. Lint needed `planGroup` split into helpers and a `groupLayersEntry` helper (complexity 20).

Unverified: owner look at the ring (not required); the clump near a planet-series body (Moon) works without the planet series in the unit test but was seen only in the browser step with the Moon.

## Drift Notes

Record architecture deltas for Design reconciliation in the showers rebuild Task.
- `addGroup` ids share one namespace with bodies and paths (`duplicate-id`); a group is built at `toDefinition` (not at `addGroup`), because its centre and opening time come from the finished scene. Group bounds follow the timeline window.
