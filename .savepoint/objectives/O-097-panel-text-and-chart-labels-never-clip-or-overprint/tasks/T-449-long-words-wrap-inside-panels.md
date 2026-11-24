---
id: T-449
title: Long words wrap inside panels
objective: O-097
status: in_progress
stage: audit
depends_on: []
check_waiver: {task: T-449, reason: 'Owner said "orchestrate O-97" (2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o097-20261124}, recorded_at: '2026-11-24T07:29:19Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: plan-o097-20261124}
planned_reads: [packages/astraeus/src/shell/parts/parts.css, packages/astraeus/src/shell/parts/phone.css, packages/astraeus/src/shelf/panel/View.tsx, packages/astraeus/src/shell/useShelfTile.tsx, packages/astraeus/src/shelf/explainer/part.css, packages/astraeus/src/shelf/filterChips/part.css, packages/astraeus/src/shelf/colourKey/part.css, packages/astraeus/src/shelf/actions/part.css, packages/astraeus/src/shelf/readoutTile/part.css, packages/astraeus/src/shelf/chart/part.css, packages/astraeus/tests/lookDrift.test.ts, packages/astraeus/tests/computedLook.test.ts, packages/astraeus/tests/domStorySteps.test.ts, packages/astraeus-site/src/catalogue/examples/explainer.ts, docs/architecture/viewer-interface.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/shell/parts/parts.css, packages/astraeus/src/shelf/explainer/part.css, packages/astraeus/src/shelf/filterChips/part.css, packages/astraeus/src/shelf/colourKey/part.css, packages/astraeus/src/shelf/actions/part.css, packages/astraeus/tests/panelWrap.test.ts, packages/astraeus-site/src/catalogue/examples/explainer.ts, packages/astraeus/CHANGELOG.md]
---

# Long words wrap inside panels

## Outcome

A long unbreakable word, title, label or note in any panel wraps inside the panel instead of widening its content and cutting every block off on the right (belt #30: scrollWidth 1,644 px in a 360 px panel at 1440x900). The fix is one shared rule on the panel surfaces in the shared panel CSS, so every shelf part, About, a body's card, the readout tile's card and sheet, and story panels all get it, not one rule per part. Ordinary text looks exactly as before.

## User Check

Run `npm run preview:owner`, open `localhost:5490/components.html` at a wide window and again at phone width (devtools device bar, 390 px), press Run on **Explainer text**, open its panel (the "How it moves" / "Moves" button): the small note ends with a long file name that has no spaces; it wraps inside the panel, every paragraph is whole and nothing is cut off on the right, and the panel does not scroll sideways. Then run **Panel with a bar button**, **Filter chips** and **Colour key** and open each panel: they look as they did before (no word broken in the middle where it fits, Close button whole).

## Done When

- **Cause named.** Before changing CSS, reproduce belt #30 on the dev server with a 120-character word with no break opportunity (e.g. `x` repeated, or a long `snake_case_file_name`) put in a panel title, an explainer heading, a paragraph, a note, a chip label, a key label and note, and an action label, and record in evidence which element's minimum width widened the panel (scrollWidth before, at 1280x720 and 375x667). Use a throwaway script in the session scratchpad (not committed) or devtools; no screenshot.
- **One shared rule.** In `src/shell/parts/parts.css`, the panel surfaces that hold host text (`.info-panel`, which is the shelf panel, About, the body card and the tile card and sheet; and `.story-panel`) let a long word break where it must (`overflow-wrap: anywhere`, inherited by their text) and their blocks and the header title may shrink below their longest word (`min-width: 0` on the panel's direct children and on the header's `h2`). A shelf part's own sheet changes only where the shared rule cannot reach (for example a flex or grid item that needs its own `min-width: 0`, or the chips label); name each such line in evidence. Chip rows keep `flex-wrap: wrap` and each chip stays within the panel width.
- **Buttons keep their words.** The header's Close button, pills and action buttons do not break a short label that fits (`Close` never becomes `Clos`/`e` beside a long title): the Close button does not shrink (`flex: none` or equivalent).
- **Ordinary text unchanged.** Text that fits lays out as before: no change to font, colour, spacing, sizes or tokens; `tests/lookDrift.test.ts`, `tests/computedLook.test.ts` and `tests/domStorySteps.test.ts` pass unedited. Lengths in CSS use tokens only (lookDrift).
- **A regression test** (TEST-02), new `packages/astraeus/tests/panelWrap.test.ts`: reads the shipped CSS (as `domStorySteps.test.ts` does) and fails if the panel surfaces lose the wrap rule, their children's or the header title's `min-width: 0`, or the Close button's no-shrink. The layout itself is proved in a real browser by the catalogue step (T-451, "Catalogue check for long words and chart labels"), since happy-dom does not lay text out.
- **Catalogue example.** `packages/astraeus-site/src/catalogue/examples/explainer.ts`: the note gains one realistic unbreakable token, so the owner can see the wrap on the public catalogue: `"Invented orbit, not measured: lantern_osculating_elements_epoch_2026_heliocentric_ecliptic_J2000.csv"` (subject to the owner's answer in the Objective's Decisions; if the owner declines, leave the example as it is and give the owner a dev-server page instead). No other example changes.
- **CHANGELOG** (`packages/astraeus/CHANGELOG.md`, the open 0.11.0 section only): one `Fixed` line: "a long word, title, label or note with no spaces now wraps inside its panel (shelf panels, About, cards, the readout tile and story panels) instead of widening the panel and cutting every line off on the right." Not a breaking change.
- **Size.** Expected +40 to +120 B gzip on the engine's first download (CSS counts; the shared stylesheet ships whole). Run `npm run check:pack` and report the engine figure; if the 527,000 B gzip cap is passed, stop and report (do not trim other code).
- Configured gates pass; evidence recorded under `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/shell/parts/parts.css` (`.info-panel`, `.info-panel-header`, `.story-panel` rules)
- `packages/astraeus/src/shell/parts/phone.css` (the sheet rules for `.info-panel` and `.story-panel` only)
- `packages/astraeus/src/shelf/panel/View.tsx`
- `packages/astraeus/src/shell/useShelfTile.tsx` (the tile card and sheet are `.info-panel`)
- The shelf part sheets: `packages/astraeus/src/shelf/explainer/part.css`, `packages/astraeus/src/shelf/filterChips/part.css`, `packages/astraeus/src/shelf/colourKey/part.css`, `packages/astraeus/src/shelf/actions/part.css`, `packages/astraeus/src/shelf/readoutTile/part.css`
- `packages/astraeus/tests/domStorySteps.test.ts` (the CSS-reading pattern, around its `min-width` assertions)
- `packages/astraeus-site/src/catalogue/examples/explainer.ts`
- `packages/astraeus/CHANGELOG.md` (top section only)
- `/home/user/code/belt/docs/astraeus-improvements.md` row 30 (read only)

## Design References

`.savepoint/Design.md` under `Viewer interface`; viewer-interface note section 9 (the drift check) and section 11 ("One contract").

## Guardrails

TEST-01, TEST-02, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Reproduce with the long-word probe; record which element widens the panel, at both sizes.
2. Add the shared rule to `parts.css`; touch a part's own sheet only where the shared rule cannot reach.
3. Re-run the probe: panel scrollWidth within its clientWidth at both sizes, Close whole.
4. Write `tests/panelWrap.test.ts`; run the look tests unedited.
5. Catalogue explainer note; CHANGELOG; `npm run check:pack`.

## Boundaries

No new look option, token or setting; no font, colour or spacing change; no change to chart SVG text (the chart Task owns mark labels; chart ticks and axis label are out of scope); no change to the tile's one-line strip or its scale mark labels (one line by design); no edits to `driver.mjs`, `journey-catalogue.mjs` or `docs/architecture/viewer-interface.md` (T-451 writes those); no existing test edited.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/panelWrap.test.ts packages/astraeus/tests/lookDrift.test.ts packages/astraeus/tests/computedLook.test.ts packages/astraeus/tests/domStorySteps.test.ts packages/astraeus-site/tests/shelfCatalogue.test.ts packages/astraeus-site/tests/catalogueEntries.test.ts`. Handoff: the configured gates and `npm run check:pack`. Browser proof is the catalogue step, added by T-451; this Task's own probe numbers go in evidence. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Files changed: packages/astraeus/src/shell/parts/parts.css, packages/astraeus/tests/panelWrap.test.ts (new), packages/astraeus-site/src/catalogue/examples/explainer.ts, packages/astraeus/CHANGELOG.md (0.11.0 Fixed line). No part sheet changed: each part's own sheet already has `overflow-wrap: anywhere` and `min-width: 0` on its blocks, rows and chips.

Cause (by reading the CSS; the live scrollWidth probe was NOT run: the coordinator's no-browser rule and the auto-mode classifier denied starting a dev server and headless browser, so no before/after numbers): the panel is a flex column, so its children stretch to its width, but the header row (`.info-panel-header`, flex) held an `h2` with no `overflow-wrap` and the default `min-width: auto`, so the title's longest word set the header's minimum width and pushed Close and the row out; the explainer heading and the chips label had no `overflow-wrap` either. Those are the elements that widened the panel; the part texts already wrapped. Not measured at 1280x720 / 375x667; T-451's catalogue step is the browser proof.

Done When -> evidence:
- Cause named: above (read, not measured).
- One shared rule: parts.css `:is(.info-panel, .story-panel) { overflow-wrap: anywhere }`, `:is(...) > * { min-width: 0 }`, header `h2` and `.story-panel h2` `min-width: 0`; panelWrap.test.ts asserts each.
- Buttons keep words: `.info-panel-header .info-panel-close { flex: none }` and `.story-panel-close { flex: none }`; panelWrap.test.ts.
- Ordinary text unchanged: no font/colour/spacing/token change; lookDrift, computedLook, domStorySteps pass unedited.
- Regression test: tests/panelWrap.test.ts (4 tests).
- Catalogue example: explainer note now ends with lantern_osculating_elements_epoch_2026_heliocentric_ecliptic_J2000.csv.
- CHANGELOG: one Fixed line in 0.11.0.
- Size: `npm run check:pack` pass, engine 525,853 B gzip (cap 527,000; before 525,811: +42 B).
Gates: npm run typecheck clean (one earlier failure was in T-450's chart View.tsx mid-edit; clean on rerun); eslint on panelWrap.test.ts and explainer.ts clean; prettier --check clean on parts.css, panelWrap.test.ts, explainer.ts; vitest focused: panelWrap, lookDrift, computedLook, domStorySteps (packages/astraeus/tests), shelfCatalogue, catalogueEntries (packages/astraeus-site/tests): 6 files, 110 tests passed.
Browser scripts: driver.mjs and journey-catalogue.mjs reference only selectors (`.info-panel .info-panel-close`) and page-level scrollWidth/overlap rects; no readout depends on the wrap or flex rules changed, and ordinary text lays out as before.
Limitations: no live layout probe; owner look pending (owner_validation required).

## Drift Notes

None; the viewer-interface line is written by T-451.
