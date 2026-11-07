---
id: T-278
objective: O-057
title: Make story panels typed and honest about their sources
status: done
depends_on: [{task: T-277, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o057-planning-20261107}
check_waiver: {task: T-278, reason: 'Owner said "orchestrate O-57" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o057-run-20261107}, recorded_at: '2026-11-06T23:28:31Z'}
---

# Make story panels typed and honest about their sources

## Outcome

Story panels are typed, checked at the call, carry `provenance`, append, and take their playback settings from their own call.

## User Check

Open a panel in a test scene and see its badge, sources and accuracy; adding panels twice keeps both batches.

## Done When

`StoryPanelInput` replaces `unknown[]`; `addStoryPanels(list)` appends, a repeated id throws `duplicate-id` and a bad shape throws `bad-panels` at the call; event, anchor and object links are checked at `check` and `mount`; `at.time` takes `TimeInput`; `provenance` replaces `badge` and `sources`, and the panel shows the source type, sources, accuracy and notes; `setStoryPanelPlayback({ pauseSeconds, autoOpen })` replaces that setting; old inputs join the `renamed` table; the call-twice grammar test covers panels; `ScenePanelRead` matches; every Apollo, showers, planets and test-scene panel is moved, with accuracy and notes drawn from what its `details` and sources already state and never invented; the last `apiTypeLint` breaks go, so its `breaks` list is empty.

## Context Files

`.savepoint/objectives/O-057-make-names-and-shapes-consistent-for-0-8-0/Objective.md`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/src/api/planStory.ts`, `packages/astraeus/src/api/sceneReads.ts`, `packages/astraeus/src/core/storyPanels.ts`, `packages/astraeus/src/shell/storyPanels.ts`, `packages/astraeus/src/core/provenance.ts`, `packages/astraeus-demo-showers/data/stories/perseids/panels.json`, `packages/astraeus-demo-showers/data/stories/geminids/panels.json`, `packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Scene.ts`, `packages/astraeus-site/src/synthetic/syntheticScene.ts`.

## Design References

`Public API shape (G-016, owner 2026-11-01)`, `O-053 checks (Guardrails API-01 to API-07)`.

## Guardrails

API-02, API-04, API-05, PROV-01, ARCH-01, ARCH-03, TEST-01, TEST-02.

## Implementation Plan

1. Write the input type and split shape checks (at the call) from link checks (at build). 2. Make adding append and add the set call. 3. Move the panel to `provenance`, on screen included, phone first. 4. Convert panel data. 5. Regenerate the lock and clear the lint.

## Boundaries

No new panel features and no redesign beyond showing the provenance fields. Panels must not collide at 375x667 or 1280x720. A panel whose accuracy cannot be stated from its sources says so plainly.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`), plus `npm run check:engine-alone` and `npm run check:pack`. No browser run: the one `npm run check:browser` belongs to the last step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Session t278-build-20261107. Task-check waiver: none recorded; the coordinator's run rules leave this step to the Full Objective Check.

**Done When to test**

| Done When | Test (file: case) |
|---|---|
| `StoryPanelInput` replaces `unknown[]` | `packages/astraeus-site/tests/apiRules.test.ts`: has no breaks left from the API review (O-057 T-278) |
| `addStoryPanels(list)` appends | `packages/astraeus/tests/publicApiStory.test.ts`: appends: a second call keeps the first batch; `packages/astraeus/tests/verbGrammar.test.ts`: addStoryPanels: a second call keeps the first |
| A repeated id throws `duplicate-id` | `publicApiStory.test.ts`: a repeated id throws duplicate-id at the call, inside one batch and across calls, and a failed batch adds nothing; `verbGrammar.test.ts`: addStoryPanels: a repeated id throws duplicate-id and keeps what was there |
| A bad shape throws `bad-panels` at the call | `publicApiStory.test.ts`: throws bad-panels at the call for %s, naming the panel and field (17 rows, one field wrong each); refuses what is not a list, and an entry that is not an object, at the call |
| Event, anchor and object links are checked at `check` and `mount` | `publicApiStory.test.ts`: throws bad-panels for %s at check and mount, not at the call; links are read when the scene is built, so an event, anchor or object added after the panel is found; `sceneCheck.test.ts`: bad-panels: check, mount and prepareScene throw the same error |
| `at.time` takes `TimeInput` | `publicApiStory.test.ts`: takes at.time as any TimeInput through the normal converter |
| `provenance` replaces `badge` and `sources` | `renamedInputs.test.ts`: StoryPanelInput.badge, StoryPanelInput.sources rows; a panel carrying an old form beside its provenance is refused, so no path accepts both |
| The panel shows the source type, sources, accuracy and notes | `domStory.test.ts`: shows the source type word, then the accuracy and notes between the details and the sources; a panel with no details still folds its accuracy and notes under Sources; `storyPanelSettings.test.ts`: the badge shows the word for %s (all five); states the accuracy always and leaves out a Notes heading when the notes are empty |
| `setStoryPanelPlayback` replaces that setting | `publicApiStory.test.ts`, describe setStoryPanelPlayback: replaces the whole setting; sets each setting alone; throws bad-panels at the call for %s; `verbGrammar.test.ts`: setStoryPanelPlayback row; `lifecycle.test.ts`: every add, set ... throws scene-mounted after mount (walks the new call) |
| Old inputs join the `renamed` table | `renamedInputs.test.ts`: %s: the old name alone throws renamed and names its replacement (six new rows); the old addStoryPanels object form names the list form and setStoryPanelPlayback, whatever it carried |
| The call-twice grammar test covers panels | `verbGrammar.test.ts`: new file; no such table existed, see Drift Notes |
| `ScenePanelRead` matches | `sceneReads.test.ts`: panels row; `sceneInputCopies.test.ts`: addStoryPanels and setStoryPanelPlayback rows (input copies, including a Date in `at.time`) |
| Every panel moved, accuracy and notes never invented | `domDemoStories.test.ts`: has panels, each with a title, a badge, a body, source lines (now accuracy, notes, no dash punctuation, all four demos); `rebuildComparison.test.ts` in Apollo and Showers: fixtures untouched, the new shape projected to the old words, so every badge word and source line is proved unchanged; `storyStoriesAllDemos.test.ts`, `storyPanels.test.ts` |
| The last `apiTypeLint` breaks go, `breaks` empty | `apiRules.test.ts`: has no breaks left from the API review (O-057 T-278); `allowlistGrowth.test.ts` |

**Gates** (fresh, 2026-11-07): `npm run lint` pass; `npm run typecheck` pass; `npm run build` pass; `npm test` 229 files, 3143 passed, 2 skipped, 0 failed; `npm run check:engine-alone` pass; `npm run check:pack` pass; `npm run check:node-consumer` pass; `npm run check:react-consumer` pass. After build and the four checks, one test file changed (`showersYearHorizons.test.ts`, below); lint, typecheck and `npm test` were rerun after it. `npm run api:lock` regenerated the lock. API page: raw 167,204 B, gzip 36,687 B (limits 200,000 and 40,000), held by `apiReference.test.ts`.

**Panels whose badge word changed:** none. Every `observed`, `modelled` and `illustrative` stayed; no panel became `ephemeris` or `reconstructed`.

**Panels whose accuracy could not be stated** (`accuracy` opens "Not stated by the source."): Apollo tli-cutoff, loi, powered-descent, touchdown, ascent-docking, tei, splashdown; Jupiter volcanoes, squeezed, rhythm; Perseids stream-shape; Geminids best-shower. Geminids earth-crossing states the peak window only and says the other figures are not stated. Stated from the panel's own text: Perseids earth-crossing, swift-tuttle; Geminids phaethon. The Apollo "printed to a tenth of a second" comes from `eventProvenance` in `apollo11Scene.ts`.

**Scene pin:** `tests/fixtures/scenePin.json` updated by `vitest -u` and read line by line in the diff: only the new panel shape, the views panels' fuller made-up source and notes, and error rows moving from the build to the call. `addStoryPanels(undefined)` used to pass silently and now throws `bad-panels`.

**Extra reads (logged at hand-off, not before each read):** `packages/astraeus/src/api/renamedInputs.ts`, `frozenCopy.ts`, `time.ts`, `core/timeInput.ts`, `shell/StoryPanelView.tsx`, `Sources.tsx`, `ProvenanceBadge.tsx`, `infoModel.ts`, `style.css` panel rules (the code the owner brief names); `tools/api-rules.mjs` and the allowlist (lint); the test files listed above and `.savepoint/Design.md` "Public API shape", Guardrails rows named by this Task; `docs/agents/verification.md`; `agent-skills/references/issue-capture.md` for I-145; `packages/astraeus-demo-showers/data/showers/geminids.json` `parentElements.accuracy`, `credits/APOLLO11_SOURCES.md` (accuracy records).

**Files changed:** engine `src/api/{index,planStory,renamedInputs,scene,sceneReads,story,time}.ts`, `src/core/{provenance,storyPanels,timeInput}.ts`, `src/shell/{Sources.tsx,StoryPanelView.tsx,experience.ts,storyPanels.ts,style.css}`, `src/synthetic/{syntheticDefinition,syntheticViewsDefinition}.ts`, `README.md`, `CHANGELOG.md`, `api-surface.lock.json`; demos: the four `panels.json`, `apollo11Scene.ts`, `planetScene.ts`, `showerScene.ts`, `showerSettings.ts`; site: `syntheticScene.ts`, `syntheticViewsScene.ts`, `tools/site/api-reference.mjs`, `tests/apiTypeLint.allowlist.json`; `tools/api-rules.mjs`, `tools/check-node-consumer.mjs`, `examples/hello-scene/src/main.js`; tests as listed; new `tests/verbGrammar.test.ts`; new Issue I-145. `no-panels/panels.json` needed no change.

**Limitations:** no browser run and no screenshots, by instruction, so the overlap rule at 375x667 and 1280x720 is unproved on screen. The change adds only flowing text inside the existing folded section of the scrolling panel, with no new positioned element. `check-hello-scene.mjs` still reads `data-badge` and was not run. A panel with no details keeps the summary "Sources", though the fold now also holds accuracy and notes, because `domStory.test.ts` holds that label.

## Drift Notes

Record architecture deltas for the last step of this Objective, which reconciles them in Design.

- `core/storyPanels.ts`: `parseStoryPanels` is gone; three functions replace it: `checkStoryPanel`, `checkPanelPlayback` (at the call) and `resolveStoryPanels` (at build). `core/timeInput.ts` gains `timeInputMs`, the one conversion `api/time.ts` also uses, so `core/` can convert a moment without importing `api/` (ARCH-04).
- `addStoryPanels([])` still gives the experience an empty panel set, so a story with no panels keeps its own playback settings (planets `no-panels`). `setStoryPanelPlayback` alone gives no panel set.
- `tools/api-rules.mjs` lost its parser-reading special case for panel times; the type walk covers them now.
- The brief named an existing call-twice grammar test, but none existed; `tests/verbGrammar.test.ts` starts that table. `addEvents` cannot join it yet: a repeated event id throws `bad-event` (I-145, for the owner to place).
- `Scene.setTimeline`'s doc comment still says `{ from, to, rate }` and `{ near: { type, within } }`, left from T-276; for T-280's documentation pass.
- `docs/architecture/demo-contracts.md`, `o059-public-forms.md` and `codebase-details.md` still describe the old panel forms as history; for the reconciling step.
- Possible owner look: Apollo powered-descent, touchdown and ascent-docking stay `observed` because their published times are the panel's facts, while their notes say the drawn path is a reconstruction.
