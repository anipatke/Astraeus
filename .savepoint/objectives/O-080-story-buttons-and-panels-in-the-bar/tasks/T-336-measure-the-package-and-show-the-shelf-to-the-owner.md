---
id: T-336
objective: O-080
title: Measure the package and show the shelf to the owner
status: in_progress
stage: test
depends_on: [{task: T-335, requires: clear}]
check_waiver: {task: T-336, reason: 'Owner said "Orchestrate 080": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o080-20261121}, recorded_at: '2026-11-21T05:15:22Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: plan-o080-20261121}
---

# Measure the package and show the shelf to the owner

## Outcome

The engine pack and API reference page are measured against their limits with the shelf in, and any red goes to the owner with measured options; Design.md is reconciled from this Objective's drift notes; the owner has looked at the catalogue page on the preview.

## User Check

The owner reads the size numbers (before O-080 and now, per limit, with options if over) and decides; the owner opens `localhost:5490/components.html` at phone and desktop sizes and runs each example.

## Done When

"Sizes" and "Owner look" O-080 Success Conditions hold: measurements recorded (engine unpacked bytes, API page raw and gzip, first-open example size) with each part's share where a limit is red; the owner's size decision quoted in the Objective's Decisions; `.savepoint/Design.md` "Viewer interface" (and the codebase map) describe the shelf as built, each drift note accounted for; configured gates plus `check:engine-alone`, `check:pack` and the split check green, or a red the owner has accepted by name. Owner validation recorded against the Full Objective Check's id. Apply `docs/agents/verification.md`.

## Context Files

- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/Objective.md`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/tasks/T-333-let-a-story-add-its-own-bar-buttons-and-custom-panels.md` under `Technical Evidence` and `Drift Notes`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/tasks/T-334-put-the-first-ready-made-story-components-on-the-shelf.md` under `Technical Evidence` and `Drift Notes`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/tasks/T-335-show-every-shelf-component-on-a-public-catalogue-page.md` under `Technical Evidence` and `Drift Notes`
- `.savepoint/objectives/O-079-one-bar-with-title-and-about/tasks/T-332-clear-out-leftover-interface-code-and-measure-the-package.md` under `Technical Evidence` (how the sizes were measured)
- `.savepoint/Design.md` under `Viewer interface`
- `.savepoint/Design.md` under `Components/Codebase Map`
- `.savepoint/Design.md` under `Size budgets are split`
- `tools/check-packs.mjs`
- `packages/astraeus-site/tools/validate/load-budget.mjs`
- `docs/agents/build.md`

## Design References

Design "Viewer interface", "Components/Codebase Map", "Size budgets are split".

## Guardrails

TEST-01, TEST-03.

## Implementation Plan

1. Run the size measurements as T-332 did; attribute growth per part if a limit is red.
2. If red: list options with their measured effect (for example trimming doc text, sharing part CSS, a limit change) and bring them to the owner; apply only what the owner picks.
3. Reconcile Design from each drift note (reflected, or non-architectural with a reason).
4. Restart the :5490 preview; ask the owner to look; record their words.

## Boundaries

No new parts, no limit change without the owner's choice, no version bump or publishing.

## Technical Verification

Configured gates plus `check:engine-alone`, `check:pack` and the split check at handoff. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor session `t336-builder-20261121`, plan steps 1 to 3 (2026-11-21). Step 4 (the owner's size decision and the owner's look on :5490) belongs to the coordinator. Nothing applied: no limit changed, nothing trimmed. Not committed. Node v24.16.0.

Baseline = commit `01c8426f` (O-079 close on main), built in a temporary worktree under the session scratchpad (own copy of `examples/hello-scene/node_modules`; `node_modules/astraeus`, the data and demo packages linked to the worktree's own packages so the old build used the old engine), removed after.

### Sizes (step 1)

| Measure | O-079 close (`01c8426f`) | Now | Change | Limit |
|---|---|---|---|---|
| Engine pack, unpacked | 9,482,232 B (617 files) | 9,565,101 B (661 files) | +82,869 B | 9,500,000 B: **65,101 B over** |
| Engine pack, packed | 7,327,588 B | 7,350,102 B | +22,514 B | 8,000,000 B (ok) |
| API reference page, gzip | 42,577 B (158 exports) | 45,974 B (188 exports) | +3,397 B | 46,000 B: 26 B left |
| API reference page, raw | 196,055 B | 214,688 B | +18,633 B | 230,000 B (ok) |
| `measure:example` (hello-scene) first open, gzip | 518,568 B | 521,250 B | +2,682 B | (engine budget 527,000; `engineBudget.test.ts` green) |
| `measure:example` first open, raw | 1,811,006 B | 1,821,366 B | +10,360 B | 1,833,000 |
| Site `app.html` (Apollo 11) first load, gzip | 2,904,872 B (10 files) | 2,912,955 B (11 files) | +8,083 B | own share 2,743,732 of 2,850,000 (ok) |
| Site `app.html` (Apollo 11) first load, raw | 4,662,880 B | 4,686,885 B | +24,005 B | own share 4,137,292 of 4,240,000 (ok) |

The baseline unpacked figure is the `01c8426f` build (9,482,232 B); T-332 recorded 9,473,196 B before the last O-079 edits (README/CHANGELOG), 9,036 B less.

Measured with: `npm run check:pack` then `npm pack --dry-run --json` in `packages/astraeus/dist` (both trees; per-file diff by script); `collectExports` + `renderApiPage` of `packages/astraeus-site/tools/site/api-reference.mjs`, gzip by `zlib` (as `apiReference.test.ts`); `npm run measure:example` (baseline: `node tools/measure-example.mjs` in the worktree); `ASTRAEUS_PUBLIC_BUILD=1 ASTRAEUS_ENGINE_SHARE=1 npx vite build packages/astraeus-site` then `node packages/astraeus-site/tools/validate/load-budget.mjs dist` (both trees; every page ok, `components.html` own 363,637 of 390,000 gzip).

**Engine pack growth, +82,869 B, by area:**

| Area | Bytes | Share |
|---|---|---|
| Shelf modules `src/shelf/**` JS (factories, views, `part.js`, `useCell.js`) | 22,787 | 27% |
| Shelf modules `.d.ts` | 15,033 | 18% |
| Shelf part CSS (`shelf/<part>/part.css`, four sheets) | 4,350 | 5% |
| Wiring JS outside `src/shelf` (new: `app/useShelf`, `app/shelfContract`, `api/viewerParts`, `api/planParts`, `shell/useShelfPanels`, `shell/StoryButton`; changed: `scene`, `App`, `panelRule`, `barEntries`, `viewerLink`, `AstraeusShell`, ...) | 19,467 | 23% |
| Wiring `.d.ts` outside `src/shelf` | 15,478 | 19% |
| `.node.js` copies (`index.node.js` export lines only) | 350 | 0.4% |
| `app/style.css` (four `@import` lines and comment) | 398 | 0.5% |
| README | 3,458 | 4% |
| CHANGELOG | 1,548 | 2% |

By kind: JS 42,604 B (51%), `.d.ts` 30,511 B (37%), CSS 4,748 B (6%), docs 5,006 B (6%). No new duplicate copy: the `.node.js` copies are still the three of T-332 (10,411 B in all). Per part folder: `filterChips` 10,128, `colourKey` 5,606, `actions` 5,514, `panel` 5,123, `explainer` 4,973, `customBlock` 3,288; shared `part`/`useCell` 7,538. Estimate for O-081 (`chart`, `readoutTile`): about 20 KB more (two part folders at 5 to 10 KB, a tile area wiring, docs).

**API page growth, +3,397 B gzip:** the 30 new shelf exports cost 3,013 B (removing all of them: 42,961 B); by part, removing each group alone: `panel` (6 entries) 633, `filterChips` (5) 559, `actions` (5) 379, `customBlock` (4) 376, `colourKey` (4) 360, `explainer` (3) 318; the shared `BlockPart`/`AnyPart`/`ControlFor` the rest. About 384 B is in existing entries (`Scene.addParts`, `ViewerHandle.part`, `SceneErrorCode` `bad-part`). Largest entries: `Scene` 6,305, `SceneCamera` 1,702, `SceneErrorCode` 1,364. Estimate for O-081: 700 to 1,100 B gzip (318 to 559 B per part measured here).

**Example (`measure:example`).** +2,319 B gzip JS (+7,084 raw) is the always-loaded shelf wiring (story button, panel rule rows, `viewerParts`/`planParts`); no part's code is in the example (no part marker class in its JS; `data-story-button` is). +340 B gzip CSS (+3,276 raw) is the part CSS in the shared sheet. The example's chunk shape is unchanged (`index`, `frameStats`, `jsx-runtime`, `timeScale`, `Collapsible` first open; same `frameStats` size): it is a separate build, so the site's shared `api.js` chunk does not change what the example downloads.

**Site app page and the shared chunk (T-335 drift note).** Before: `app.js` 1,653,239 + `app.css` 65,675 + `scene.js` 117,104 (525,431 B gzip). Now: `app.js` 28,574 + `api.js` 1,018,180 + `api.css` 68,951 + `frameStats.js` 742,342 + `preload-helper.js` 2,193 (533,773 B gzip): +8,342 B gzip on the app page's core, one more file. Of that, the shelf code itself is about the example's +2.7 KB gzip; the other about 5.7 KB gzip is the cost of the split (code across a chunk boundary is not hoisted together, plus the preload helper). A visitor who opens the catalogue and then the app reuses the cached `api.js`; a visitor of the app alone downloads about 8 KB gzip more than before (0.3% of the Apollo page). All app-page own-share limits still pass.

### Options (step 2; none applied)

Engine pack (65,101 B to find; O-081 adds about 20 KB):

| # | Option | Measured effect | Unpacked after | Cost and risk |
|---|---|---|---|---|
| P1 | **Strip comments from the compiled JS, keep them in the `.d.ts`** (build: emit JS with `removeComments`, declarations as now) | -305,221 B (1,403,827 -> 1,098,606 B of JS; measured by re-emitting every packed `.js` with TypeScript 6 `transpileModule`, `removeComments`) | about 9.26 MB, about 240 KB under the limit (O-081 fits) | General; no runtime or look change (bundlers strip comments anyway); editors read doc comments from the `.d.ts`, which keep them. A reader of the shipped JS loses comments (no source maps ship). Build change in `tools/build-packages.mjs` (a second emit pass or a post-pass) plus a pack-check rule (packed JS has no doc comments, `.d.ts` keep them). No load-bearing comments found in the packed JS (no `@vite-ignore`, `__PURE__`, `webpackIgnore`, licence banners). |
| P2 | Pack only the newest CHANGELOG sections, with a link to the full file | -112 KB (121,956 -> about 9.8 KB for 0.9.5 to 0.9.3) | about 9.45 MB, about 47 KB under (O-081 fits, then little room) | npm page loses the history; a build step and a pack rule. Same as T-332 option 2. |
| P3 | Minify CSS at build | about -20 KB (90,353 B of CSS; T-332 measured -21% by removing comments and white space) | about 9.55 MB, still over | Not enough alone; shipped CSS harder to read. |
| P4 | Raise the limit | none | 9.57 MB now, about 9.59 MB after O-081 | 9.6 MB leaves about 10 KB after O-081; 9.7 MB leaves about 110 KB. The limit drifts; no reduction. |
| P5 | Trim `.node.js` copies or other duplicates | at most 10,411 B (all three copies) | still over | Already done in T-332; the remaining copies are needed by Node. |
| P6 | Re-encode a planet picture (pictures are 66% of the pack) | -100 KB or more per picture | under | A look change; outside this Objective. |
| P7 | Strip doc comments from the `.d.ts` | not measured | | Rejected: editors and the API page read them. |

API reference page (26 B left; O-081 adds about 700 to 1,100 B gzip):

| # | Option | Measured effect | After | Cost and risk |
|---|---|---|---|---|
| A1 | **Shelf parts on their own API page** (the 30 shelf exports on `api/shelf.html`, linked from the main page and from `components.html`) | main page -3,013 B gzip (to 42,961 B) | main page about 3 KB under the cap after O-081 too; the new page about 3 KB gzip now, about 4 KB after O-081, with its own cap | A generator change in `api-reference.mjs`, a new page set in `load-budget.mjs`, cross-page links; scales with every later part. |
| A2 | Raise the cap to 47,500 | none | about 400 to 800 B left after O-081 | Drifts again at the next part. |
| A3 | Trim doc comments again | tens of bytes | | T-334 already trimmed; fragile. |

**Recommendation.** P1 for the pack: a general reduction of about 305 KB that clears the limit with room for O-081 and later parts, with no runtime or look change, and it keeps the limit honest (strategic fix first). A1 for the API page: it moves the growing part list off the main page so each later part costs only the shelf page; A2 is the short-term alternative if the owner prefers no generator change now. Both are separate small Tasks (build and generator changes plus a check each), for the owner to choose.

### Design reconciliation (step 3)

Changed: `.savepoint/Design.md` "Viewer interface" (new **Shelf** bullet: factories, `src/shelf/<part>/`, descriptor `view`/`control` through `app/shelfContract.ts`, `addParts`, generic `handle.part`, event shapes, `ShelfCell`, `customBlock` element, story bar item, `left` occupant `shelf:<id>`, `bad-view` for an unknown view panel id, part CSS in the shared sheet and why, `check:shelf-split`); "Components/Codebase Map" (`src/shelf/` and its wiring modules in the engine row; `components.html`, the `shelfCatalogue` plugin, `tools/site/shelf-catalogue.mjs`, `data/shelf-catalogue.json`, `src/catalogue/` and `tests/shelfCatalogue.test.ts` in the site row; `check-shelf-split.mjs` in the tools row); "The planets demo and the site on the public way" (fourth page, plugin, required page, own page set, shared engine chunk `api.js`/`api.css`/`frameStats.js`, examples not affected). `docs/architecture/viewer-interface.md`: section 7 (build-time `bad-part` example corrected, unknown view panel id stays `bad-view`; generic `handle.part` signature), section 9 (`shelf/` tree as built: `part.ts`, `useCell.ts`, `part.css` loaded by `app/style.css`), section 11 ("Pick by import" CSS paragraph and split-check paragraph rewritten to the build; new "As built (O-080)" list).

**Drift Note accounting:**

| Note | Disposition | Where |
|---|---|---|
| T-333 1: descriptor shape in `app/shelfContract.ts`; `shelf/part.ts` | Reflected | Design "Viewer interface" Shelf bullet; note §9 tree, §11 As built |
| T-333 2: shelf panel is `left` occupant `shelf:<id>`; `viewSwitch` `dropsShelf` | Reflected | Design Shelf bullet; note §11 As built (§5 row was already as built) |
| T-333 3: unknown id in `ViewInput.panels` stays `bad-view`; part id = story panel id is `duplicate-id` | Reflected | Design Shelf bullet; note §7 bullet corrected |
| T-333 4: `onOpen` hears visitors (button, Close, Escape, another `left` occupant), not a view switch or host `setOpen` | Reflected | note §11 As built events; Design Shelf bullet (setters silent, `on*` visitors only) |
| T-333 5: `handle.part` overloads | Superseded by T-334 3 (generic) | Reflected as generic |
| T-333 6: `onOpen` `{ part, open }` | Reflected | Design Shelf bullet; note §11 As built |
| T-333 7: `customBlock` element per viewer by `useShelf`, undefined outside `ready`..`unmount` | Reflected | Design Shelf bullet; note §11 As built |
| T-333 8: panel reuses `info-panel` and About header classes; no panel `part.css` | Non-architectural (class reuse inside a view; the CSS question is closed by T-334 1) | note §9 says `part.css` only when a part has rules |
| T-333 9: host `setOpen(true)` for a panel the view does not show stays closed, no error | Reflected | note §11 As built |
| T-333 10: sizes | Measured here | Sizes above |
| T-334 1: part CSS in the shared sheet | Reflected | Design Shelf bullet; note §9 and §11 "Pick by import" |
| T-334 2: block contract `data`/`initial`/`control`, `ShelfCell`, `ShelfRuntime` `cell`/`report`/`moveCamera`, `makeCell` | Reflected | Design Shelf bullet; note §11 As built |
| T-334 3: generic `handle.part`, `BlockPart<K>`, `addParts(PanelPart[])` | Reflected | Design Shelf bullet; note §7 and §11 As built |
| T-334 4: action camera ids checked at build, `bad-part` | Reflected | Design Shelf bullet; note §7 |
| T-334 5: `onSelect`/`onAction` shapes, camera turns first | Reflected | Design Shelf bullet; note §11 As built |
| T-334 6: sizes | Measured here | Sizes above |
| T-335 1: fourth page, `shelfCatalogue` plugin | Reflected | Design codebase map site row; "The planets demo and the site on the public way" |
| T-335 2: shared engine chunk `api.js` | Reflected and measured | Design "The planets demo and the site on the public way"; Sizes above (site app page) |
| T-335 3: `@shelf` read through `collectExports().shelf` | Non-architectural (an implementation detail of a site generator; the note §11 already says the entry comes from the doc comment) | none |
| T-335 4: O-081 parts need only a JSON entry and an example | Non-architectural (already the note §11 catalogue paragraph: "O-081 adds its two"); its size remark is covered by option A1 | none |
| T-335 5: examples have no host listeners | Non-architectural (a possible later improvement, not a design delta) | none |

### Done When (steps 1 to 3; step 4 pending with the coordinator)

| Criterion | Outcome |
|---|---|
| Measurements recorded (engine unpacked, API page raw and gzip, first-open example) with each part's share where a limit is red | Met (tables above) |
| Owner's size decision quoted in the Objective's Decisions | Pending (coordinator, step 4) |
| Design "Viewer interface" and the codebase map describe the shelf as built, each drift note accounted for | Met (above) |
| Configured gates plus `check:engine-alone`, `check:pack`, split check green or a red the owner accepted by name | See commands; the pack red waits for the owner's choice |
| Owner validation against the Full Objective Check | Pending (step 4 and the Full Check) |

### Commands run (after the last edit, 2026-11-21)

- `npm run lint`: exit 0. `npm run typecheck`: exit 0. `npm run build`: exit 0.
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 4526 passed, 2 failed, 2 skipped (288 files). The 2 failures are the known pack-size reds in `packages/astraeus-site/tests/packagePacks.test.ts` (engine unpacked over 9.5 MB).
- `npm run check:pack`: FAIL, 1 problem, `astraeus: unpacked 9.57 MB is over 9.5 MB` (known red; every other package within limits).
- `npm run check:engine-alone`: first run FAIL at test (26.0 s), one case: `lifecycle.test.ts` "lifecycle: AstraeusScene > shelf parts (O-080 T-333) ..." line 532 expected the shown panel `empty`, got `gaps`, right after `empty.setOpen(true); await tick(60)`, while the machine was at about 10 cores of load. Rerun at once: pass in 28.3 s. The same case passed in the full `npm test`. This Task changed no code; it looks like a timing-sensitive wait in a T-333 test (reported to the coordinator, not repaired here).
- `npm run check:shelf-split`: ok (imported `filterChips`; 2,188,049 B raw, 749,462 B gzip; CSS 68,951 B; no other part's marker in the JS).
- Measurement commands: listed under Sizes. No browser run.

### Files read

Context Files (Task, Objective, T-333/T-334/T-335 Technical Evidence and Drift Notes, T-332 Technical Evidence, Design "Viewer interface", "Components/Codebase Map", "Size budgets are split", `docs/agents/build.md`), `agent-skills/savepoint-task/SKILL.md`, `docs/agents/verification.md`, `.savepoint/router.md`. Extra reads (path, reason): `docs/architecture/viewer-interface.md` sections 7, 9, 11 (reconciled here; coordinator named them); Design "The planets demo and the site on the public way" (reconciled here); `tools/check-packs.mjs` head and `tools/measure-example.mjs`, `tools/build-example.mjs`, `tools/build-packages.mjs` lines 30 to 75 and 184 (how sizes are measured, and whether the baseline worktree build would write into the main checkout); `packages/astraeus-site/tools/validate/load-budget.mjs` head (page sets); `tools/lint/use-typescript6.cjs` (to find the TypeScript 6 API for the comment-strip measure); `packages/astraeus/src/shell/panels/panelRule.ts` lines 8 to 35, `src/app/shelfContract.ts` export lines, `src/api/viewerHandle.ts` line 120, `src/app/style.css` head, `packages/astraeus-site/vite.config.ts` plugin lines (facts written into Design); compiled `dist/src/shelf/filterChips/factory.{js,d.ts}` heads (whether JS keeps doc comments).

### Files changed

`.savepoint/Design.md` ("Viewer interface", "Components/Codebase Map", "The planets demo and the site on the public way"), `docs/architecture/viewer-interface.md` (sections 7, 9, 11), this Task file. Generated by the gates, not edited: `junit.xml`, root `dist/`, `examples/hello-scene/dist` and `.packs`.

### Limitations

- The P1 saving is measured by re-emitting the packed JS through TypeScript 6 `transpileModule` (which may also reprint some formatting), not by a changed build; the real build change could differ by a few KB. A1's new-page size is estimated from the removal measure, not rendered.
- O-081 size figures are estimates from this Objective's per-part costs.
- The baseline site build used the current `node_modules` for third-party packages (same lockfile; O-080 changed no dependency).
- Step 4 (owner's decision and look) not done here; no browser run.

### Second pass: the owner's choices applied (P1, A1) and the flaky shelf test fixed

The owner chose P1 and A1 (Objective Decisions, last bullet; relayed by the coordinator). This section is the current state where it differs from the sections above.

**Before and after**

| Measure | Before (first pass) | After | Limit |
|---|---|---|---|
| Engine pack, unpacked | 9,565,101 B | 9,258,304 B (9.26 MB), 241,696 B under | 9.5 MB (unchanged) |
| Engine pack, packed | 7,350,102 B | 7,233,380 B | 8.0 MB |
| Engine files | 661 | 661 | none |
| API main page `api/index.html`, gzip (raw) | 45,974 B (214,688) | 43,388 B (199,547), 2,612 B under | 46,000 (230,000), unchanged |
| API shelf page `api/shelf.html`, gzip (raw) | (none) | 5,022 B (22,260) | new: 8,000 (35,000) |
| `measure:example` first open, gzip (raw) | 521,250 B (1,821,366) | 521,275 B (1,821,479) | the bundler already drops comments, so no real change |
| `components.html` own share, gzip | 363,637 B | 363,636 B | 390,000 |

1. **P1, comment-free packed JS.** `tools/build-packages.mjs` runs tsc twice per package: first the JS with `removeComments: true` (`declaration: false`), then the `.d.ts` only (`emitDeclarationOnly`, comments kept). tsc keeps `/*!` comments. The generated `src/chunks.js` of the position packages lost its one `// Generated by ...` header line, so every package passes the same rule. Checked: `dist/src/api/scene.d.ts` has 82 `/**` blocks and `scene.js` none. **The check:** `tools/check-packs.mjs` `packedComments(text)` reads each packed `src/**/*.js` with the TypeScript 6 parser and returns every comment except `/*!`, `@license` and `@preserve` (it walks every node's leading and trailing comment ranges, so `//` inside a string, template or regular expression is not counted). `commentProblems` adds `<pkg>: packed JS keeps a comment in src/x.js: line N: ...` for every package, plus a problem if the engine's `src/api/scene.d.ts` has lost its doc comments. New test `packagePacks.test.ts` "fails on a comment left in packed JS, but not on a kept banner or a // inside a string, template or regular expression (O-080 T-336)": planted texts, plus a `src/commented.js` planted in the built pluto `dist` that `checkPacks` must name. `check:pack` now takes 20 s (was about 15; the limit is 30).
2. **A1, the shelf parts' API page `api/shelf.html`** (address `/api/shelf.html`; public `https://astraeus.anipatke.com/api/shelf.html`).
   - **Generator** (`api-reference.mjs`): `collectExports` gives each export a new `module` field (its declaring file relative to the engine's `src`). `shelfExports(items)` returns every `@shelf` export and every export declared under `src/shelf/`: 30 names (the six factories, their inputs, controls and events, and `PanelPart`, `BlockPart`, `CustomBlockPart`, `PanelBlock`, `AnyPart`, `ControlFor`).
   - **Main page:** `renderApiPage` leaves those 30 out and adds a "Shelf parts" section (also in the page nav) listing each name as a link to `shelf.html#<name>`, plus links to the shelf page and the catalogue. Every export name is still on the main page, so the existing test's "every name" rule holds unchanged.
   - **Shelf page:** `renderShelfApiPage` has two sections, Parts and "Inputs, controls and events", with links back to `./` and to `../components.html`. Both pages share one frame (`referencePage`). `buildApiPages()` builds both from one read.
   - **Wiring:**
     - `vite.config.ts` emits `api/shelf.html` and the dev server serves `/api/shelf.html`.
     - `load-budget.mjs` page `api/shelf.html` is limited to 35,000 raw and 8,000 gzip. That is measured 22,260 / 5,022 plus room for O-081's two parts (about 1 KB gzip, about 7 KB raw, estimated from this Objective's per-part costs): about 3 KB gzip left after O-081.
     - `REQUIRED_PAGES` (public build) gains it.
     - `publicBuild.test.ts` page-id list gains `"api/shelf.html"` (expected value, an addition).
     - `components.html` footer links "Parts API" beside "API reference".
     - `api-reference.d.mts` declares `module`, `shelfExports`, `renderShelfApiPage` and `buildApiPages`.
   - **New test:** `apiReference.test.ts` "puts the shelf parts' exports on api/shelf.html within its load-budget limits, each named and linked from the main page (O-080 T-336)".
   - **Not added to `browser-smoke.mjs`:** its page list (`index`, `assets`, `components`) does not hold `api/index.html` either. The API pages are static and have no script; adding both would add a browser step nobody can run in this session. Left for the coordinator or owner.
3. **The flaky shelf test, and the defect behind it.**
   - **Test:** in `lifecycle.test.ts`, the T-333 cases' fixed `await tick(60)` after `setOpen` and `setView` now wait for the state they expect with a new local helper `until(check)`, next to `tick`. It polls on real timeouts, 2 s at most. `vi.waitFor` was tried first and failed: under this suite's held interval clock it advances fake timers, which made clock signals that the case asserts against. The one negative wait ("a panel the showing view does not show stays closed") keeps its fixed settle, since there is no state to wait for. T-334's cases had no fixed waits; `twoViewers.test.ts` had none.
   - **Defect:** with the state waits, the case failed 6 runs out of 6 when run 6 at a time in parallel; the old version passed that same load. The cause is `app/useShelf.ts`. A host `setOpen` set a single "next report is silent" flag. When a second host call came after the first call's panel was drawn but before its report effect ran, the first report used up the flag. The host then heard its own second call as a visitor's (`onOpen {part: "empty", open: false}`), and the host's `open` read was briefly overwritten.
   - **Fix:** `hostWants` holds the panel the host last asked for. Every report up to the one that shows it is silent and leaves the host's read alone. It is cleared when the shell shows it, or when it reports closed and the showing view no longer shows the wanted panel. When the shell already shows what the host wants, nothing is waited for.
   - **After the fix:** 8 out of 8 parallel runs pass; lifecycle 67 out of 67 three times in a row; shelf and two-viewer suites 185 passed.
4. CHANGELOG 0.9.5: one Changed line (published JS carries no comments, about 300 KB smaller; the pack check fails if one comes back). Design.md "Size budgets are split" (pack limits, comment-free JS and its check, the two API pages and their limits) and "The planets demo and the site on the public way" (the generator writes both pages, `shelfExports` by module, `components.html` links both). `docs/agents/build.md` package gates: `check:pack` fails on a packed comment. Note §11 catalogue paragraph: the shelf API page.

**Gates (final run, after the last edit)**
- `npm run lint`: exit 0. `npm run typecheck`: exit 0. `npm run build`: exit 0 (`dist/api/index.html` and `dist/api/shelf.html` emitted).
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: **4530 passed, 0 failed, 2 skipped (288 files)**, both former pack reds included.
  - The run before it had one failure in an untouched older test, `viewsDom.test.ts` "keeps time, speed and playing state across a switch". The clock moved 7 s across a view switch while the machine was loaded.
  - That test has no change on this branch (`git diff 01c8426f` empty), and it passed 3 out of 3 alone and in the next full run. Recorded as an existing timing sensitivity, not repaired here.
- `npm run check:pack`: pass, 20.0 s; engine 7.23 MB packed, 9.26 MB unpacked, 661 files.
- `npm run check:engine-alone`: pass, 30.0 s.
- `npm run check:node-consumer`: pass.
- `npm run measure:example`: 521,275 B gzip first open.
- `npm run check:shelf-split`: ok.
- Public build (`ASTRAEUS_PUBLIC_BUILD=1 ASTRAEUS_ENGINE_SHARE=1`) then `load-budget.mjs dist`: every page ok, including `api/shelf.html` 22,260 / 5,022. `public-build-assets.mjs dist`: exit 0.
- No browser run.

**Extra reads (second pass):**
- `tools/check-packs.mjs` (whole) and `tools/check-packs.d.mts`.
- `tools/build-packages.mjs` (whole).
- `packages/astraeus-site/tools/site/api-reference.mjs` (whole) and `.d.mts`.
- `vite.config.ts` lines 30 to 56; `tests/apiReference.test.ts`; `tests/packagePacks.test.ts` lines 100 to 120; `tests/publicBuild.test.ts` lines 140 to 150.
- `public-build-assets.mjs` line 17; `browser-smoke.mjs` lines 4 and 35; `vercel.json`; `components.html` footer.
- `packages/astraeus/tests/lifecycle.test.ts`: the tick helper, the T-333 cases, and the `settle` helper.
- `src/app/useShelf.ts` lines 25 to 110; `src/shell/useShelfPanels.tsx` (request and report effects); `src/api/viewerParts.ts` lines 40 to 55.
- `CHANGELOG.md` top section.
- Reasons: to apply the owner's two choices and find the cause of the flaky case.

**Files changed (second pass):**
- Build and pack check: `tools/build-packages.mjs`, `tools/check-packs.mjs`, `tools/check-packs.d.mts`.
- API pages and site: `packages/astraeus-site/tools/site/api-reference.mjs` and `.d.mts`, `vite.config.ts`, `components.html`, `tools/validate/load-budget.mjs`, `tools/validate/public-build-assets.mjs`.
- Tests: `tests/apiReference.test.ts` (new case), `tests/packagePacks.test.ts` (new case and import), `tests/publicBuild.test.ts` (page id added), `packages/astraeus/tests/lifecycle.test.ts` (helper `until` and the T-333 waits).
- Engine: `packages/astraeus/src/app/useShelf.ts`, `packages/astraeus/CHANGELOG.md`.
- Docs: `.savepoint/Design.md`, `docs/agents/build.md`, `docs/architecture/viewer-interface.md`, this Task file.

**Limitations (second pass):**
- **No deterministic regression test for the `useShelf` race:** the reworked T-333 case catches it only under load (6 out of 6 parallel failures before the fix). A deterministic case would have to hold React's passive effects between two host calls.
- **One host case is still not silenced** (rare): two host calls where the first is drawn but not yet reported and the second undoes it.
- **Comments tsc strips:** a future comment the build relies on, such as `/* @vite-ignore */`, would be removed by tsc before the pack check sees it. None exists today. Only `/*!` survives, which the check allows.
- **Not seen in a browser:** the API pages and the new links (owner look in step 4).

## Drift Notes

None expected; this Task reconciles the others.
