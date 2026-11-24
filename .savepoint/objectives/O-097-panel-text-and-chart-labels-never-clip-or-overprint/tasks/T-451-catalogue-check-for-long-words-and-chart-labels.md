---
id: T-451
title: Catalogue check for long words and chart labels
objective: O-097
status: done
depends_on: [{task: T-449, requires: clear}, {task: T-450, requires: clear}]
check_waiver: {task: T-451, reason: 'Owner said "orchestrate O-97" (2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o097-20261124}, recorded_at: '2026-11-24T07:29:19Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o097-20261124}
planned_reads: [docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, packages/astraeus-site/tools/validate/journey-catalogue.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/browser-steps.mjs, packages/astraeus-site/tools/validate/driver-guard.mjs, tools/gate-limits.json, packages/astraeus-site/tests/gateLimits.test.ts, packages/astraeus-site/src/catalogue/examples/panel.ts, packages/astraeus-site/src/catalogue/examples/customBlock.ts, packages/astraeus-site/src/catalogue/examples/explainer.ts, packages/astraeus-site/src/catalogue/examples/actions.ts, packages/astraeus-site/src/catalogue/examples/filterChips.ts, packages/astraeus-site/src/catalogue/examples/colourKey.ts, packages/astraeus-site/src/catalogue/examples/chart.ts, packages/astraeus-site/src/catalogue/examples/readoutTile.ts, docs/architecture/viewer-interface.md, docs/evidence/browser-quick-20261124T070932Z/summary.txt]
planned_writes: [packages/astraeus-site/tools/validate/journey-catalogue.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/browser-steps.mjs, docs/BROWSER_CHECKS.md, tools/gate-limits.json, docs/architecture/viewer-interface.md]
---

# Catalogue check for long words and chart labels

## Outcome

The existing `catalogue` browser step (components.html, every shelf part, at 1280x720 and 375x667 with touch) proves both halves of the Objective with one check each, not one per part: with a long unbreakable word put into every wrapping text of each running part's panel, nothing spills sideways (scrollWidth within the panel); and the bar chart's mark labels, which include two close marks, have no overlapping label boxes. Section 11 of the viewer-interface note states both rules.

## User Check

None: no visible change of its own (the owner looks at the two fixes under their own Tasks).

## Done When

- **Sizes.** The step keeps its two sizes, 1280x720 (wide layout) and 375x667 with touch (phone layout); the Objective's 1440x900 and 390x844 are covered by the same layouts (Objective Decisions). No size is added.
- **Open each part's panel.** A driver function opens an entry's own panel through its bar button (generalise `pressCataloguePanelButton(page, part)` to take the example's button name, full or short as the bar shows it, from a table in the journey next to `ITS_WORDS`; the actions case keeps working unchanged). The chart example opens its own panel; the readout tile is measured as its card (wide) and as its sheet after the strip press the step already makes (phone).
- **No spill, one check for every part.** A new driver function (e.g. `catalogueLongWordFit(page, part)`) finds the entry's open panel surface (`.info-panel`: the shelf panel, or the tile card or sheet), appends one 120-character word with no break opportunity to every non-empty text node inside it except inside the chart's `svg` and except where the text's element computes `white-space: nowrap` (the tile's one-line strip and scale labels, one line by design; say so in the function's comment), waits two animation frames, and returns the panel's `clientWidth` and `scrollWidth` and any element whose right edge passes the panel's content box by more than 1 px. The journey asserts, for each of the eight parts at both sizes, `scrollWidth <= clientWidth + 1` and no element past the edge, naming the part and size. It runs inside the existing "every example starts" loop (and the tile section for the tile), so no example is started an extra time. Reading the page's own boxes only; no screenshot (browser policy).
- **No overprint.** A new driver function (e.g. `catalogueChartMarks(page, part)`) returns each drawn mark label's box (`[data-shelf-mark] text`, `getBoundingClientRect`) and the chart's `svg` box. The journey asserts, at both sizes: at least two marks drawn; no two label boxes overlap by more than 0.5 px; every label box is inside the chart's box horizontally; and the labels use at least two rows (distinct tops), so the check is proved on a real cluster. Added to the existing chart section.
- **Proof the checks can fail.** Run the step once against a tree without each fix (for example `git stash` only the shared panel rule from T-449, then only T-450's row layout, in a scratch worktree, never switching the main checkout) and record that the matching assertion fails with the part, size and measured numbers; restore. If that is impractical, record why and give the probe numbers from T-449's evidence instead.
- **Time.** Today the step takes 7 s of its 10 s limit (`docs/evidence/browser-quick-20261124T070932Z/summary.txt`, the newest full run `docs/evidence/browser-20261124T060708Z/` also 7 s). The planned checks are expected to cost about +2 to +4 s (one bar-button press and one measure per part per size). Run `npm run check:browser -- --step catalogue` three times and record each time. If the slowest is over 10 s, raise `browser.steps.catalogue` in `tools/gate-limits.json` to the slowest measured time plus about 30 % (rounded up to whole seconds), update the copy in the `docs/BROWSER_CHECKS.md` step table, and write the reason (new checks, measured times) in evidence; the full total (377 s of 450 s on 2026-11-24) needs no change unless measured otherwise. `packages/astraeus-site/tests/gateLimits.test.ts` passes.
- **Docs.** `browser-steps.mjs` `catalogue` scene line and the `docs/BROWSER_CHECKS.md` `catalogue` row name the two new checks. `docs/architecture/viewer-interface.md` section 11: under "One contract", one line that a part's text wraps inside its panel whatever its words, through the shared panel CSS (not each part's); the `chart` row says that mark labels that would overlap take further rows above the bars and the chart grows a row taller for each.
- **Existing assertions unchanged**: no assertion in `journey-catalogue.mjs` is removed, loosened or moved; the actions and tile sections behave as before. The driver guard (`packages/astraeus-site/tests/browserDriverGuard.test.ts`) passes: the script finds nothing itself; selectors outside the driver begin `[data-`.
- Configured gates pass; evidence recorded under `docs/agents/verification.md`.

## Context Files

- `docs/agents/browser-policy.md`
- `docs/BROWSER_CHECKS.md` under `Where things live`, `What each class of step protects` and `The interface driver`
- `packages/astraeus-site/tools/validate/journey-catalogue.mjs`
- `packages/astraeus-site/tools/validate/driver.mjs` (the catalogue section, from "The component catalogue page" to the end of the actions example functions)
- `packages/astraeus-site/tools/validate/browser-steps.mjs` (the `catalogue` entry)
- `tools/gate-limits.json`
- The catalogue examples' bar button labels: `packages/astraeus-site/src/catalogue/examples/*.ts` named in `planned_reads` (the `button` fields only)
- `docs/architecture/viewer-interface.md` under `11. Story-component shelf`
- T-449 and T-450 Technical Evidence (probe numbers, the second chart mark)

## Design References

`.savepoint/Design.md` under `Viewer interface`; `docs/BROWSER_CHECKS.md` (the driver rule, the step table).

## Guardrails

TEST-01, TEST-02, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Read the browser policy; confirm T-449 and T-450 are in the tree.
2. Driver: generalised panel-button press, `catalogueLongWordFit`, `catalogueChartMarks`.
3. Journey: the bar-button table; the fit assertion in the every-example loop and the tile section; the chart-mark assertions in the chart section.
4. Run `--step catalogue` three times; prove each assertion fails without its fix; set the limit if needed.
5. Scene line, BROWSER_CHECKS row, viewer-interface section 11.

## Boundaries

No new step, page or size; no screenshot; no engine or catalogue example change (if a fix is missing or a part spills, return to T-449 or T-450, or stop and report); no change to `orbit-lines` or any other step; one browser job at a time.

## Technical Verification

Focused: `npm run check:browser -- --step catalogue` (three runs, times recorded); `npx vitest run packages/astraeus-site/tests/gateLimits.test.ts packages/astraeus-site/tests/browserDriverGuard.test.ts`. Handoff: the configured gates. The Full Objective Check runs the full tier, which includes `catalogue`. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Files changed: packages/astraeus-site/tools/validate/driver.mjs (pressCataloguePanelButton takes the button names; new catalogueLongWordFit, catalogueChartMarks), journey-catalogue.mjs (BAR_BUTTONS table, fit assertion in the every-example loop, chart marks + chart panel fit, tile fit before stop), browser-steps.mjs (scene line), docs/BROWSER_CHECKS.md (row, limit 16 s), tools/gate-limits.json (catalogue 10 -> 16), docs/architecture/viewer-interface.md (section 11 contract line, chart row). Extra reads: none beyond planned_reads.

| Done When | Evidence |
|---|---|
| Sizes | no size added; both layouts run |
| Open each part's panel | BAR_BUTTONS table; actions section uses it unchanged; chart opens itself (live()), tile measured as card (wide) / sheet (phone) |
| No spill | catalogueLongWordFit asserted for 6 shelf panels in the loop, chart panel, tile; skips close-button glyph, svg text, nowrap text (commented). Fails without T-449 (parts.css from 7c471a7e): "desktop: panel's panel holds a long word (scrollWidth 2363 of clientWidth 358; past the edge: h2. +1948px, ...)" |
| No overprint | catalogueChartMarks asserted at both sizes: >=2 labels, no overlap, inside svg, >=2 rows. Fails without T-450 (View.tsx from 7c471a7e): 'desktop: chart mark labels "Limit" and "Survey edge" overprint (28.9 x 14.0 px)'. With the fix the boxes touch by 1.5 px vertically (SVG text boxes include the line gap), so vertical overlap counts only over a quarter of the box height |
| Time | green runs 9, 12, 9 s; then 9, 12, 9 s; slowest 12 s > 10 s, limit now 16 s (12 +30% rounded up); gateLimits test passes. One earlier run timed out 60 s waiting for the panel example to start (first section, before new code), not repeated in 8 later runs |
| Docs | scene line, BROWSER_CHECKS row, viewer-interface section 11 |
| Existing assertions | none removed or moved; browserDriverGuard passes |

Gates: prettier, eslint on the 3 mjs files clean; npm run typecheck clean; vitest browserDriverGuard, gateLimits, packageBoundaries: 3 files, 40 tests passed. Proof swaps restored (parts.css and View.tsx identical to HEAD).

## Drift Notes

None expected (viewer-interface section 11 is updated here); Design.md `Viewer interface` is reconciled by the planner before the Full Check.

Marked done by the coordinator under the owner's "orchestrate O-97" (2026-11-24) after the wave gate passed on 2026-11-24T07:44Z: `npm run typecheck`, `npm run lint`, `npm test` 345 files 5610 passed 2 skipped, `npm run build`. Owner kept the `catalogue` limit raise 10 s -> 16 s ("Keep 16 seconds", 2026-11-24; slowest green run 12 s). Builder saw one unexplained 60 s timeout in the first catalogue section (panel example reaching running) in about ten runs; flagged for the Full Check.
