---
id: T-339
title: Show the tile and chart on the public parts page
objective: O-081
status: done
depends_on: [{task: T-338, requires: clear}]
check_waiver: {task: T-339, reason: 'Owner said "Orchestrate this obj" (O-081): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o081-20261121}, recorded_at: '2026-11-21T07:23:30Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o081-20261121}
---

# Show the tile and chart on the public parts page

## Outcome

The public Parts page lists the readout tile and the chart in the same plain-words shape as the first set: a plain name, one sentence on what it is for, a "For example:" line about a space story, story-job tags, a Run button with a live synthetic example, and the code tucked into the "For developers" fold. Their types appear on the shelf API page.

## User Check

Open `localhost:5490/components.html` at 375x667 and 1280x720: both new entries read in plain words; Run shows the chart with a highlighted range and the tile updating as time moves (top left on desktop, the strip and its sheet on a phone); the fold shows the import and add lines and the whole example.

## Done When

The "Catalogue and docs" O-081 Success Condition holds: entries in `packages/astraeus-site/data/shelf-catalogue.json`, examples `packages/astraeus-site/src/catalogue/examples/chart.ts` and `readoutTile.ts` (shown through `?raw`, so the shown code is the run code), `shelfCatalogue.test.ts` passing with no gate-keeping placeholders left, the tile and chart on `api/shelf.html`, the site browser driver and the catalogue journey covering both entries at both sizes, README and CHANGELOG complete. Apply `docs/agents/verification.md` and `docs/agents/browser-policy.md` (one browser job at a time).

## Context Files

- `.savepoint/objectives/O-081-info-tile-the-app-fills/Objective.md`
- `docs/architecture/viewer-interface.md` under `11. Story-component shelf` (the "Public catalogue page" paragraph)
- T-337 and T-338 `Technical Evidence`
- `packages/astraeus-site/components.html`
- `packages/astraeus-site/data/shelf-catalogue.json`
- `packages/astraeus-site/src/catalogue/examples/colourKey.ts`
- `packages/astraeus-site/tests/shelfCatalogue.test.ts`
- `packages/astraeus-site/tools/validate/catalogue-lines.mjs`
- `docs/agents/browser-policy.md`
- `packages/astraeus/README.md` under `Looks, controls and views`
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

Design "Viewer interface", "The planets demo and the site on the public way".

## Guardrails

ARCH-01, ARCH-03, TEST-01, TEST-03, STYLE-09.

## Implementation Plan

1. Confirm both parts are exported with `@shelf` doc comments; return REPLAN REQUIRED if not.
2. Write the two entries in plain words and the two synthetic examples (made-up counts and a made-up live value; no story data, no app names).
3. Replace any gate-keeping placeholder from the earlier Tasks.
4. Extend the browser driver and catalogue journey to run both examples at both sizes; check the tile strip and sheet on the phone size.
5. README and CHANGELOG finish.

## Boundaries

No engine behaviour changes (an engine defect found here is reported, or captured as an Issue, not fixed in this Task), no page redesign, no changes to the site's other demos.

## Technical Verification

Focused site tests, then configured gates; one browser run of the catalogue journey at 375x667 and 1280x720. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads (beyond Context Files): T-338 evidence pattern; `packages/astraeus-site/src/catalogue/{page.ts,sourceLines.ts,madeUpScene.ts}` (how an example is run), `tools/site/shelf-catalogue.mjs` and `tools/site/api-reference.mjs` (the shelf page is built from `@shelf` exports and `shelf/` modules, so the tile and chart types appear on `api/shelf.html` with no code change), `tests/apiReference.test.ts` (to place a new case), `tools/validate/{driver.mjs,runner.mjs}` (driver hooks; run one step), `packages/astraeus/src/shell/{useShelfTile.tsx,areas/screen.ts}` and `src/shelf/chart/View.tsx` (DOM hooks; phone rule: viewer width <= 700 px), `src/api/{mount.ts,viewerParts.ts,viewerHandle.ts}` (`onChange`; `part()` matches by id and kind).

Per outcome:
- Entries in plain words (name, one-sentence purpose, "For example:" line about a space story, story-job tags: tile = readout; chart = explainer + filter) in `data/shelf-catalogue.json`; `shelfCatalogue.test.ts` plain-words, fold and text cases pass; no gate-keeping placeholder is left (T-337/T-338's minimal entries and examples were replaced).
- Examples `src/catalogue/examples/chart.ts` and `readoutTile.ts` (synthetic data, no app names; shown through `?raw`, so shown code is run code). The tile stands alone (no panel). Both export an optional `live(viewer)` that the page runs after `ready` (page.ts `Example.live?`, stopped on stop or unmount): the tile's value, dot and facts follow the viewer's time (`onChange`); the chart opens its panel and moves its lit range every three invented days.
- Rule widened in `shelfCatalogue.test.ts` (authorised): the first thing in `addParts` must be a call to a shelf export (derived from the `@shelf` list, not a hard-coded pair); a block added alone is still refused because the "builds a scene" case runs `addParts`. No other existing test changed.
- `api/shelf.html`: new case in `apiReference.test.ts` proves `chart`, `readoutTile`, `ChartInput`, `ChartControl`, `ReadoutTileInput`, `ReadoutTileControl`, `ReadoutScale`, `TilePart`, `setHighlight` and `setScaleValue` are on the page; the existing size-budget case still passes.
- Site driver (`tools/validate/driver.mjs`: `catalogueTile`, `pressCatalogueTileStrip`, `waitForCatalogueTileSheet`, `waitForCatalogueTileChange`, `catalogueChart`) and the catalogue journey (`journey-catalogue.mjs`: ITS_WORDS gained chart and readoutTile; a new end section runs the chart and the tile at both sizes). Desktop: the tile is the full card in the left half of the box and its value changes as time moves; phone: a strip, and pressing it opens the sheet.
- `components.html`: entry grid changed from 1fr/1.7fr to 1fr/2fr so the demo box is about 744 px at 1280 (it was about 703, close to the 700 px phone rule, which would draw the tile as a strip on desktop).
- README and CHANGELOG: the engine's README rows and 0.9.5 Added lines for `chart` and `readoutTile` (T-337, T-338) are complete; no engine behaviour or API changed here, so no new lines.

Commands: `npm run lint` ok; `npm run typecheck` ok; `npm run build` ok; `npm test` (configured form, junit written to the scratchpad, not the repo): 289 files, 4627 passed, 2 skipped, 0 failed. Browser: the catalogue journey ran ONCE alone (dev server on 5479, `journey-catalogue.mjs`, evidence in the scratchpad), passed at 1280x720 and 375x667 with no errors; the full `check:browser` set not run.

Files changed: packages/astraeus-site/{components.html, data/shelf-catalogue.json, src/catalogue/page.ts, src/catalogue/examples/chart.ts, src/catalogue/examples/readoutTile.ts, tests/apiReference.test.ts, tests/shelfCatalogue.test.ts, tools/validate/driver.mjs, tools/validate/journey-catalogue.mjs}; this Task file.

Limitations: looks unjudged (owner on localhost:5490); the journey asserts presence, position (left half), text change and the sheet opening, not appearance; the live value updates only while time runs or is moved; `check:pack`, size gates and the full browser set not run.

## Drift Notes

Record architecture deltas here for the planner to reconcile in T-340 before the Full Objective Check.

For T-340 (Design reconciliation):
- Catalogue examples may export an optional `live(viewer): () => void` that the page calls after `ready` (site code, not engine); tile and chart use it for synthetic motion. The "Public catalogue page" paragraph can mention it.
- `shelfCatalogue.test.ts`: an example's first `addParts` entry may be any shelf part (a tile stands alone), no longer only `panel(`; the paragraph should say so.
- Catalogue entry grid is 1fr/2fr so the demo box clears the 700 px phone rule at 1280 (the viewer's own width decides phone or wide, so a box narrower than 700 px shows a tile as a strip).
- The shelf API page needs no list: it is built from `@shelf` exports and `shelf/` modules, so the tile and chart appear by themselves.

Coordinator: reviewed the diff; the only existing-test change is the authorised widening of the first-`addParts` rule (now any `@shelf` export); one new apiReference case. Gates green (4627 passed, 2 skipped, 0 failed); catalogue journey passed once at both sizes. Coordinator marked done (owner: "Orchestrate this obj").
