---
id: O-097
title: Panel text and chart labels never clip or overprint
status: planned
depends_on: [O-096]
release: G-025
priority: medium
rank: 3
---

# O-097: Panel text and chart labels never clip or overprint

## Outcome

A long unbreakable word, title or note wraps inside a panel instead of widening it and clipping every block (belt #30), and chart mark labels are laid out so no two overlap, dropping to further rows as needed (belt #18, layout half).

## Why

Lost content: today a 360 px panel lays out at 1,644 px and clips on the right, and close Kirkwood marks print as "5:27:32:1".

## Success Conditions

- A 120-character word with no break opportunity, put into any wrapping text of a running shelf part (panel title; explainer heading, paragraphs, notes; chip and key labels and notes; action labels; custom-block text; the readout tile's card and sheet), wraps inside the panel: the panel's `scrollWidth` stays within its `clientWidth` (1 px slack) and no element passes its right edge, for all eight shelf parts at 1280x720 and 375x667 with touch, in one check in the `catalogue` browser step (T-451).
- The fix is one shared rule in the shared panel CSS (`.info-panel`, which also covers About, a body's card and the tile card and sheet, and `.story-panel`), with a part's own sheet touched only where the shared rule cannot reach; a CSS test fails if the rule is lost (T-449). Text that fits lays out as before; a short button label (Close) never breaks beside a long title; the look tests pass unedited.
- Chart mark labels never overlap: a label that would overlap drops to a further row above the bars and the chart grows a row taller for each; each label stays inside the chart's width (a label wider than the whole chart is clipped at the edge, a stated limit). A chart whose labels fit on one row draws exactly as today (`viewBox` 0 0 320 156). Proven by a unit test on the Kirkwood case (3:1, 5:2, 7:3, 2:1) and in the `catalogue` step on the catalogue chart, which gains a second close mark: no two label boxes overlap and at least two rows are used, at both sizes (T-450, T-451).
- The two new browser checks fail when their fix is taken out (recorded once in T-451). No existing test or browser assertion is edited, removed or loosened.
- CHANGELOG 0.11.0 has one `Fixed` line for each (no breaking change); viewer-interface section 11 states both rules.
- Engine first download stays under its 527,000 B gzip cap (expected +40 to +170 B; the chart's JS is in its own chunk). The `catalogue` step's time is measured three times; its limit rises only to cover the new checks, with the measured times as the reason.

## Design Confirmation

Owner confirmed this design at Goal level on 2026-11-22 (G-025 Outcome; "correctness only, no restyling and no new look options beyond what a fix needs"). Tasks detailed in planning session plan-o097-20261124.

## Decisions

- Planner, 2026-11-24: sizes. The checks run at the `catalogue` step's existing sizes, 1280x720 and 375x667 with touch, not 1440x900 and 390x844 as first named. Both pairs fall in the same layouts (the panel's width is capped by `--astraeus-panel-width` on a wide viewer; a phone viewer is a sheet under the 700 px rule), and adding two sizes would roughly double the step's 7 s against its 10 s limit.
- Planner, 2026-11-24: one browser check covers every part by putting a long word into every wrapping text of each running part's open panel through the driver (reading the page's own boxes, no screenshot), instead of stress text in eight public examples. Text that is one line by design (`white-space: nowrap`: the tile's strip and scale labels) and the chart's SVG text are left out of that check.
- Planner, 2026-11-24: chart label widths are measured in the browser after drawing (a per-character estimate only where no measurement exists, as in happy-dom), so the rows follow the host's text size; no new chart input (no per-mark row or anchor field), as G-025 allows no new look options.
- Planner, 2026-11-24: the chart's screen-reader summary naming its marks is belt #18's other half and belongs to O-098.
- Owner, 2026-11-24 ("Yes, change both"): the explainer catalogue example's note gains the long file name and the bar chart example gains a second mark close to "Limit".
- Owner, 2026-11-24: "orchestrate O-97". Standing orchestration rules: own branch, Sonnet builders (T-449 and T-450 in parallel, then T-451), optional step checks waived, coordinator marks steps done when gates pass, owner look on localhost:5490 for T-449 and T-450 before T-451 and one Full Objective Check.

## Boundaries

**In scope:** panel block min-width and wrapping in the shared panel CSS, chip-row wrapping, the chart's mark-label layout.

**Out of scope:** chart ticks and highlight colour, any other look change.
