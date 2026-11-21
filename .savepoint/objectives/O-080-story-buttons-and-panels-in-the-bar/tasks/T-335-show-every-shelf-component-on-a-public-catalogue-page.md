---
id: T-335
objective: O-080
title: Show every shelf component on a public catalogue page
status: done
depends_on: [{task: T-334, requires: clear}]
check_waiver: {task: T-335, reason: 'Owner said "Orchestrate 080": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o080-20261121}, recorded_at: '2026-11-21T05:15:22Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o080-20261121}
---

# Show every shelf component on a public catalogue page

## Outcome

A new site page, `components.html`, linked beside Assets, lists each shelf part: what it is (the first sentence of its doc comment), suggested uses by story job (switch, filter, readout, explainer), a live example on a synthetic scene run on demand one viewer at a time and shown as its own source, and the import and `addParts` lines from that example; plus a "What you get out of the box" section for the basic interface. A test keeps it complete.

## User Check

Open `/components.html` on localhost:5490 at 1280x720 and 375x667: every part has its entry; starting an example runs one viewer (starting another stops the first); the shown code is the run code; nothing overlaps. Remove a part's entry and `shelfCatalogue.test.ts` fails.

## Done When

The "Catalogue" O-080 Success Condition holds: page, navigation link, `data/shelf-catalogue.json`, `src/catalogue/examples/<part>.ts` (one per part, built only through the public API), `tests/shelfCatalogue.test.ts` (a `@shelf` root export with no entry or example fails; an entry naming no such export fails). The page is in the site build, its load budget and public-address lists as other pages are; the browser driver and a journey (or an extension of an existing one) cover it at both sizes. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md` under `11. Story-component shelf`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/Objective.md`
- `.savepoint/Design.md` under `The planets demo and the site on the public way`
- `packages/astraeus-site/assets.html`
- `packages/astraeus-site/index.html`
- `packages/astraeus-site/vite.config.ts`
- `packages/astraeus-site/src/synthetic/syntheticLookOutScene.ts`
- `packages/astraeus-site/tools/site/api-reference.mjs`
- `packages/astraeus-site/tools/validate/load-budget.mjs`
- `packages/astraeus-site/tools/validate/public-addresses.mjs`
- `packages/astraeus-site/tools/validate/driver.mjs`
- `packages/astraeus-site/tools/validate/journey-views.mjs`
- `packages/astraeus-site/tests/apiReference.test.ts`
- `docs/agents/browser-policy.md`

## Design References

Design "The planets demo and the site on the public way", "Viewer interface", "Size budgets are split".

## Guardrails

ARCH-01, ARCH-03, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm the four content parts and `panel`/`customBlock` are exported with `@shelf`; return REPLAN REQUIRED if not.
2. Page shell and navigation link, styled like the site's other pages.
3. JSON entries and one example per part; read doc-comment first sentences at build (reuse the API reference's export reader).
4. On-demand runner: one viewer at a time, unmounting the previous; `?raw` source shown beside it.
5. Completeness test; build, load-budget and public-address wiring; driver and journey at both sizes.

## Boundaries

No engine changes except a doc-comment wording fix; no changes to the existing demos; no readout tile or chart entries (O-081).

## Technical Verification

Focused tests during iteration; configured gates at handoff. No browser run per step (browser policy); the Full Check runs `check:browser` once. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executed 2026-11-21 by a builder session (Sonnet), in plan order. No browser run (the Full Check runs `check:browser` once).

**Per criterion**

- Plan 1: all six parts' root exports already carried `@shelf` (T-333, T-334); no engine edit was needed.
- Page and link: `packages/astraeus-site/components.html` (a static shell in the assets page's look, with a placeholder), linked from `index.html` beside Assets as "Parts" (the phone nav row fits only with a short word: the row is brand plus Assets, Parts, API, GitHub at 375 px; a `max-width: 520px` rule shrinks the pill gap and padding). `vite.config.ts` adds the page as a build input and a `shelfCatalogue` plugin (`transformIndexHtml`) that fills the placeholder in the build and in the dev server.
- Entry text: `tools/site/shelf-catalogue.mjs` writes each entry from `collectExports()` (the API reference's reader; it now also returns `shelf: true` for a `@shelf` doc comment, `api-reference.mjs` and `.d.mts`) with the first sentence of the doc comment, the suggested uses by story job and the out-of-the-box list from `data/shelf-catalogue.json`. An entry naming a non-`@shelf` export fails the build.
- Examples: `src/catalogue/examples/{panel,customBlock,explainer,actions,filterChips,colourKey}.ts`, each `buildScene()` on `src/catalogue/madeUpScene.ts` (one invented object on an invented orbit from `addBodyFromElements`: no Sun or picture, because an orbit line would need the Sun and its texture), public `astraeus` API only, no outside app named.
- Runner: `src/catalogue/page.ts`. Run unmounts whichever viewer is running (any entry) before mounting; the engine and the example are dynamic imports, so they load on a press only; the example text comes from `?raw` (`import.meta.glob`), and `src/catalogue/sourceLines.ts` cuts the import and `scene.addParts(...)` lines from that same text, so shown code is run code.
- Completeness: `tests/shelfCatalogue.test.ts` (34 cases): the set of `@shelf` exports equals the six; each has an entry and an example; an entry or example naming no such export fails (also a small proof of the two filters); jobs are known and all four jobs are used; each example imports only `astraeus` and `../madeUpScene`, holds `scene.addParts([panel(...` and its own part, builds a scene and `await scene.load()` (so an action camera naming a missing object would fail); the page text has an entry, run button and code places per part in order, the doc-comment sentence, the out-of-the-box names; the link, build input and placeholder exist; `firstSentence` cases.
- Build wiring: load budget `ALL_PAGES` gains `components.html` as a stem page set (an html-page set would follow the engine's lazy references to every body picture: 6.3 MB gzip): files `components.html, components.js, preload-helper.js, api.js, api.css, frameStats.js, madeUpScene.js` and the six example chunks. Measured on the public build with `ASTRAEUS_ENGINE_SHARE=1`: own share 1,308,490 B raw and 363,637 B gzip (React, three and the page; the engine share 549,593 B raw / 169,223 B gzip is subtracted), limits set to measured plus 5% rounded up to the next 10,000: 1,380,000 raw, 390,000 gzip. `REQUIRED_PAGES` in `public-build-assets.mjs` gains `components.html`; `tests/publicBuild.test.ts` page-id list gains it. A public build was checked with `load-budget.mjs dist`: every page ok.
- Browser: driver functions `catalogueParts`, `pressCatalogueRun`, `waitForCatalogueState`, `catalogueActive`, `catalogueViewerCount`, `catalogueEntry`, `catalogueBasics`, `catalogueFit` (data- selectors only, so `driverNoIds` and `browserDriverGuard` pass); `tools/validate/journey-catalogue.mjs` at 1280x720 and 375x667 touch (entries in order, import/add lines, shown code holds the add line, Run buttons 44 px on phone, no sideways scroll, words and example do not cross, one viewer at a time, stopping leaves none, every part starts); new step `catalogue` in `run-browser.mjs` with limit 40 s in `tools/gate-limits.json` and rows in `docs/BROWSER_CHECKS.md` (limit table and step paragraph); `browser-smoke.mjs` opens `components.html` beside index and assets. Not run (browser policy).
- Owner opens `http://localhost:5490/components.html` (preview) at 1280x720 and 375x667.

**Commands run (final state)**

- `npm run lint`: clean. `npm run typecheck`: clean. `npm run build`: built (existing chunk-size warning).
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 4526 passed, 2 skipped, 2 failed of 4530; the 2 failures are `packages/astraeus-site/tests/packagePacks.test.ts` for the known engine pack limit (`astraeus: unpacked 9.57 MB is over 9.5 MB`). Limits not raised.
- Focused: `shelfCatalogue`, `gateLimits`, `driverNoIds`, `browserDriverGuard`, `browserAssertions`, `publicBuild`, `apiReference` all pass. `ASTRAEUS_PUBLIC_BUILD=1 ASTRAEUS_ENGINE_SHARE=1 npm run build` then `node packages/astraeus-site/tools/validate/load-budget.mjs dist`: all pages ok (Apollo 11 own raw 4,137,292 of 4,240,000, the tightest). Dev server on a scratch port returned the page with six entries and the script and a raw example (200).
- API reference page: 45,974 B gzip (unchanged; cap 46,000; no doc comment was edited).

**Files read:** Task, Objective (Catalogue, Proof and docs), `docs/architecture/viewer-interface.md` section 11, `assets.html` (head and CSS), `index.html` (nav), `vite.config.ts`, `api-reference.mjs`, `load-budget.mjs`, `public-addresses.mjs` (no change needed: it lists demo addresses and retired links only), `driver.mjs` (head, `loadAddress`, tail), `journey-views.mjs`, `journey-planets-phone.mjs`, `harness.mjs`, `run-browser.mjs`, `browser-smoke.mjs`, `driver-guard.mjs`, `assertion-list.mjs` (heads), `docs/BROWSER_CHECKS.md` (limit table), `tools/gate-limits.json`, `gateLimits.test.ts`. Extra reads (path, reason): `packages/astraeus/README.md` headings and two tables (what the basic interface offers, for the out-of-the-box list); `packages/astraeus/src/api/mount.ts`, `containingBlock.ts` (the viewer needs a sized element); `planBodies.ts` lines 225-238 (why `orbit: true` needs the Sun); the shelf factories (doc comments, input shapes); `tests/shelfContentParts.test.ts` head (how scenes are built); `docs/agents/build.md`.

**Existing tests changed:** `packages/astraeus-site/tests/publicBuild.test.ts`: the expected page-id list gains `"components.html"` after `"assets.html"` (an addition to a page list; no fixture or setup changed).

**Limitations:** nothing was run in a browser: the page's look at both sizes, the real viewer mounting inside the stage, that each example's bar button text is found in the stage text, the Run button heights and the `catalogue` step time (limit 40 s is a guess) are unverified until the owner's look and the Full Check. The "Parts" nav label fits the phone row by estimate only.


## Drift Notes

Record architecture deltas for the planner.

- Design.md ("The planets demo and the site on the public way"): the site now has a fourth page, `components.html` (a build input, a stem page set in the load budget and a required page of the public build), and a `shelfCatalogue` Vite plugin. Deferred to T-336 reconciliation.
- Chunking drift: adding a second entry that imports the engine makes the bundler move the engine, React and three out of `app.js` into a shared `api.js` chunk (with `api.css` and `frameStats.js`), and folds `app.css` and `scene.js` into them. The app page sets in `load-budget.mjs` listed `app.css`/`scene.js` and failed on the unlisted `api.js`, so `api.js`, `api.css` and `frameStats.js` joined `APP_SHARED` and the optional `SPLIT_CHUNKS` set (with `app.css` and `scene.js`). The app's own-share numbers moved only by that regrouping and still pass; the owner may want to know the public app now loads the engine as a separate (shared, cacheable) chunk.
- An `@shelf` marker is read through `collectExports().shelf` (new field), not by a second doc-comment reader.
- O-081's two parts (`chart`, `readoutTile`) need only an entry in the JSON and an example file; the page, plugin and test pick them up. The API page cap has 26 B of headroom, so their doc comments are the next size problem.
- Examples have no host listeners (nothing is heard on the page); a later Task could show `handle.part(...).onSelect` output beside an example if the owner wants it.

Coordinator: accepted `publicBuild.test.ts` page-id list gaining `components.html` (expected value, no setup change). No existing load limit changed: `components.html` gets its own new page set (measured + 5%), and `api.js`, `api.css`, `frameStats.js` join `APP_SHARED`/`SPLIT_CHUNKS` as listings because the second engine-importing page moves the engine into a shared chunk — reported to the owner with the T-336 sizes. Nav label "Parts" and page look go to the owner look in T-336; journey-catalogue runs first in the Full Check. Coordinator marked done (owner: "Orchestrate 080"); lint, typecheck, build clean; npm test 4526 passed, 2 failed (known pack size), 2 skipped; API page 45,974 B gzip unchanged.
