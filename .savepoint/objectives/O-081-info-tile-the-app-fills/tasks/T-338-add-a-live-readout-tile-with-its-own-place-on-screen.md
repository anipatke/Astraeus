---
id: T-338
title: Add a live readout tile with its own place on screen
objective: O-081
status: done
depends_on: [{task: T-337, requires: clear}]
check_waiver: {task: T-338, reason: 'Owner said "Orchestrate this obj" (O-081): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o081-20261121}, recorded_at: '2026-11-21T07:23:30Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o081-20261121}
---

# Add a live readout tile with its own place on screen

## Outcome

A `readoutTile` part an app adds with `scene.addParts` beside its panels: a label and big value, an optional line (`scale {low, high, value, stretch?: "linear" | "log", marks? [{value, label}]}` (owner naming decision, Objective Decisions)) with a dot at the value, and up to a few small `facts [{label, value}]`. `handle.part(tile)` gives silent setters (`setValue` and, within the section 7 grammar, setters for the scale position and facts); it hears nothing. On a wide viewer it sits at the top of the left column under the bar, always shown, with any left panel below it; on a phone it is a one-line strip above the timeline that opens the full tile in the bottom sheet on a tap. At most one tile shows per view.

## User Check

A synthetic scene with two views, each with its own tile: on a wide viewer the tile sits top left and About opens below it; `setValue` moves the number and the dot; a view switch shows the other view's tile; at phone size the strip shows label and value above the timeline, a tap opens the sheet, Escape closes it, opening About's sheet replaces it. A scene with two tiles in one view throws `bad-part` naming both.

## Done When

The "Readout tile", "Tile place", "One tile per view" and (for the tile) "One contract" O-081 Success Conditions hold: `addParts` accepts the tile (part union widened, ids unique across parts, blocks and story panels); `bad-part` shape cases per field (empty label, non-finite or reversed scale, `value` outside, log scale with `low <= 0`, bad mark, too many facts); the panel rule's phone "tile expanded" detail occupant with named close-rule unit tests in `tests/panelRule.test.ts`; the area in `shell/areas/` with `data-area="tile"` (no `@media` outside `areas.css`); both embedding paths in the lifecycle suite; two viewers with different layouts; synthetic scene (ARCH-03); drift check clean; split check knows the tile's marker; computed-look baseline regenerated with `node tools/look-lock.mjs` and its diff reviewed if the grid changes; site browser driver updated only if a hook it reads moves. Doc comment with `@shelf` (gate-keeping catalogue minimum as in T-337 if needed). README, CHANGELOG, `npm run api:errors`, `npm run api:lock`. Apply `docs/agents/verification.md`.

## Context Files

- `.savepoint/objectives/O-081-info-tile-the-app-fills/Objective.md`
- `docs/architecture/viewer-interface.md` under `2. Screen areas`
- `docs/architecture/viewer-interface.md` under `5. Panels`
- `docs/architecture/viewer-interface.md` under `7. Public interface (O-079, O-080, O-081)`
- `docs/architecture/viewer-interface.md` under `11. Story-component shelf`
- `.savepoint/Design.md` under `Views of one scene`
- T-337's `Technical Evidence` and `Drift Notes` (the files it created)
- `packages/astraeus/src/app/shelfContract.ts`
- `packages/astraeus/src/shelf/part.ts`
- `packages/astraeus/src/api/planParts.ts`
- `packages/astraeus/src/api/scene.ts` (the `addParts` method)
- `packages/astraeus/src/api/viewerParts.ts`
- `packages/astraeus/src/app/useShelf.ts`
- `packages/astraeus/src/shell/areas/screen.ts`
- `packages/astraeus/src/shell/areas/Area.tsx`
- `packages/astraeus/src/shell/areas/areas.css`
- `packages/astraeus/src/shell/panels/panelRule.ts`
- `packages/astraeus/src/shell/AstraeusShell.tsx` (the shelf panel and `left` area sections)
- `packages/astraeus/tests/panelRule.test.ts`
- `tools/check-shelf-split.mjs`

## Design References

Design "Viewer interface", "Views of one scene", "Public API shape (G-016, owner 2026-11-01)".

## Guardrails

ARCH-01, ARCH-02, ARCH-03, API-01, API-02, API-03, API-04, API-05, API-07, TEST-01, TEST-03, TEST-08, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm the chart landed and the part union point in `shelfContract.ts` is where the note says; return REPLAN REQUIRED if `addParts` cannot widen without breaking the O-080 contract.
2. Widen the part union and `PartPlan`: tile accepted, ids unique, one-tile-per-view check at build (a tile not listed in any view's `panels` shows in every view, so it conflicts with any other tile showing there).
3. `src/shelf/readoutTile/`: factory, frozen descriptor, view (value, line with stretched scale and marks, facts), silent control.
4. Tile area: wide at the top of `left` with the `left` occupant below; phone strip above the timeline; the panel rule gains the phone tile-expanded detail occupant (opens on tap, closes another detail sheet, Escape, view switch). The shell renders `descriptor.view`; no placement code in the part.
5. Tests (factory, plan, panel rule, lifecycle both paths, two viewers, screen), split check marker, look baseline if needed, docs, api errors and lock.

## Boundaries

No catalogue page design changes, no several-tiles stacking, no tile taps on a wide viewer, no change to how other `left` occupants close one another, no site demo changes.

## Technical Verification

Focused tests during iteration; configured gates plus `npm run check:shelf-split` at handoff; no browser run here (the catalogue Task covers the browser journey; the Full Check runs `check:browser` once). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Extra reads (beyond Context Files): `T-337` Technical Evidence and its chart files (pattern); `tests/lifecycle.test.ts`, `tests/twoViewers.test.ts`, `tests/shelfBar.test.ts`, `tests/domSetup.ts` (to place new cases and use `mountShell`); `shelf/panel/factory.ts`, `shell/useShelfPanels.tsx`, `shell/useSwipeToDismiss` use (the phone sheet), `shell/parts/parts.css` and `phone.css` (sheet look), `api/assembleScene.ts` (view resolution for the one-tile check), `packages/astraeus-site/data/shelf-catalogue.json` and `tests/shelfCatalogue.test.ts` (minimal entry), `tests/lookDrift.test.ts` header (what CSS may hold).

Per Done When item:
- `addParts` accepts the tile; ids unique across parts, blocks, story panels: `tests/readoutTile.test.ts` "addParts takes a tile" (order kept, descriptor shared, `duplicate-id` against a tile id, tile inside a panel refused `bad-part`, a non-factory tile refused); `checkAgainst` already covers story-panel ids for every part id.
- `bad-part` per field: "readoutTile checks its input at the call" (26 refuse rows: id, label, value, scale shape, low/high non-finite and reversed, scale.value outside or NaN, bad stretch, log with low <= 0, marks (not a list, bad item, outside, NaN, empty label), facts (not a list, bad item, empty label/value, more than 4), not a plain object); frozen, copied, scale-less descriptor test. Setter checks in lifecycle (empty value, position outside, NaN, too many facts, setScaleValue without a scale).
- One tile per view: "one tile per view" (two with no views refused naming both; one in each view fine; both listed in one view refused; an unlisted tile meets the other in every view).
- Panel rule: `tests/panelRule.test.ts` describe "the tile expanded (O-081), named close rules" (wide open is a no-op; phone opens as detail sheet closing developer and covering story; another left occupant replaces it on both layouts; Escape closes it, a pop-up first; close; view switch with `dropsTile`).
- Area in `shell/areas/` with `data-area="tile"`: `areas.css` (wide: own grid row only while a tile shows, `:has`; phone: strip row above the timeline; no `@media`); `tests/lookDrift.test.ts` passes. Shell tests "the shell draws the tile in its own place" (wide card in `[data-area="tile"]` with About beside it; no tile no area; view switch swaps the tile; phone strip label and value, tap opens the sheet, Escape closes, About replaces it, a view switch closes it, Close button).
- Both embedding paths: `tests/lifecycle.test.ts` "readoutTile (O-081 T-338)" inside `describe.each([mountDriver, reactDriver(false)])`, passes on both (draws in the tile area, setValue moves number and dot, setScaleValue, setFacts, silent, checked, view switch shows the other view's tile, `not-mounted`).
- Two viewers: `tests/twoViewers.test.ts` "API-03 (O-081 T-338)". Two different layouts in one page are not built (a happy-dom page shares one window and media); the wide and phone layouts are each proven in the shell tests above.
- Synthetic scene (ARCH-03): made-up scenes only. Drift check: `tests/lookDrift.test.ts` passes (tokens, `cqw` none, no px). Split check: marker `shelf-tile` added (and the shell's own classes are `tile-card`, `tile-strip-button`, `tile-sheet`, so the shell never carries it); default (filterChips) ok, `--import readoutTile` ok (emitted 2196139 B raw, 750896 B gzip, css 73354 B; default 2194823 B raw, 750603 B gzip). The chart call in the split check's builder still used `from/to`; corrected to `low/high`.
- Computed-look baseline: `node tools/look-lock.mjs` run; no file changed (grid change applies only while a tile shows, so the lock's no-tile grid is the same).
- Site browser driver: no DOM hook it reads moved (the new classes and the area are additions; the existing left/right/timeline areas keep their hooks); `packages/astraeus-site/tools/validate/driver.mjs` untouched. No browser run.
- Doc comment with `@shelf` on `readoutTile`; catalogue gate: minimal entry (`data/shelf-catalogue.json`, last) and example (`src/catalogue/examples/readoutTile.ts`), needed to keep `shelfCatalogue.test.ts` green. README (addParts row, `handle.part` row, error table via api:errors), CHANGELOG 0.9.5 Added line, `npm run api:errors`, `npm run api:lock` run.
- API-04 type lint: zero new breaks; `apiTypeLint.allowlist.json` not touched (`low`, `high`, `value` already unitless).

Commands: `npm run lint` ok; `npm run typecheck` ok; `npm run build` ok; `npm test` (configured form): 289 files, 4626 passed, 2 skipped, 0 failed; `npm run check:shelf-split` ok; `-- --import readoutTile` ok; `api:errors`, `api:lock` wrote; `node tools/look-lock.mjs` no diff. Not run: check:pack, size gates, check:browser.

Files changed: packages/astraeus/src/shelf/readoutTile/{factory.ts,View.tsx,part.css} (new); src/shell/useShelfTile.tsx (new); src/app/shelfContract.ts (`ShelfTile`, `ShelfPart` union, `idsOfPart`); src/app/useShelf.ts (kinds, blocks and elements read a tile); src/app/style.css; src/shelf/part.ts (`TilePart`, `AnyPart`, `ControlFor`, generic `partOf`); src/shelf/panel/factory.ts (refuses a tile block); src/api/{index.ts,scene.ts,planParts.ts,assembleScene.ts,errors.ts,viewerParts.ts}; src/shell/{AstraeusShell.tsx,useShelfPanels.tsx}; src/shell/areas/areas.css; src/shell/panels/{panelRule.ts,usePanels.ts}; src/shell/parts/parts.css; tools/check-shelf-split.mjs; README.md; CHANGELOG.md; api-surface.lock.json; tests/{readoutTile.test.ts (new),panelRule.test.ts,lifecycle.test.ts,twoViewers.test.ts}; packages/astraeus-site/data/shelf-catalogue.json; packages/astraeus-site/src/catalogue/examples/readoutTile.ts (new); packages/astraeus-site/tests/shelfCatalogue.test.ts (expected export list gained "readoutTile").

Existing tests touched: additions only (new `it`/`describe`, an import line in lifecycle and twoViewers); `shelfCatalogue.test.ts` expected list gained "readoutTile" (authorised). No setup, input or fixture changed. `partOf` was made generic so `shelfParts.test.ts` (which reads `.button` and `.blocks` off it) keeps typechecking unchanged.

Limitations: no browser run (looks unjudged: tile card, strip, sheet, mark label collisions on a crowded line, the phone grid row); two layouts in one page not tested; a tile expanded on a phone that grows to wide closes by an effect (tested only through the rule and the phone sheet); `check:pack` and size gates not run (css 69802 B to 73354 B in the split check page since T-337, includes this part's CSS).

## Drift Notes

For T-340 (Design reconciliation):
- Tile fields are `label`, `value` (string, the app's own words), `scale {low, high, value, stretch?, marks?}`, `facts` (at most 4); the viewer-interface table (section 11) still says `scale? {min, max, at}` and the section 7 control list says only `setValue`: the control is `setValue(value, scaleValue?)`, `setScaleValue(value)`, `setFacts(facts)`.
- Internal shape: `ShelfTile extends ShelfBlock` (`kind: "readoutTile"`, `label`, `strip`); `ShelfPart = ShelfPanel | ShelfTile`; a tile's content is a per-viewer cell and its control is built as a block's. Public `TilePart`; `addParts` takes `PanelPart | TilePart`; a tile in a panel's blocks is `bad-part`.
- One tile per view is checked in `PartPlan.checkTiles` against the resolved views (an unlisted tile meets every view), called where `assembleScene` builds the `views` entry (kept there: the order of the scene's errors is pinned by scenePin).
- Place: the area is rendered only while the showing view has a tile. Wide: `areas.css` gives the grid its own `tile` row above `left` under `:has`; phone: a `tile` row above the timeline. The shell wraps the strip in a button; the part draws `view` (full) and `strip`. Shell class names carry no `shelf-tile` (the split marker).
- Panel rule: occupant `tile`, in `left`; opens only on a phone (a wide open is a no-op); `viewSwitch` gained `dropsTile`, raised when the showing tile's id changes. Section 5 table row "Tile expanded" is as built.
- The catalogue example for `readoutTile` is a `panel` plus the tile because `shelfCatalogue.test.ts` requires every example's `addParts` to start with `panel(`; T-339 may want that rule widened for a tile (owner's test) or keep the pairing.
- The Objective text and the section 11 table still say `from/to/at` / `min/max/at` in places: reconcile to `low/high/value`.

Coordinator: reviewed the diff; existing tests changed only by added cases and imports, plus "readoutTile" in the `shelfCatalogue.test.ts` export list (authorised). Gates green (4626 passed, 2 skipped, 0 failed); look baseline unchanged; API-04 no new breaks. Carried to T-339: the catalogue example rule that every `addParts` starts with `panel(` (a tile may stand alone). Carried to T-340: naming reconciliation and the drift notes above. Coordinator marked done (owner: "Orchestrate this obj").
