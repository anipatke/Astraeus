---
id: O-100
title: A chart never takes the viewer down
status: done
depends_on: []
release: G-027
last_check: C-223
priority: critical
rank: 1
lanes: [{key: chart, title: Chart view}, {key: boundary, title: Part boundary}]
---

# O-100: A chart never takes the viewer down

## Outcome

A `chart` lays out its mark labels in one pass and settles, whatever the browser's layout does, so the belt's chart (belt #34) draws at every size; a shelf part that fails for any reason shows a short message in its own place and never unmounts the viewer; and a chart's long axis label wraps inside its panel (belt #35).

## Why

On 0.11.0 the belt's Kirkwood chart (marks 3:1, 8:3, 11:4 at 2.50, 2.52, 2.54 and a 44-character label at 2.82, bins 2.00 to 4.00 au) throws "Maximum update depth exceeded" at 1440x900 and the whole viewer disappears: no canvas, bar or panel. G-027 Why, finding 1, has the cause and a unit-test reproduction. The axis label is the one shelf text that still clips in a 360 px panel.

## Success Conditions

- **Settles.** The chart measures its labels and places its rows with no state loop: a render whose label widths depend on the chart's own height (the reproduction in G-027 finding 1) draws and stops, where 0.11.0 throws. Labels still follow the host's text size (I-207). Proven by a new unit test that fails on 0.11.0 (T-455).
- **Contained.** Every shelf part is drawn inside an error boundary: a part that throws shows a short message in its own place (a panel block, a panel, the tile and its sheet), the rest of the panel, the bar and the canvas stay, and the error is reported to the page (`reportError`). Proven by a unit test with a part whose view throws (T-456).
- **Wraps.** A long `axisLabel` wraps inside the panel (Decision 6 picks how); the existing `catalogue` browser step passes unedited at both its sizes (T-457).
- No existing test or browser assertion is edited, removed or loosened, except the three named in G-027 Decision 6 (a), and only if the owner picks it.
- CHANGELOG has one `Fixed` line for each; viewer-interface section 11 states the boundary and the caption. No breaking change.
- Engine first download stays under its 527,000 B gzip cap (expected +150 to +300 B, from the boundary; the chart's code is in its own chunk).

## Architectural Considerations

- The shell never imports a shelf module (viewer-interface section 11, `check:shelf-split`): the boundary is shell code that wraps `part.view` where the shell draws it (`shell/useShelfPanels.tsx`, `shell/useShelfTile.tsx`) and where a panel draws its blocks (`shelf/panel/View.tsx`, which may import from `shell/`, as it does `useSwipeToDismiss`).
- `app/PanelLoadBoundary.tsx` is the existing boundary for lazily loaded panels; the part boundary may share its shape but keeps its own message.
- The chart's code stays in its own chunk; the chart takes no new input (no per-mark row or anchor).

## Boundaries

**In scope:** `shelf/chart/View.tsx`, `markRows.ts` if needed, `part.css`; a part boundary in `shell/`; the three mount sites; tests; CHANGELOG; viewer-interface section 11.

**Out of scope:** chart ticks and highlight colour; any other look change; new chart input; group labels (O-101); browser checks at the belt's exact sizes (the belt's own check after release, G-027).

## Design Confirmation

Pending: the owner reviews this plan (planning session plan-g027-20261124). T-457 waits on G-027 Decision 6.

## Closure

Full Objective Check C-222 NEEDS WORK (I-208, a failed tile's boundary not reset on a view switch) superseded by recheck C-223 CLEAR on 2026-11-24 (I-208 verified). Owner looked at T-457 on localhost:5490 ("Looks good"; acceptance recorded against C-223). Marked done and merged by the coordinator under the owner's "orchestrate the rest of the goal" (standing rule: CLEAR → merge and push). Released with O-101 as 0.12.0.
