---
id: T-450
title: Chart mark labels take further rows
objective: O-097
status: done
depends_on: []
check_waiver: {task: T-450, reason: 'Owner said "orchestrate O-97" (2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o097-20261124}, recorded_at: '2026-11-24T07:29:19Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: plan-o097-20261124}
planned_reads: [packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/src/shelf/chart/factory.ts, packages/astraeus/src/shelf/chart/part.css, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/twoViewers.test.ts, packages/astraeus/tests/lookDrift.test.ts, packages/astraeus-site/src/catalogue/examples/chart.ts, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/src/shelf/chart/markRows.ts, packages/astraeus/src/shelf/chart/part.css, packages/astraeus/tests/chartMarkRows.test.ts, packages/astraeus-site/src/catalogue/examples/chart.ts, packages/astraeus/CHANGELOG.md]
---

# Chart mark labels take further rows

## Outcome

A `chart`'s mark labels never print over each other: a label whose box would overlap one already placed drops to a further row above the plot, and the chart grows one row taller for each extra row, so close marks such as the Kirkwood gaps 5:2 (2.82), 7:3 (2.96) and 2:1 (3.28) read "5:2", "7:3", "2:1" instead of "5:27:32:1" (belt #18, layout half). A chart whose labels fit on one row draws exactly as today.

## User Check

Run `npm run preview:owner`, open `localhost:5490/components.html` at a wide window and again at phone width (devtools device bar, 390 px), press Run on **Bar chart** (its panel opens by itself): the two marks near the right ("Limit" and the new close mark) each have their own readable label, one on a row above the other, neither label crosses the other or runs off the chart, and the bars, ticks and axis label look as before.

## Done When

- **Row layout as one pure function**, new `packages/astraeus/src/shelf/chart/markRows.ts`: given each label's anchor x and width (chart units) and the chart width, returns each label's row and its box. Anchoring is unchanged (a mark in the left half starts at its line, one in the right half ends at it); a box that would run past the chart's left or right edge is moved inside (a label wider than the whole chart stays clipped at the edge: a stated limit, not a fix). Labels are placed in order of x, each in the lowest row (row 0 nearest the plot) where its box clears every box already in that row by a small gap.
- **Widths measured, with a fallback.** The view measures each drawn label's width in chart units after it draws (`getComputedTextLength()` or `getBBox()` in a layout effect, so no frame shows overprint) and lays the rows out from those widths; where the browser gives no measurement (0, or happy-dom), it uses a per-character estimate. Widths follow the host's text-size setting because they are measured, not fixed. No per-frame work (the chart is not in the scene frame).
- **Geometry.** Row 0 is exactly where labels sit today (`y = TOP - 8`, same anchors), and a chart with every label in row 0 keeps `viewBox="0 0 320 156"` and every position it has today. Each further row adds one row height above the plot (the viewBox grows taller and the plot moves down by the same amount, so bars keep their height); each mark's dashed line reaches up to its own label's row. No raw lengths in CSS (lookDrift); SVG geometry stays in the view's constants.
- **Unit test**, new `packages/astraeus/tests/chartMarkRows.test.ts` (TEST-02): the Kirkwood case (bins 2.0 to 3.5; marks 3:1 at 2.50, 5:2 at 2.82, 7:3 at 2.96, 2:1 at 3.28) gets no two overlapping boxes in any row and every box inside the chart; far-apart marks all stay in row 0; a single mark is row 0; a label at either edge is moved inside. A happy-dom render (as `tests/lifecycle.test.ts` draws a chart) shows clustered labels on different `y` and a taller `viewBox`, and a one-mark chart's `viewBox` is still `0 0 320 156`.
- **Existing tests unchanged**: `tests/lifecycle.test.ts` chart case (reads mark text and count only) and `tests/twoViewers.test.ts` chart bars pass unedited. If any existing case turns red, stop and report it; do not edit it.
- **Catalogue example.** `packages/astraeus-site/src/catalogue/examples/chart.ts`: `SIZES.marks` gains a second mark close to "Limit" so the catalogue shows a second row, e.g. `{ value: 22, label: "Survey edge" }` (inside the bins; subject to the owner's answer in the Objective's Decisions). The page's existing readouts (three bars, a lit bar, the summary naming the axis) are unchanged.
- **Not in this Task:** the chart's screen-reader summary naming its marks (O-098), chart ticks and highlight colour (G-025 out of scope).
- **CHANGELOG** (`packages/astraeus/CHANGELOG.md`, the open 0.11.0 section only): one `Fixed` line: "`chart` mark labels no longer print over each other: a label that would overlap drops to a further row above the bars, and the chart grows a row taller for each; a chart whose labels fit draws as before." Not a breaking change.
- **Size.** The chart's JS loads only when `chart` is imported (`npm run check:shelf-split`), so it is outside the engine's first-download figure; any CSS line counts. Expected 0 to +50 B gzip on the first download, about +0.4 to +0.7 KB on the chart's own chunk. Run `npm run check:pack` and `npm run check:shelf-split`, report the engine figure; if the 527,000 B gzip cap is passed, stop and report.
- Configured gates pass; evidence recorded under `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/shelf/chart/View.tsx`
- `packages/astraeus/src/shelf/chart/factory.ts` (`ChartData`, `extentOf`)
- `packages/astraeus/src/shelf/chart/part.css`
- `packages/astraeus/tests/lifecycle.test.ts` (the chart case only, for the happy-dom render pattern)
- `packages/astraeus-site/src/catalogue/examples/chart.ts`
- `packages/astraeus/CHANGELOG.md` (top section only)
- `/home/user/code/belt/docs/astraeus-improvements.md` row 18 (read only)

## Design References

`.savepoint/Design.md` under `Viewer interface`; viewer-interface note section 11 (the `chart` row).

## Guardrails

TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-02, STYLE-07, CODE-01.

## Implementation Plan

1. Write `tests/chartMarkRows.test.ts` from the Kirkwood case and see it fail against today's one-row layout.
2. `markRows.ts`: anchor, clamp, greedy lowest-row placement.
3. `View.tsx`: measure labels after draw (fallback estimate), place rows, grow the viewBox and move the plot down by the extra rows; one-row charts unchanged.
4. Run the lifecycle and twoViewers chart cases unedited; the catalogue example's second mark; CHANGELOG.
5. `npm run check:pack`, `npm run check:shelf-split`.

## Boundaries

No new chart input, option or setting (no per-mark `row` or anchor field); no change to bars, ticks, axis label, highlight or colours; no change to the summary text; no edits to `driver.mjs`, `journey-catalogue.mjs` or `docs/architecture/viewer-interface.md` (T-451 writes those); no existing test edited.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/chartMarkRows.test.ts packages/astraeus/tests/lifecycle.test.ts packages/astraeus/tests/twoViewers.test.ts packages/astraeus/tests/shelfInputTable.test.ts packages/astraeus/tests/lookDrift.test.ts packages/astraeus-site/tests/shelfCatalogue.test.ts packages/astraeus-site/tests/catalogueEntries.test.ts`. Handoff: the configured gates, `npm run check:pack` and `npm run check:shelf-split`. Browser proof of real label boxes is the catalogue step, added by T-451. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Files changed: packages/astraeus/src/shelf/chart/markRows.ts (new), packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/tests/chartMarkRows.test.ts (new), packages/astraeus-site/src/catalogue/examples/chart.ts (second mark "Survey edge" at 22), packages/astraeus/CHANGELOG.md (one Fixed line). part.css not needed (no CSS change).

| Done When | Evidence |
|---|---|
| Row layout pure function | chartMarkRows.test.ts: Kirkwood no overlap and inside chart, far-apart row 0, single row 0, edge labels moved inside |
| Widths measured with fallback | View.tsx layout effect uses getComputedTextLength, falls back to 6 units per character; render test mocks 34-unit widths |
| Geometry | render test: clustered labels differ in y and viewBox taller; one-mark chart viewBox "0 0 320 156", label y 14 |
| Existing tests unchanged | lifecycle, twoViewers, shelfInputTable, lookDrift pass unedited |
| Catalogue example | chart.ts marks gain Survey edge at 22; shelfCatalogue, catalogueEntries, apiReference pass |
| Size | check:shelf-split ok; check:pack pass, engine 525,853 B gzip (cap 527,000; was 525,811) |

Commands: npm run typecheck (clean); eslint + prettier on changed files (clean); vitest run chartMarkRows, lifecycle, twoViewers, shelfInputTable, lookDrift, astraeus-site shelfCatalogue, catalogueEntries, apiReference: 8 files, 343 passed; check:shelf-split ok; check:pack pass.
Limitations: a dashed line from a higher-row label can cross a lower-row label; a label wider than the chart stays clipped at the left edge. No browser run; driver.mjs line 1726 only queries the .shelf-chart wrapper (not marks, not viewBox); journey-catalogue.mjs has no chart reference.

## Drift Notes

None beyond: the viewer-interface `chart` row (T-451) should say mark labels take further rows.

Marked done by the coordinator under the owner's "orchestrate O-97" (2026-11-24) after the wave gate passed (`npm run typecheck`, `npm run lint`, `npm test` 345 files 5610 passed 2 skipped, `npm run build`, `npm run check:pack` engine 525,853 B gzip). Owner looked on localhost:5490 (`npm run preview:owner`, branch o097-panel-text-and-chart-labels at 03c9be33, 2026-11-24T07:35Z, components.html explainer and bar chart at desktop and phone width) and said "both look fine, carry on". The acceptance fields are filled in once the Full Objective Check has an id.
