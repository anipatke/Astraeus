---
id: T-280
objective: O-057
title: Check everything together and show the owner
status: in_progress
stage: audit
depends_on: [{task: T-279, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o057-planning-20261107}
---

# Check everything together and show the owner

## Outcome

0.8.0 has one migration table, up-to-date docs and a reconciled Design, and the whole package is proved together before the Full Objective Check.

## User Check

On `localhost:5490` at 375x667 and 1280x720, open the demos and site and read the story panels, badges included. Read the migration table in the CHANGELOG.

## Done When

I-145 is repaired to its Proof Needed (owner, 2026-11-07). One CHANGELOG migration table covers every 0.8.0 change, with Voyagers and showers notes (`toDefinition` replacements, `swift-tuttle`, every rename), each row checked against the lock; README and API reference are regenerated and within limits; `Public API shape` is reconciled, including the T-260 span tension, and every drift note from this Objective is accounted for; `apiTypeLint` breaks and `apiOutsideTypes` entries are empty; the examples build; `npm run check:browser` passes once; the owner approves the look. Apply `docs/agents/verification.md`.

## Context Files

`.savepoint/objectives/O-057-make-names-and-shapes-consistent-for-0-8-0/Objective.md`, `packages/astraeus/CHANGELOG.md`, `packages/astraeus/README.md`, `.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`, `docs/BROWSER_CHECKS.md`, `docs/agents/browser-policy.md`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-01, API-04, API-07, TEST-01, TEST-03.

## Implementation Plan

1. Compare the 0.7.0 surface with the lock and write the table. 2. Regenerate docs. 3. Reconcile Design and the drift notes. 4. Run the full gates, then `npm run check:browser` once. 5. Ask for the owner look.

## Boundaries

No publishing, no version bump (the release does that), and no changes inside the Voyagers or showers apps.

## Technical Verification

`npm run test:full`, `npm run check:engine-alone`, `npm run check:pack`, `npm run check:react-consumer`, then one `npm run check:browser`; the Full Objective Check reuses that browser run unless code changes after it. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Session t280-build-20261107 (builder). Task-check waiver: none recorded; the coordinator's run rules leave this step to the Full Objective Check.

| Done When | Test or evidence |
|---|---|
| I-145 repaired to its Proof Needed: a repeated id throws `duplicate-id` inside one call and across calls | `packages/astraeus/tests/publicApiStory.test.ts`: "a repeated id", "an id used in an earlier call"; `packages/astraeus/tests/verbGrammar.test.ts`: "addEvents: an id repeated inside one call throws duplicate-id and adds nothing from that call"; `scenePin.json` two rows changed by hand to the new code and message (`scenePin.test.ts` passes) |
| `addEvents` gains a row in `tests/verbGrammar.test.ts` | `verbGrammar.test.ts` `ADDS` row: "addEvents: a second call keeps the first", "addEvents: a repeated id throws duplicate-id and keeps what was there" |
| I-145 in the migration table | CHANGELOG `behaviour` row "A repeated event id threw `bad-event`"; history note on the Issue, left open for `savepoint-check` |
| One CHANGELOG migration table covers every 0.8.0 change | "Migration from 0.7.0 to 0.8.0" in `packages/astraeus/CHANGELOG.md`, 68 rows (4 removed, 24 renamed, 6 changed, 16 read, 18 behaviour); the T-260 table is folded in. `packages/astraeus-site/tests/migrationTable.test.ts`: "is one table, with something in every cell", "has a row for every removed or changed public name"; `renamedInputs.test.ts`: "has a row in the CHANGELOG migration table for every old name, naming its replacement" |
| Each row checked against the lock | `migrationTable.test.ts` cases per row: old names were public at 0.7.0 and are gone, changed names differ between the surfaces, every new name is in the lock. Planted proof: deleting the `ViewerChange.time` row and misspelling `SceneCamera.focus` failed two cases, then the file was restored. See "How the rows were verified" |
| Voyagers and showers notes (`toDefinition` replacements, `swift-tuttle`, every rename) | CHANGELOG "Note for the Voyagers app", "Note for the showers app"; written from reading both apps' source, neither edited. Showers gets Swift-Tuttle through `addBodyFromElements` from a copied record. `await scene.load()` on planets with no options proved by a throwaway test in the `cold` project, deleted after |
| README and API reference regenerated, within limits | `npm run api:errors`, `npm run api:lock`; API page measured raw 167,353 B, gzip 36,715 B (limits 200,000 and 40,000); `apiReference.test.ts` passes |
| `Public API shape` reconciled, including the T-260 span tension | `.savepoint/Design.md`: new bullet "Names and shapes as built (O-057, T-274 to T-280)", surface lock bullet, stale paragraphs and map rows; T-260 note marked settled by the owner |
| Every drift note accounted for | `.savepoint/Design.md` "Drift accounting for O-057 T-274 to T-279", each note reflected or non-architectural with a reason |
| `apiTypeLint` breaks and `apiOutsideTypes` entries empty | Read from the files: breaks 0, entries 0; `apiRules.test.ts` and `apiSurface.test.ts` pass |
| The examples build | `npm run build:example` exit 0; `hello-scene`, `hello-react`, `hello-planets` steps of the browser run pass |
| `npm run check:browser` passes once | Run once, exit 0: `docs/evidence/browser-20261107T010222Z/`, 2026-11-07 01:02:22 to 01:08:02 UTC, 340 s, 10 of 10 steps, error-lines 0 in every step |
| The owner approves the look | **Pending.** The coordinator arranges it; `owner_validation` is not recorded |

**How the rows were verified.** v0.7.0 has no lock (O-053 created it), so `git archive v0.7.0` went to a scratch folder and today's `currentSurface` ran on it; its root is `packages/astraeus-site/tests/fixtures/api-surface-0.7.0.json`. The test reads that and `api-surface.lock.json`. The check works both ways: rows against the surfaces, and every removed or changed name against the rows, apart from four widenings a host need not act on, listed in the test (`AddBodyOptions.orbit`, `SceneCamera.setReach`, `AstraeusScene`, `MountedScene`) and themselves held to be real differences. Limits: 18 `behaviour` rows and the panel rows whose old fields were `unknown` at 0.7.0 cannot be seen in a lock, so they were taken from the step entries and read against the v0.7.0 source where it mattered (`addStoryPanels` replaced, per `scene.ts`). The 16 `read` rows' old fields are not public types; each field name was found in the v0.7.0 source (`startUtcMs` by name only in core files, not traced to `clock`). `SceneCamera` as type only shows in the lock only through its constructor signature; `index.ts` has `type SceneCamera`.

**Gates** (fresh, after the last code change, in order): `npm run lint` exit 0; `npm run typecheck` exit 0; `npm run build` pass; `npm run test:full` 230 files, 3256 passed, 2 skipped, 0 failed, exit 0; `npm run check:engine-alone` pass (18.9 s); `npm run check:pack` pass (17.2 s); `npm run check:node-consumer` pass; `npm run check:react-consumer` pass (installed React 19.3.1); `npm run build:example` exit 0; `npm run check:browser` once, as above. No code changed after the browser run. The first `test:full` failed one test: the new site test imported the engine's `src`, which `packageBoundaries.test.ts` refuses, so that check moved into the engine's `renamedInputs.test.ts`; no boundary or count changed.

**Browser run.** Command `npm run check:browser`; steps smoke 219 s, smoke-public-showers 16 s, planets-phone 9 s, meteor-shower 17 s, views 43 s, hello-scene 11 s, hello-react 4 s, hello-planets, public-build-assets 1 s, public-addresses 0 s. `check-hello-scene.mjs` needed no repair: `StoryBadge` still writes `data-badge={sourceType}`, the example's panel is `illustrative`, and the `hello-scene` step passed. `driver.mjs` `watchHostChanges` is now proved by the `views` step. No screenshots.

**I-146 repair (owner "Add the read now", 2026-11-07; session i146-repair-20261107).** `SceneViewRead` gains `objects`, `events` and `panels`: the lists the viewer uses, shared items (named by no view) included. `ViewPlan.read(scope)` resolves with `resolveViews` against the finished scene; `Scene.views` supplies the scope as `assembleScene` does, so a bad id throws `bad-view` and a bad panel `bad-panels` as `mount` would. Tests (made-up scenes, ARCH-03) in `tests/sceneViews.test.ts` ("scene.views objects, events and panels": all three lists, each changed alone, a shared item no view names, fresh frozen lists, equal to `definitionOf` values, undefined with no views, `bad-view`) and the `views` row of `tests/sceneReads.test.ts`. CHANGELOG: new `read` row and the Voyagers note name the read; README read row; lock regenerated (`npm run api:lock`, +15 lines); Design O-057 accounting updated. Gates: lint, typecheck, build, test (230 files, 3264 passed, 2 skipped, migrationTable green), check:engine-alone, check:pack, check:node-consumer all pass. No browser script run; no allowlist change; `DEEP_IMPORT_COUNTS` unchanged. Task stays at `stage: audit`.

**Extra reads** (path, reason): `.savepoint/objectives/O-057-.../tasks/T-274` to `T-279` Technical Evidence and Drift Notes (named by the brief); `.savepoint/issues/I-145`; `agent-skills/references/issue-capture.md` (Issue rules); `docs/agents/build.md`; `packages/astraeus/src/api/{story,renamedInputs,errors}.ts`, `tests/{verbGrammar,publicApiStory}.test.ts`, `tools/api-surface.mjs`, `packages/astraeus-site/tests/apiSurface.test.ts` (repair and table check); `.savepoint/Design.md` whole, not only the named section, and `.savepoint/Guardrails.md` API-04, API-05 and ARCH-01 (stale paragraphs outside `Public API shape`); `docs/architecture/{demo-contracts,codebase-details,state-and-assets}.md`, `docs/ASTRONOMY_VALIDATION.md` (old names); `packages/astraeus-site/tools/validate/{run-browser,check-hello-scene,driver}.mjs`, `examples/hello-scene/src/main.js`, `src/shell/StoryPanelView.tsx`; v0.7.0 source in a scratch folder; read-only, by search: `/home/user/code/voyagers` and `/home/user/code/showers` `src`, `tests`, `tools`, `data/pacing.json`, `data/parents/associations.json`. These were logged at hand-off, not before each read.

**Files changed.** Engine: `src/api/{errors,planBodies,scene,story}.ts`, `src/synthetic/syntheticJourneyScene.ts` (doc comment), `README.md`, `CHANGELOG.md`, `api-surface.lock.json`, `tests/{publicApiStory,renamedInputs,verbGrammar}.test.ts`, `tests/fixtures/scenePin.json`. Demos (doc comments): `apollo11Scene.ts`, `showerScene.ts`. Site: new `tests/migrationTable.test.ts`, `tests/fixtures/api-surface-0.7.0.json`. Docs: `docs/BROWSER_CHECKS.md`, `docs/ASTRONOMY_VALIDATION.md`, `docs/architecture/{codebase-details,demo-contracts,state-and-assets}.md`, new `docs/evidence/browser-20261107T010222Z/`. Records: `.savepoint/Design.md`, I-145, new I-146, this Task. `o059-public-forms.md`, the release notes, the API review and the reconciliation history keep their history unchanged; T-274 already put the dated note in `o059-public-forms.md`.

**Limitations.** The migration notes were not tried against the two apps, because neither may be edited; only `scene.load()` was run. The owner's look is pending, so appearance, the overlap rule at 375x667 and 1280x720 for the longer panels, and the T-278 Apollo badge question are unjudged. New I-146: what each view shows has no public read, so the Voyagers note tells that app to test its own `VIEWS` list; this corrects the T-260 claim of a replacement for every read, and is for the owner to place. The CHANGELOG step entries keep the words of their day, and the table says it wins. The browser run took 340 s, against about 1 minute in `docs/agents/build.md`.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.

- I-146 (above) is the one new note; it is accounted for in Design's O-057 block.
