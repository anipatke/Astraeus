---
id: T-455
title: Chart labels settle in one pass
objective: O-100
status: planned
depends_on: []
check_waiver: {task: T-455, reason: 'Owner chose "Chart first" for G-027 (2026-11-24), to be built while the label questions were answered: standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g027-20261124}, recorded_at: '2026-11-24T09:55:03Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g027-20261124}
lane: chart
planned_reads: [packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/src/shelf/chart/markRows.ts, packages/astraeus/src/shelf/chart/factory.ts, packages/astraeus/tests/chartMarkRows.test.ts, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/src/shelf/chart/markRows.ts, packages/astraeus/tests/chartSettles.test.ts, packages/astraeus/CHANGELOG.md]
---

# Chart labels settle in one pass

## Outcome

A `chart` measures its mark labels, places their rows and stops: no change the chart's own drawing causes (a row more or less, a taller or shorter chart, the panel's layout moving with it) can make it measure and re-place again in a loop. The belt's chart (belt #34) draws instead of throwing "Maximum update depth exceeded" and taking the viewer down. Labels still follow the host's text size (I-207).

## User Check

None beyond the Objective's: the loop needs a browser's layout and font hinting to show, and the belt checks its exact chart after release (G-027). The unit test below is the proof.

## Done When

- **Cause, as found (G-027 finding 1).** `View.tsx`'s layout effect measures widths and the label box height after every draw and sets state when they differ; rows follow widths and the chart's height follows rows. When the measured width depends on the chart's height (a browser's panel gaining a scrollbar or a new scale), a label at a row boundary flips rows each draw and React stops at its nested-update limit.
- **Fix: measure, place, done.** Widths and the row pitch are measured at most once for each measure key, and the drawn rows can never feed back into the measure. The key is what can really change a label's size: the drawn label texts and the label's computed font (size and family, read with `getComputedStyle` on a label), so a host text-size change still re-measures once (I-207). A measure that disagrees with the one already taken for the same key is ignored, not stored. The per-character estimate stays the fallback where no measurement exists (happy-dom, 0). The builder may choose the mechanism (a keyed ref, or measuring off the drawn layout) as long as this holds and no new chart input is added.
- **Unit test**, new `packages/astraeus/tests/chartSettles.test.ts` (TEST-02), happy-dom, in the render pattern of `tests/chartMarkRows.test.ts` (which is not edited):
  - The belt's input: 40 bins over 2.00 to 4.00, marks "3:1" at 2.50, "8:3" at 2.52, "11:4" at 2.54 and a 44-character label at 2.82. `getComputedTextLength` for the long label returns 205 when the SVG's viewBox height is above 156 + 2 rows and 225 otherwise (others 6 per character), `getBBox` height 14. The render completes with no error, the SVG is in the document, and two later reads of the viewBox are equal. Recorded once in Technical Evidence: this case throws "Maximum update depth exceeded" on the code before the fix (it did in planning, 212 measures).
  - The same chart with fixed widths places the long label in the row the pure layout gives (`placeMarkRows` on the measured widths), so the fix keeps the layout.
  - A label font-size change (a style on the chart's root changing `getComputedStyle(...).fontSize`, with widths that scale with it) re-measures once and moves the rows; a second render with no change does not measure again.
- **Existing tests unchanged:** `tests/chartMarkRows.test.ts`, `tests/chartSummary.test.ts`, `tests/lifecycle.test.ts` chart case and `tests/twoViewers.test.ts` chart bars pass unedited. If any turns red, stop and report it.
- **CHANGELOG** (`packages/astraeus/CHANGELOG.md`): open `## 0.11.1 (unreleased)` at the top if absent; one `Fixed` line: "A `chart` whose mark labels sit at a row boundary no longer loops and takes the viewer down (\"Maximum update depth exceeded\"): labels are measured once for their text and font, then placed."
- **Size.** Chart code is in its own chunk: `npm run check:pack` and `npm run check:shelf-split` pass; report the engine first-download figure.
- Configured gates pass; evidence recorded under `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/shelf/chart/View.tsx`
- `packages/astraeus/src/shelf/chart/markRows.ts`
- `packages/astraeus/src/shelf/chart/factory.ts` (`ChartData`, `extentOf` only)
- `packages/astraeus/tests/chartMarkRows.test.ts` (render pattern)
- `/tmp/claude-1000/-home-user-code-Astraeus/f266d901-c073-4eb8-baf9-350fdac2266d/scratchpad/g027/repro-34.test.ts.txt` (the planning reproduction; if the scratch file is gone, G-027 finding 1 describes it)
- `packages/astraeus/CHANGELOG.md` (top section only)

## Design References

`.savepoint/Design.md` under `Viewer interface`; `docs/architecture/viewer-interface.md` section 11 (the `chart` row). G-027 Why, finding 1.

## Guardrails

TEST-01, TEST-02, STYLE-01, STYLE-02, CODE-01.

## Implementation Plan

1. Copy the reproduction into `tests/chartSettles.test.ts` as a proper test; see it fail.
2. Key the measure on label texts and computed font; store a measure once per key; ignore a differing measure for the same key.
3. Add the fixed-width and font-change cases.
4. Run the existing chart tests unedited; CHANGELOG; `check:pack`, `check:shelf-split`.

## Boundaries

No new chart input or option; no change to bars, ticks, axis label (T-457), highlight, colours or summary text; no change to `markRows.ts`'s rule unless the fix needs a pure helper there; no edit to any existing test; no shell or boundary work (T-456).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/chartSettles.test.ts packages/astraeus/tests/chartMarkRows.test.ts packages/astraeus/tests/chartSummary.test.ts packages/astraeus/tests/lifecycle.test.ts packages/astraeus/tests/twoViewers.test.ts`. Handoff: the configured gates, `npm run check:pack`, `npm run check:shelf-split`. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas for the planner.
