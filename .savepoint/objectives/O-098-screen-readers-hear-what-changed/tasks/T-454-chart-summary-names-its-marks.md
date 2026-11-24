---
id: T-454
title: Chart summary names its marks
objective: O-098
status: in_progress
stage: audit
depends_on: []
check_waiver: {task: T-454, reason: 'Owner said "orchestrate O-98" (2026-11-24): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o098-20261124}, recorded_at: '2026-11-24T08:17:01Z'}
owner_validation: {required: true}
planned_by: {role: planner, session: plan-o098-20261124}
planned_reads: [packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/src/shelf/chart/factory.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/chartMarkRows.test.ts, packages/astraeus/tests/twoViewers.test.ts, packages/astraeus-site/src/catalogue/examples/chart.ts, packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md]
planned_writes: [packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/tests/chartSummary.test.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/CHANGELOG.md, docs/architecture/viewer-interface.md]
---

# Chart summary names its marks

## Outcome

A `chart`'s screen-reader summary names every mark it draws, in order of value, so the Kirkwood chart reads "…; marks: 3:1 at 2.5, 5:2 at 2.82, 7:3 at 2.96, 2:1 at 3.28" (belt #18, summary half; the layout half shipped in O-097). Nothing visible changes.

## User Check

Run `npm run preview:owner`, open `localhost:5490/components.html`, press Run on **Bar chart**. Right-click the chart, Inspect, select the `<svg>` element, open DevTools' **Accessibility** pane: its Name ends "…; marks: Limit at 20, Survey edge at 22; …is highlighted…" (the catalogue's highlight clause as it is today) and the chart looks as before. No screen reader needed.

## Done When

- **Summary text**, `chartSummary` in `chart/View.tsx`: after the largest-bar clause and before the highlight clause, when any mark is drawn, `; marks: ${label} at ${count(value)}` for each, joined by ", ", sorted by value. Only the marks the chart draws (the same `shown` filter: a mark the current bins no longer cover is left out, as it is not drawn); none drawn, no clause. Values use the summary's existing `count` formatter (up to two decimals, so 2.50 reads "2.5"), one source of truth with the bin numbers. `chartSummary` takes the marks as an argument; one definition of `shown` serves both the drawing and the summary (STYLE-07).
- **Component test, failing before**, new `packages/astraeus/tests/chartSummary.test.ts`: the pure function on the Kirkwood case (bins 2.0 to 3.5; marks given out of order) gives the clause "marks: 3:1 at 2.5, 5:2 at 2.82, 7:3 at 2.96, 2:1 at 3.28" in value order; no marks, no clause; a mark outside the current bins left out; with a highlight, the marks clause comes before "is highlighted". A happy-dom render (the chart pattern of `tests/lifecycle.test.ts`) shows the `<svg>`'s `aria-label` with the clause, and after `setBins` to a range that drops a mark, the clause loses it.
- **Existing tests.** `tests/chartMarkRows.test.ts` and `tests/twoViewers.test.ts` (chart bars) pass unedited. `tests/lifecycle.test.ts` lines 1067-1069 pin the summary "Bar chart of Diameter (km): 3 bars from 0 to 30; the largest, 10 to 20, holds 9." for a chart with the mark "Limit" at 10; this Task changes that one expected string to "Bar chart of Diameter (km): 3 bars from 0 to 30; the largest, 10 to 20, holds 9; marks: Limit at 10." **only if the owner has approved it in the Objective's Decisions** (listed there as "Open for the owner"); without that approval, stop and report before editing. Line 1074 (`toContain("10 to 20 is highlighted (1 bars)")`) passes unedited. If another case turns red, stop and report.
- **CHANGELOG** (the open 0.11.0 section only, one line of your own): "Fixed: a `chart`'s screen-reader summary names the marks it draws (\"marks: 5:2 at 2.82, …\")." Not a breaking change.
- **Docs.** `docs/architecture/viewer-interface.md` section 11, the `chart` row only: "its summary names the drawn marks".
- **Size.** The chart's JS loads only when `chart` is imported (`npm run check:shelf-split`); no CSS. Expected 0 B on the engine's first download, about +60 to +120 B on the chart's chunk. Run `npm run check:pack` and `npm run check:shelf-split` and report the engine figure; if the 527,000 B gzip cap is passed, stop and report.
- Configured gates pass; evidence recorded under `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/shelf/chart/View.tsx`
- `packages/astraeus/src/shelf/chart/factory.ts` (`ChartData`, `ChartState`, `extentOf`)
- `packages/astraeus/tests/lifecycle.test.ts` (the "chart (O-081 T-337)" case only)
- `packages/astraeus/CHANGELOG.md` (top section only)
- `docs/architecture/viewer-interface.md` section 11 (the parts table)
- `/home/user/code/belt/docs/astraeus-improvements.md` row 18 (read only)

## Design References

`.savepoint/Design.md` under `Viewer interface`; viewer-interface note section 11 (the `chart` row).

## Guardrails

TEST-01, TEST-02, TEST-03, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Write `tests/chartSummary.test.ts` and see it fail (no marks in the summary).
2. `chartSummary` takes the drawn marks; the marks clause.
3. With the owner's approval recorded, the one expected string in `lifecycle.test.ts`; CHANGELOG line, viewer-interface row.
4. `npm run check:pack`, `npm run check:shelf-split`.

## Boundaries

No live region on the chart (marks are fixed; `setBins`/`setHighlight` stay unannounced, outside O-098); no change to bars, labels, rows, ticks, highlight or colours; no new chart input; no edit to the catalogue example; no existing test edited beyond the one approved expected string; no browser step added.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/chartSummary.test.ts packages/astraeus/tests/chartMarkRows.test.ts packages/astraeus/tests/lifecycle.test.ts packages/astraeus/tests/twoViewers.test.ts packages/astraeus/tests/shelfInputTable.test.ts`. Handoff: the configured gates, `npm run check:pack` and `npm run check:shelf-split`. No browser step: the summary is a string on one attribute, fully shown by happy-dom; the existing `catalogue` step still draws the chart at the Full Check. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Files changed: packages/astraeus/src/shelf/chart/View.tsx (new `drawnMarks`, shared by drawing and summary; `chartSummary(axisLabel, state, marks)` with the marks clause), packages/astraeus/tests/chartSummary.test.ts (new), packages/astraeus/tests/lifecycle.test.ts (one expected string, lines 1067-1069, per Owner answer 1), packages/astraeus/CHANGELOG.md (one 0.11.0 line), docs/architecture/viewer-interface.md (chart row).

| Done When | Evidence |
|---|---|
| Summary text | chartSummary tests: Kirkwood order, no marks, outside bins, before highlight |
| Component test | tests/chartSummary.test.ts (pure cases + happy-dom render, cell.set standing in for setBins drops the 2:1 mark) |
| Existing tests | chartMarkRows, twoViewers, shelfInputTable pass unedited; lifecycle passes with the one approved string |
| CHANGELOG | one Fixed line in 0.11.0 |
| Docs | viewer-interface section 11 chart row |
| Size | check:shelf-split ok; check:pack pass, engine 525,880 B gzip (cap 527,000) |
| Gates | typecheck ok; eslint + prettier on changed files ok; vitest chartSummary, chartMarkRows, lifecycle, twoViewers, shelfInputTable: 5 files, 259 tests pass (before the final prettier reformat of the new test file, rerun green) |

Red-first not separately shown (summary had no marks clause, so the new cases cannot pass on the old code: signature differed). Limitations: none.

## Drift Notes

None.
