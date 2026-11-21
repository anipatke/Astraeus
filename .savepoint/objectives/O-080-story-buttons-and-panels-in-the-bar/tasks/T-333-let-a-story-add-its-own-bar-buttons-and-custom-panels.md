---
id: T-333
objective: O-080
title: Let a story add its own bar buttons and custom panels
status: done
depends_on: []
check_waiver: {task: T-333, reason: 'Owner said "Orchestrate 080": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o080-20261121}, recorded_at: '2026-11-21T05:15:22Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o080-20261121}
---

# Let a story add its own bar buttons and custom panels

## Outcome

The shelf groundwork: `scene.addParts`, `handle.part(descriptor)` with typed controls, the `bad-part` code, and the first two parts, `panel` and `customBlock`. A panel's button sits in the bar as a `story` item and its panel opens through the panel rule; a custom panel (a `panel` whose only block is a `customBlock`) hands the host an element to fill.

## User Check

A synthetic scene with two panels shows two story buttons after the switch on a 1280 px viewer; pressing one opens its panel at the left (closing About or a card), pressing the other replaces it, Escape closes it. At 360 px the row keeps the first button and the second is in the menu under "This story". A panel listed only in view B is hidden in view A and closes on switching to A. A host fills the custom block's element and its content survives closing and reopening the panel.

## Done When

The O-080 Success Conditions "One shelf contract", "Bar and panels" and the `panel`/`customBlock` part of "First set" hold, with named tests on both embedding paths (one lifecycle suite), a synthetic scene (ARCH-03), a two-viewer test (API-03), the `bad-part` and `duplicate-id` cases, and fit-rule cases for story buttons. The shell renders `descriptor.view` and never imports a shelf module. Site browser driver and any affected journey updated in this Task if the bar's DOM changes. README, CHANGELOG (0.9.5 section), doc comments (factories carry `@shelf`), `npm run api:errors`, `npm run api:lock`. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md` under `4. Bar`
- `docs/architecture/viewer-interface.md` under `5. Panels`
- `docs/architecture/viewer-interface.md` under `7. Public interface (O-079, O-080, O-081)`
- `docs/architecture/viewer-interface.md` under `9. Module structure and contributor guide`
- `docs/architecture/viewer-interface.md` under `11. Story-component shelf`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/Objective.md`
- `.savepoint/Design.md` under `Viewer interface`
- `.savepoint/Design.md` under `Views of one scene`
- `.savepoint/Design.md` under `Public API shape (G-016, owner 2026-11-01)`
- `packages/astraeus/src/api/scene.ts`
- `packages/astraeus/src/api/aboutInput.ts`
- `packages/astraeus/src/api/viewerHandle.ts`
- `packages/astraeus/src/api/viewerAbout.ts`
- `packages/astraeus/src/api/views.ts`
- `packages/astraeus/src/api/errors.ts`
- `packages/astraeus/src/api/index.ts`
- `packages/astraeus/src/shell/bar/barItems.ts`
- `packages/astraeus/src/shell/bar/barEntries.tsx`
- `packages/astraeus/src/shell/bar/BarMenu.tsx`
- `packages/astraeus/src/shell/panels/panelRule.ts`
- `packages/astraeus/src/shell/panels/usePanels.ts`
- `packages/astraeus/src/shell/AboutPanel.tsx`
- `packages/astraeus/src/shell/AstraeusShell.tsx`
- `packages/astraeus/tests/lookDrift.test.ts`
- `packages/astraeus-site/tools/validate/driver.mjs`
- `packages/astraeus/README.md` under `Looks, controls and views`
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

Design "Viewer interface", "Views of one scene", "Public API shape (G-016, owner 2026-11-01)", "Good guest", "One handle, one lifecycle", "Host calls land in order".

## Guardrails

ARCH-01, ARCH-02, ARCH-03, API-01, API-02, API-03, API-04, API-05, API-07, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm the bar's `storyItem` and the panel rule's `left` place exist as the note describes; return REPLAN REQUIRED if not.
2. Add the descriptor shape (public fields plus the internal `view`), `bad-part` with its doc comment, and `scene.addParts` (append, `duplicate-id` across part and block ids, build-time checks such as a view naming an unknown part).
3. Add `handle.part(x)` on the shared `ViewerHandle` (so `mount` and `AstraeusScene` match), `bad-part` for a part not in this viewer's scene, `not-mounted` outside the lifecycle, calls landing in host order.
4. `src/shelf/panel/` and `src/shelf/customBlock/`: factories checked at the call, `PanelControl` (`open`, `setOpen`, `onOpen`) and `CustomBlockControl` (`element`, alive from `ready` to `unmount`, hidden while closed).
5. Shell: story items from parts in `addParts` order, hidden outside their views; the menu's "This story" group; the shelf panel as a `left` occupant (phone detail sheet) and a view switch closing a panel the view does not show. Render `descriptor.view`; no shelf import in the shell.
6. Extend the drift check to `src/shelf`; style only from the shared look.
7. Tests, synthetic scene, README, CHANGELOG, api errors and lock; migrate driver/journeys if the bar DOM changed.

## Boundaries

No content parts (explainer, actions, chips, colour key: next Task), no catalogue page, no readout tile or chart, no changes to story panels' timing or the site's demos.

## Technical Verification

Focused tests during iteration; configured gates at handoff (AGENTS.md Verification Policy). Evaluated later under `agent-skills/references/check-method.md`. No browser run per step; the Full Check runs `check:browser` once.

## Technical Evidence

Executed 2026-11-21 by a builder session (Sonnet), in plan order. No browser run (the Full Check runs `check:browser` once).

**Per criterion**

- One shelf contract. `scene.addParts` (append, atomic, `duplicate-id` across part and block ids and against story panel ids at build, `bad-part` for a value no factory made): `tests/shelfParts.test.ts` ("Scene.addParts" block, 4 cases). `handle.part(descriptor)` with typed `PanelControl` and `CustomBlockControl`, `bad-part` for a part not in this viewer's scene, a lookalike or a bad `setOpen` argument, `not-mounted` outside the lifecycle (`part`, `open`, `setOpen`), setters silent, `onOpen` hears visitors only, host calls in order, rebuild: `tests/lifecycle.test.ts` "shelf parts (O-080 T-333) ..." on both embedding paths (`mount`, `AstraeusScene`; one `describe.each`). Two-viewer (API-03): `tests/twoViewers.test.ts` "API-03: one shelf panel descriptor shared by two viewers ..." on every pairing of the paths. Factory checks, one field each: `tests/shelfParts.test.ts` "the factories check their input at the call (bad-part)" (4 cases).
- Bar and panels. Story button in the bar rule (full and short label, scene order, phone keeps the first and moves the rest to the menu under "This story", a menu item closes the menu): `tests/shelfBar.test.ts` "the story buttons" (4 cases; fit-rule cases for story buttons beyond the existing worked cases in `tests/fitBar.test.ts`, which already hold the story-item steps). Panel as the `left` occupant (replaces About, a card and the moons; another shelf panel replaces it; Escape, its button and Close close it; phone sheet): `tests/shelfBar.test.ts` "the panel through the panel rule" and "the panel rule's shelf rows" (reducer rows, both layouts). A part id listed only in view B is hidden in view A and an open panel closes on the switch (silently), and a panel not shown cannot be opened: `tests/shelfParts.test.ts` "view scoping reuses the view rule" plus `tests/lifecycle.test.ts` "a part id some view lists shows only in those views ...".
- Custom panel. Element alive from `ready` to `unmount`, hidden (out of the page) while the panel is closed, host content survives closing and reopening, one element per viewer: `tests/shelfBar.test.ts` (shell), `tests/lifecycle.test.ts` (both paths, new element after a rebuild), `tests/twoViewers.test.ts` (separate elements per viewer).
- No placement code per part. The shell renders `part.view` and imports no shelf module (`src/shell/useShelfPanels.tsx`, `src/shell/StoryButton.tsx`, `src/shell/AstraeusShell.tsx` import only `app/shelfContract` types). The panel's place comes from the panel rule's `left` occupant `shelf:<id>`.
- Shared look. No CSS and no raw value added; the panel reuses `info-panel`, `ui-pill` and the bar's own button rules. `tests/lookDrift.test.ts` already scans `src/shelf` and passes.
- Docs. README: `scene.addParts` row, `handle.part` row, the `mount` handle member list. CHANGELOG 0.9.5 section: one Added line. Factories and `addParts`/`handle.part` carry doc comments, the factories `@shelf`. `npm run api:errors` (adds `bad-part` to the README error table) and `npm run api:lock` ran.
- Site browser driver and journeys: the existing bar DOM is unchanged (only a new `button[data-story-button]` item, drawn when a scene adds parts; no demo does), so `packages/astraeus-site/tools/validate/driver.mjs` needed no change in this Task. A driver helper for story buttons belongs with the catalogue page (T-335).

**Commands run (final state)**

- `npm run lint`: clean (after splitting `viewSwitched` out of `reducePanels`, moving the part defaults into `useShelfPanels` and the story-id check into `PartPlan.checkAgainst`, all to stay at complexity 20).
- `npm run typecheck`: clean.
- `npm run build`: built (chunk-size warning is the existing one).
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 4441 passed, 2 skipped, 2 failed of 4445. Both failures are `packages/astraeus-site/tests/packagePacks.test.ts` for the known engine pack limit: `astraeus: unpacked 9.52 MB is over 9.5 MB` (`node tools/check-packs.mjs` prints 9.53 MB unpacked, 7.34 MB packed, 639 files). Not raised; left for T-336 and the owner. No other test failed.
- Size measurements. Engine pack unpacked 9.53 MB (limit 9.5 MB; the pre-T-333 number was not measured separately in this session, the full run before the tests and docs were added already read 9.52 MB). API reference page: 204,145 B raw, 44,338 B gzip (limits 230,000 and 46,000; within).
- Focused during iteration: `shelfParts`, `shelfBar`, `lifecycle` (run three times after the timing fix), `twoViewers`, `sceneInputCopies`, `apiImports`, `apiRules`, `apiSurface`.

**Existing tests changed (expected values or lists only, no fixture or setup changed)**

- `tests/lifecycle.test.ts` handle member table: the `CALLS` table gained `part` (a new `ViewerHandle` member must join it; the `expectUnusable` pass then checks it throws `not-mounted`).
- `tests/apiImports.test.ts` `ALLOWED`: added `app/shelfContract` (the definition contract for parts, with its reason), the review decision that test asks for.
- `tests/sceneInputCopies.test.ts` `ROWS`: added an `addParts` row (the call walk fails a mutator with no row); the row's input is plain data and the descriptor is built inside `apply`, because descriptors are frozen and hold a function.
- `tests/domSetup.ts` (helper, not a test): optional `shelfParts`, `shelfRuntime`, `showParts` and `shelfChanges`, so existing callers are unchanged.
- Generated: `packages/astraeus/api-surface.lock.json` and the README error table (`bad-part`).

**Files read (beyond the Context Files, logged per the extra-read rule)**: `src/api/viewerLink.ts`, `src/api/planViews.ts`, `src/api/assembleScene.ts`, `src/api/listeners.ts`, `src/api/plainObject.ts`, `src/app/viewerPort.ts`, `src/app/experienceDefinition.ts`, `src/app/App.tsx` (the attach, view and shell-prop sections), `src/shell/ControlsDrawer.tsx` (by grep), `tests/about.test.ts`, `tests/lifecycle.test.ts`, `tests/twoViewers.test.ts`, `tests/sceneInputCopies.test.ts`, `tests/apiImports.test.ts`, `tests/fitBar.test.ts`, `tests/barDom.test.ts`, `tests/domSetup.ts`, `tests/interfaceHeaders.test.ts`, `tools/api-rules.mjs` (head), `packages/astraeus-site/tools/validate/load-budget.mjs` (the limit line). Reason: to follow the About wiring as the pattern for a new viewer-level feature and to find the tests a new handle member and error code must join. Design.md sections were not read; the note `docs/architecture/viewer-interface.md` sections 4, 5, 7, 9 and 11 were the design source.

**Limitations**: no browser run; fit at 360 and 1280 px is proven by the pure fit rule cases and by stubbed-width DOM cases, not on a real layout; the two known size limits are red/at the line as above; a story panel and a shelf panel are not tested together beyond the rule rows (the story place is independent of `left`).

## Drift Notes

Architecture deltas for the planner (reconciled in the last O-080 Task before the Full Objective Check):

1. Internal contract placement. The shelf's internal descriptor shape (public fields plus `view`) is `src/app/shelfContract.ts`, not a `src/shelf/` module, so the shell and the definition read it without importing a shelf module. Shelf modules build values of it. Design note section 9 shows `shelf/` holding only `factory.ts`, `View.tsx`, `part.css`; also in `src/shelf/` now: `part.ts` (shared registry and checks, the public descriptor types) beside the per-part folders.
2. Panel rule addition. A shelf panel is the `left` occupant named `shelf:<id>` (a template-literal `ShelfOccupant`), so `PanelState` keeps its shape; `viewSwitch` gained an optional `dropsShelf`. Section 5's table row "Shelf panel (O-080)" is as built.
3. Unknown id in `ViewInput.panels`. Story panel ids and part ids share the one `panels` list of a view, so an unknown id is still `bad-view` (not `bad-part`, which section 7 suggests for "a view naming an unknown part"). `Scene.views` therefore lists part ids in each view's `panels`. A part id equal to a story panel id is `duplicate-id` when the scene is built.
4. `onOpen` does not hear a close caused by a view switch (the host hears the switch through `onChange`), nor any host `setOpen`; it hears a visitor's button, Close, Escape and another occupant of the left place taking it.
5. `handle.part` is typed by overloads (`PanelPart` gives `PanelControl`, `CustomBlockPart` gives `CustomBlockControl`); each later part adds an overload, with no `unknown` in the public type (API-04). `scene.addParts` takes `readonly PanelPart[]` for now; blocks are given in a panel's `blocks`, never added alone.
6. `PanelControl.onOpen` reports `{ part, open }` (no time or cause), as only visitors are heard.
7. A custom block's element is made per viewer by `useShelf` in `app/` and handed to the link at attach (`ViewerControl.parts`), alive until detach (a rebuild makes a new one); `handle.part(block).element` is undefined before `ready` and after `unmount`.
8. Panel look. The panel reuses `info-panel` and the About panel's header classes; no `part.css` was needed in this Task, so the pick-by-import CSS question stays open for T-334's `tools/check-shelf-split.mjs`.
9. A host `setOpen(true)` for a panel the showing view does not show leaves it closed without an error.
10. Sizes: engine pack 9.53 MB unpacked vs the 9.5 MB limit (red); API reference page 44,338 B gzip vs 46,000 (green).

Coordinator: accepted the table additions (lifecycle CALLS `part`, apiImports `app/shelfContract`, sceneInputCopies `addParts` row, domSetup optional shelf options) as additions, not setup changes. Engine pack red (9.52 MB > 9.5 MB, 2 `packagePacks.test.ts` failures): owner "Measure, then decide (Recommended)" — limits stay; measured in T-336 and brought to the owner before the Full Objective Check. Coordinator marked done (owner: "Orchestrate 080"); lint, typecheck, build clean; npm test 4441 passed, 2 failed (known pack size), 2 skipped; API page 44,338 B gzip (within 46,000).
