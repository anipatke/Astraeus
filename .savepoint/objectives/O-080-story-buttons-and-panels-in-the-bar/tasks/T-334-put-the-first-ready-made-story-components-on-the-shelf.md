---
id: T-334
objective: O-080
title: Put the first ready-made story components on the shelf
status: done
depends_on: [{task: T-333, requires: clear}]
check_waiver: {task: T-334, reason: 'Owner said "Orchestrate 080": standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o080-20261121}, recorded_at: '2026-11-21T05:15:22Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o080-20261121}
---

# Put the first ready-made story components on the shelf

## Outcome

Four content parts an app fills with its own words and numbers, each its own import: `explainer` (heading, paragraphs, notes; `setParagraphs`), `actions` (labelled buttons, an optional camera move; `onAction`), `filterChips` (one or several, light up straight away and report; `selected`, `setSelected`, `setChoices`, `onSelect`) and `colourKey` (swatches, labels, counts, notes; `setEntries`). A new check proves an app importing one part does not download the others.

## User Check

A synthetic panel holding all four: chips light up on a press and the host hears the values with cause `visitor`; `setSelected` changes them silently; an action with a camera moves the camera as a story panel's does; `setParagraphs` and `setEntries` change the panel while it is open. `node tools/check-shelf-split.mjs` passes, and fails when a second part is imported.

## Done When

The "First set" (content parts), "Shared look" and "Pick by import" O-080 Success Conditions hold, with named tests per part on both embedding paths, a synthetic scene (ARCH-03), `bad-part` shape cases per factory, keyboard use of chips and actions, and the split check wired into the project's gate tooling (named in `docs/agents/build.md` if it becomes a gate). If Vite keeps unused part CSS, use the note's fallback (part CSS in the shared sheet) and record it with the measured bytes. README, CHANGELOG, doc comments with `@shelf`, `npm run api:errors`, `npm run api:lock`. Apply `docs/agents/verification.md`.

## Context Files

- `docs/architecture/viewer-interface.md` under `7. Public interface (O-079, O-080, O-081)`
- `docs/architecture/viewer-interface.md` under `11. Story-component shelf`
- `docs/architecture/viewer-interface.md` under `10. Shared look`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/Objective.md`
- `.savepoint/Design.md` under `Viewer interface`
- `.savepoint/objectives/O-080-story-buttons-and-panels-in-the-bar/tasks/T-333-let-a-story-add-its-own-bar-buttons-and-custom-panels.md` under `Technical Evidence` (the shelf files it created; read those it names for the part pattern)
- `packages/astraeus/src/api/story.ts`
- `packages/astraeus/src/api/cameraRequest.ts`
- `packages/astraeus/src/api/index.ts`
- `packages/astraeus/src/shell/look/look.css`
- `packages/astraeus/package.json`
- `tools/measure-example.mjs`
- `docs/agents/build.md`
- `packages/astraeus/README.md` under `Looks, controls and views`
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

Design "Viewer interface", "Public API shape (G-016, owner 2026-11-01)", "Size budgets are split".

## Guardrails

ARCH-01, ARCH-02, ARCH-03, API-01, API-02, API-04, API-05, API-07, TEST-01, TEST-03, STYLE-07, STYLE-09.

## Implementation Plan

1. Confirm the previous Task's descriptor, `addParts` and `handle.part` exist; return REPLAN REQUIRED if not.
2. One module tree per part under `src/shelf/`, following the panel's pattern; factories checked at the call.
3. Chips: single or multiple, deselectable, optional colour; press updates and reports; setters silent.
4. Actions: camera input checked as story panels check theirs, through the same camera request path.
5. Add `tools/check-shelf-split.mjs` beside `tools/measure-example.mjs` (example importing only `filterChips`; fail on any other part's marker class in emitted JS or CSS); apply the CSS fallback only if needed.
6. Tests, README, CHANGELOG, api errors and lock.

## Boundaries

No catalogue page, no readout tile or chart, no changes to the bar or panel rules beyond what a part needs, no site demo changes.

## Technical Verification

Focused tests during iteration; configured gates plus the new split check at handoff. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executed 2026-11-21 by a builder session (Sonnet), in plan order. No browser run (the Full Check runs `check:browser` once).

**Per criterion**

- Four content parts, each its own module tree under `src/shelf/<part>/` (`factory.ts`, `View.tsx`, `part.css`), following the panel's pattern; the descriptor carries its `view` and its `control` (a new internal `control` field on `ShelfBlock`, so `api/viewerParts.ts` imports no part and a control's setters live with the part). `explainer` (`setParagraphs`), `actions` (`onAction`; a camera checked by `cameraRequestOf` as story panels check theirs, ids checked when the scene is built by `PartPlan.checkCameras`, `bad-part`), `filterChips` (`selected`, `setSelected`, `setChoices`, `onSelect`; `multiple`, deselectable, optional colour dot, press lights at once and reports `{ part, values, cause: "visitor" }`), `colourKey` (`setEntries`).
- Shared contract additions (`src/app/shelfContract.ts`): `ShelfCell` (a block's changing content per viewer: view reads, setters and presses write; made in `app/useShelf.ts` per viewer and per rebuild), `ShelfRuntime` gains `cell`, `report`, `moveCamera` (optional, so the existing shell test's bare runtime literal is unchanged; `src/shelf/useCell.ts` falls back to a local cell), `ShelfBlockLink`, `ShelfBlock.data/initial/control`. `ShelfControl` gains `blocks` and `cell(id)`; `ViewerPort.partHeard`; `ViewerLink.partHeard`; `ViewerParts.heard` (block listeners cleared with the panel ones on `clearListeners`). The camera: `App.tsx` routes `runtime.moveCamera` through `shelfCamera` to `setCamera` guarded by `shownAtClock`, the story panel's own path.
- `handle.part` and `ViewerLink.part` are now generic: `part<P extends AnyPart>(part: P): ControlFor<P>` (replacing the two overloads). `scene.addParts` is unchanged (`PanelPart[]`): the new parts are blocks and go in a panel's `blocks`, never added alone (design note section 7 example).
- Tests, named per part on both embedding paths: `tests/lifecycle.test.ts` "shelf content parts (O-080 T-334) ..." (one `describe.each` over mount, AstraeusScene and its StrictMode run: chips on a press light up and the host hears values with cause visitor, single row holds one and a second press clears it, multiple, setSelected/setChoices/setParagraphs/setEntries silent, setChoices keeps lit values, bad values `bad-part`, keyboard: chips and actions are focusable native buttons, an action moves `controls().cameraRequest` to `{ kind: "focus", target: "earth" }` and is heard, an action without a camera leaves it alone, text kept across closing and reopening, every control `not-mounted` after unmount). `tests/twoViewers.test.ts` "API-03: chips, text and a key shared by two viewers ..." (every pairing of the paths). `tests/shelfContentParts.test.ts` (46 cases): `bad-part` shape cases per factory, one field each (explainer 6, actions 8, filterChips 12, colourKey 8), frozen descriptor shared between scenes, inputs copied, `duplicate-id` across kinds, action camera ids refused at build naming the action.
- Split check: `tools/check-shelf-split.mjs` (npm script `check:shelf-split`, named in `docs/agents/build.md`; not a timed gate). It packs the engine, builds a throwaway page in `examples/hello-scene/.split-check` importing only `filterChips` (also `--import panel`, `explainer`), and fails on any other part's marker class in the emitted JS; it also fails when an imported part's marker is absent (a vacuous pass). Results: default `filterChips`: ok (2,188,049 B raw, 749,462 B gzip); `--import filterChips,explainer --allow filterChips`: FAIL naming `shelf-explainer`, exit 1; `--import filterChips,actions,colourKey --allow filterChips`: FAIL on both; `--import panel` (allows `customBlock`) and `--import explainer`: ok.
- CSS: Vite did NOT keep unused part CSS when each View imported its own `part.css` (the split check passed on CSS too). But `tests/interfaceLeftovers.test.ts` ("loads the stylesheets in one place") forbids any stylesheet import outside the entry files, because the package ships a Node copy of the entry files only and a view importing CSS would break it. So the note's CSS fallback is used for that reason: the four `shelf/<part>/part.css` are `@import`ed by `app/style.css` (measured: explainer 702 B, actions 784 B, filterChips 1,531 B, colourKey 1,180 B; 4,197 B raw in all, in the one shared sheet). The split check therefore tests JS only and prints CSS bytes.
- Shared look: every colour and size is a `--astraeus-*` token (the only custom property a part sets is `--shelf-colour`, the story's own colour per swatch or dot); `tests/lookDrift.test.ts` (scans `src/shelf`) and `tests/interfaceLeftovers.test.ts` pass.
- Docs: README (addParts, handle.part and the error-table rows), CHANGELOG 0.9.5 (one Added line), doc comments with `@shelf` on the four factories, `npm run api:errors` and `npm run api:lock` ran.
- Site browser driver: no bar or panel DOM hook used by `packages/astraeus-site/tools/validate/driver.mjs` changed; not touched.

**Commands run (final state)**

- `npm run lint`: clean. `npm run typecheck`: clean. `npm run build`: built (existing chunk-size warning).
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 4492 passed, 2 skipped, 2 failed of 4496. The 2 failures are `packages/astraeus-site/tests/packagePacks.test.ts` for the known engine pack limit (`astraeus: unpacked 9.57 MB is over 9.5 MB`). Limits not raised.
- Sizes. Engine pack (`node tools/check-packs.mjs`): 9.57 MB unpacked (limit 9.5; was 9.53 after T-333, so T-334 adds about 0.04 MB), 7.35 MB packed (limit 8.0), 661 files. API reference page (`renderApiPage`): 214,688 B raw (limit 230,000), 45,974 B gzip (cap 46,000; was 44,338 after T-333). The page first measured 46,919 B gzip, so doc comments, the `BlockPart<K>` type (instead of four Part interfaces) and a one-line `ControlFor` were trimmed to fit; headroom is now 26 B, so the next shelf part (O-081's two) needs the cap discussed or more trimming.
- Focused during iteration: `lifecycle` (shelf content), `shelfContentParts`, `twoViewers` (shelf), `apiSurface`, `lookDrift`, `interfaceLeftovers`, `apiReference`.

**Existing tests changed (additions only, no fixture or setup changed)**

- `tests/lifecycle.test.ts`: four factory imports and one new `it` (the part tests above). `tests/twoViewers.test.ts`: two factory imports and one new `it`. No existing test's setup, inputs or expectations changed. `tests/shelfBar.test.ts` is untouched: its bare `{ element }` runtime literal still compiles because the new runtime members are optional.
- Generated: `packages/astraeus/api-surface.lock.json`, README error table (`bad-part` message).

**Files read beyond the Context Files (extra-read rule)**: `src/shelf/*` and `src/app/shelfContract.ts`, `src/api/viewerParts.ts`, `planParts.ts`, `viewerHandle.ts`, `viewerLink.ts` (grep), `src/app/useShelf.ts`, `App.tsx` (shelf, camera and story-panel sections), `src/api/story.ts` (the camera section), `src/core/lookValues.ts` (`isCssColour`), `src/shell/parts/parts.css` and `controls.css` (class names), `tests/lookDrift.test.ts`, `tests/interfaceLeftovers.test.ts` (the two rules that failed), `tests/lifecycle.test.ts` and `tests/twoViewers.test.ts` (the shelf cases, to extend), `tools/build-example.mjs`, `examples/hello-scene/*`, `packages/astraeus-site/tools/site/api-reference.mjs` (by use, to measure the page). Reason: follow the panel pattern, find the checks the new files must pass, and build the split check.

**Limitations**: no browser run; chips, actions and the key are proven in happy-dom (DOM, camera request slot, host calls) and not on a real layout or with a real Tab/Enter key press (a native button is activated by Enter and Space; the test shows focus and the element kind); a long chip label wrapping on a 375 px phone is not seen; the engine pack and API page sizes are as above.

## Drift Notes

Architecture deltas for the planner (to reconcile in the last O-080 Task before the Full Objective Check):

1. Part CSS lives in the shared sheet, not with the part. Design note section 11 says a part's CSS is imported by its own view; `tests/interfaceLeftovers.test.ts` (O-079) allows a stylesheet import only in the entry files (the Node copy of the entry files cannot load CSS). So `shelf/<part>/part.css` is `@import`ed by `app/style.css` (4,197 B for four parts); only the JS is picked by import, and `tools/check-shelf-split.mjs` checks JS. Vite would have dropped the unused CSS, so the fallback was for the repository's own rule, not for Vite. Design note section 11 "Pick by import" and section 9 `part.css` placement need the reword.
2. Block contract. Descriptor internals gained `data`, `initial` and `control`; a block's changing content is a per-viewer `ShelfCell` (`shelfContract.ts`) that the view and the part's own control share; `ShelfRuntime` gained optional `cell`, `report`, `moveCamera`. `shelfContract.ts` now holds one value (`makeCell`) besides types.
3. `handle.part` is generic (`ControlFor<P>`), not overloads (reverses T-333 drift note 5); the new block descriptors are `BlockPart<K>` and `CustomBlockPart` is an alias of it; `scene.addParts` still takes `PanelPart[]` because the four parts are blocks.
4. Camera ids: an action's camera object ids are checked when the scene is built (`PartPlan.checkCameras`), `bad-part` (a story panel's is `bad-panels`); a shape error at the factory is `bad-part` (not `bad-camera`).
5. `onSelect` reports `{ part, values, cause: "visitor" }`; `onAction` reports `{ part, action }`; the action's camera turns before the host hears it; a camera toward an object the clock time does not show is refused, as a story panel's is.
6. Sizes: engine pack 9.57 MB unpacked vs 9.5 MB (red, known; T-336 measures, owner decides); API reference page 45,974 B gzip vs 46,000 cap (26 B headroom after trimming doc comments; O-081 adds two parts and will need the cap or more trimming).

Coordinator: accepted the lifecycle and twoViewers additions (new `it` cases, imports) as additions, not setup changes. Accepted part CSS in the shared sheet (`app/style.css` `@import`s each `shelf/<part>/part.css`, 4,197 B raw): the note §11 named this fallback; the cause is the O-079 owner rule "Load styles from one place" (`interfaceLeftovers.test.ts`), not Vite; JS stays pick-by-import, proven by `check:shelf-split`. Reconcile the note in T-336. Engine pack red 9.57 MB (owner "Measure, then decide"); API page 45,974 B gzip, 26 B under 46,000 — carried to T-336 sizes review. Coordinator re-ran apiRules, apiReference, interfaceLeftovers, lookDrift and shelf suites after the doc edits: 7 files, 122 passed. Coordinator marked done (owner: "Orchestrate 080"); lint, typecheck, build clean; npm test 4492 passed, 2 failed (known pack size), 2 skipped.
