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

Named in full when this Objective is detailed. Headline: one browser check that no panel part spills sideways (scrollWidth within the panel) for every shelf part at 1440x900 and 390x844, rather than one check per part; clustered chart marks show no overlapping label boxes at both sizes.

## Boundaries

**In scope:** panel block min-width and wrapping in the shared panel CSS, chip-row wrapping, the chart's mark-label layout.

**Out of scope:** chart ticks and highlight colour, any other look change.
